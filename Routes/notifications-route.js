const express = require('express');
const router = express.Router();
const {createNotification,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,} = require('../Controller/notification-controller');
const { authenticate, isAdmin } = require('../middlware/authMiddlware');

// Get all notifications for admin
router.get('/', authenticate,  getNotificationsForUser);

// Mark one as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all as read
router.patch('/read-all', authenticate, markAllAsRead);

// Delete a notification
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;