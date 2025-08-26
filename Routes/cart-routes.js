const express = require('express');
const router = express.Router();
const cartController = require('../Controller/cart-controller'); // Import the new controller
const { authenticate, isSeller, isBuyer } = require('../middlware/authMiddlware'); // Assuming this is your JWT auth middleware

// Get the user's cart
// GET /api/cart
router.get('/', authenticate,isBuyer, cartController.getCart);

// Add a product to the cart
// POST /api/cart/add
router.post('/add', authenticate, cartController.addToCart);

// Update a product's quantity in the cart
// PUT /api/cart/update
router.put('/update', authenticate, cartController.updateCartItem);

// Remove a product from the cart
// DELETE /api/cart/remove
router.delete('/remove', authenticate, cartController.removeCartItem);

module.exports = router;