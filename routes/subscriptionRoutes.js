const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

router.route('/').post(subscriptionController.createReview);
