const express = require('express');
const {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getMyOrders,
  getSellerOrders,
  getSellerOrderDetail
} = require('../Controller/order-controller');
const { authenticate } = require('../middlware/authMiddlware');

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/seller-orders', authenticate, getSellerOrders);
router.get('/:id', authenticate, getOrderById);
router.get('/seller-orders/:id', authenticate,  getSellerOrderDetail); // Assuming this is for seller order details
router.get('/', authenticate, getAllOrders);
router.put('/:id/status', authenticate, updateOrderStatus);
router.delete('/:id', authenticate, deleteOrder);

module.exports = router;