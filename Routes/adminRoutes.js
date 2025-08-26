const express = require('express');
const router = express.Router();

const { authenticate, isAdmin } = require('../middlware/authMiddlware');
const {approveProduct, getSellers, getAllUsersForAdmin, rejectProduct} = require('../Controller/admin-controller');
const { getProductById, getAllProducts, createProduct, updateProduct, deleteProduct } = require('../Controller/product-controller');
const { upsertInventory, getInventoryByProduct } = require('../Controller/inventory-controller');
const upload = require('../middlware/UploadMiddleware');

// 🔹 Product Routes (Admin only)
router.post('/products/create', authenticate, isAdmin,upload.fields([{ name: 'images', maxCount: 20 }]), createProduct); // Admin can create products
router.get('/products', authenticate, isAdmin, getAllProducts);
router.get('/products/:id', authenticate, isAdmin, getProductById);
router.patch('/products/:id', authenticate, isAdmin, updateProduct); // Admin can update products
router.delete('/products/:id', authenticate, isAdmin, deleteProduct); // Admin can delete products

// 🔹 Product Approval Routes
router.patch('/products/:id/approve', authenticate, isAdmin, approveProduct);
router.patch('/products/:id/reject', authenticate, isAdmin, rejectProduct);

// 🔹 Inventory Routes (Admin only)
router.post('/inventory', authenticate, isAdmin, upsertInventory);
router.get('/inventory/:productId', authenticate, isAdmin, getInventoryByProduct);

// 🔹 User and Seller Routes
router.get('/users', authenticate, isAdmin, getAllUsersForAdmin);
router.get('/sellers', authenticate, isAdmin, getSellers);

module.exports = router;