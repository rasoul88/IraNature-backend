const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
var webpush = require('web-push');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');

const app = express();

//set web-push confiquration
var publicVapidKey =
  'BKMOXd1ARsXXz97HxAFb6tU2BmVdhDJkvpscv77UWadgtLidzKZUxHMloFHdOx18kuYxHkYUTHGzbW0I_cwwAyE';
var privateVapidKey = '4-Vy1ZZQIEeUD6u8v53V7ElOM5DGalDTz1LJe8RhDW8';
webpush.setVapidDetails(
  'mailto:iranature.co@gmail.com',
  publicVapidKey,
  privateVapidKey
);

// 1) GLOBAL MIDDLEWARES
// Implement CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://irnature-9h8erpxss-rasoul88.vercel.app'
  ],
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200
};
app.use(cors(corsOptions));
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options('*', cors(corsOptions));
// app.options('/api/v1/tours/:id', cors());

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
