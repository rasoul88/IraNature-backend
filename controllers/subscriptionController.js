const Subscription = require('../models/subscriptionModel');
const factory = require('./handlerFactory');

exports.createReview = factory.createOne(Subscription);
