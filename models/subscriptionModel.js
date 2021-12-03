const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    require: [true, 'A subscription must have an endpoint!']
  },
  keys: {
    auth: {
      type: String,
      require: [true, 'A subscription must have an auth key!']
    },
    p256dh: {
      type: String,
      require: [true, 'A subscription must have an p256dh key!']
    }
  },
  expirationTime: String
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
