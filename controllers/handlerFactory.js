const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const APIFeatures = require('../utils/apiFeatures');
var webpush = require('web-push');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('داده ای مطابق با این شناسه وجود ندارد', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

exports.updateOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('داده ای مطابق با این شناسه وجود ندارد', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.createOne = Model => {
  return catchAsync(async (req, res, next) => {
    if (req.user) req.body.creator = req.user._id;
    const doc = await Model.create(req.body);

    //send notification if we create a new tour
    if (doc.destination) {
      //1) get all subscriptions
      //2) subscriptions.forEach(function (sub) {
      //   var pushConfig = {
      //     endpoint: sub.val().endpoint,
      //     keys: {
      //       auth: sub.val().keys.auth,
      //       p256dh: sub.val().keys.p256dh,
      //     },
      //   };
      //   webpush
      //     .sendNotification(
      //       pushConfig,
      //       JSON.stringify({
      //         title: "New Post",
      //         content: "New Post added!",
      //         openUrl: "/help",
      //       })
      //     )
      //     .catch(function (error) {
      //       console.log(error);
      //     });
      // });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.getOne = (Model, popOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('داده ای مطابق با این شناسه وجود ندارد', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });
};

exports.getAll = Model => {
  return catchAsync(async (req, res, next) => {
    //To allow for nested Get Reviews on tour (hack)
    console.log(req.query);
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    const AllDocsCount = await new APIFeatures(Model.find(filter), req.query)
      .filter()
      .query.count({});
    const pages =
      AllDocsCount % 8 === 0
        ? Math.floor(AllDocsCount / 8)
        : Math.floor(AllDocsCount / 8) + 1;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      AllDocsCount,
      pages,
      results: docs.length,
      data: {
        docs
      }
    });
  });
};
