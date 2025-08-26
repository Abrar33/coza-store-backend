// const Cart = require('../Models/cart-model'); 
const Cart =require('../Models/Cart-model')
const Product = require('../Models/product-model');

const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create a new cart for the user if one doesn't exist
      cart = new Cart({ user: userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Find the item in the cart. Use ._id to correctly compare ObjectIds.
    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      // If the product is already in the cart, update the quantity
      existingItem.quantity += quantity;
    } else {
      // Otherwise, add a new item
      cart.items.push({ product: productId, quantity });
    }
    
    await cart.save();
    res.status(200).json({ message: 'Item added to cart successfully', cart });
  } catch (err) {
    console.error('Add to cart error:', err.message);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
}; 
const updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the item in the cart
    const itemToUpdate = cart.items.find(item => item.product.toString() === productId);
    if (!itemToUpdate) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    // Update the quantity
    itemToUpdate.quantity = quantity;
    
    // Remove the item if quantity is zero or less
    if (itemToUpdate.quantity <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    }

    await cart.save();
    res.json({ message: 'Cart item updated', cart });
  } catch (err) {
    console.error('Update cart error:', err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
};
const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price variations');
    console.log(cart.items[0].product)
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.json(cart);
  } catch (err) {
    console.error('Get cart error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
};
const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOneAndDelete({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('Clear cart error:', err.message);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};
const removeCartItem = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Filter out the item to remove
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    await cart.save();
    res.json({ message: 'Product removed from cart', cart });
  } catch (err) {
    console.error('Remove cart error:', err.message);
    res.status(500).json({ error: 'Failed to remove item' });
  }
};
module.exports = {
  addToCart,
    updateCartItem,
    getCart,
    clearCart,
    removeCartItem}