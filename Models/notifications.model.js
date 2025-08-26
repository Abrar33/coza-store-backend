const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String },
  message: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered it
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // target user (seller/admin)
  recipientRole: { type: String, enum: ['admin', 'seller', 'buyer'], default: null }, // or null if recipientId present
  seen: { type: Boolean, default: false },
  meta: { type: Object }, // any extra info
  createdAt: { type: Date, default: Date.now },
  firestoreId: { type: String }, // optional Firestore ID for real-time updates
    type: {
    type: String,
    enum: ['orders', 'products', 'inventory', 'users', 'system'], // Example types
    required: true, // This field should not be optional
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
