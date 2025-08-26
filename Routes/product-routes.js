const express = require('express');
const router = express.Router();
const {
  getPublicProducts,
  getPublicProductById,
  getAllProducts,
  getProductById,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
} = require('../Controller/product-controller');

const { authenticate, isAdmin, isSeller } = require('../middlware/authMiddlware');
const upload = require('../middlware/UploadMiddleware'); // for image uploads

// 🔹 Public Routes

router.get('/public', getPublicProducts);
router.get('/public/:id', getPublicProductById);
router.get('/related', getRelatedProducts);

// 🔹 Admin Routes

router.get('/admin/all',authenticate,isAdmin,getAllProducts)
// 🔹 Seller Routes
router.get('/seller-products', authenticate, isSeller, getSellerProducts);
router.post(
  '/create',
  authenticate,
  isSeller,
  upload.fields([{ name: 'images', maxCount: 20 }]),
  createProduct
);
router.put('/:id', authenticate,  upload.fields([{ name: 'images', maxCount: 20 }]), updateProduct);
router.delete('/seller/:id', authenticate, isSeller, deleteProduct);

module.exports = router;