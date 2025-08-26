const express = require('express');
// const { signup } = require('../Controller/product-controller');
// const { signup, signin, verifyOtp } = require('../Controller/user-controller');
const { signup, signin, verifyOtp } = require('../Controller/user-controller');
const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/signin', signin);

module.exports = router;