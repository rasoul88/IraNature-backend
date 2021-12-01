const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/AppError');

const multerStorage = multer.memoryStorage();

const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('هیچ تصویری وجود ندارد. لطفا یک تصویر بارگذاری کنید', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerfilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
//upload.single('imageCover')
//upload.array('images',3)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  // console.log('files in resizeTourImages middleware', req.files);

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // 1) imageCover
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '3';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.4 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: -1 } },
    { $match: { _id: { $ne: 'easy' } } }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getMyCreatedTours = catchAsync(async (req, res, next) => {
  const myCreatedTours = await Tour.find({ creator: req.user._id }).sort({
    createdAt: -1
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: myCreatedTours
    }
  });
});
