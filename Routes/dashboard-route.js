// routes/dashboard-route.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlware/authMiddlware');
const { getDashboardStats } = require('../Controller/dashboard-controller');

router.get('/stats', authenticate, getDashboardStats);

module.exports = router;
