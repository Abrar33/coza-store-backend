const NotificationController = require('./notification-controller');
const Product = require('../Models/product-model');
const User = require('../Models/user-model');
const userModel = require('../Models/user-model');
const order = require('../Models/order-model');

const approveProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId).populate('seller');
    if (!product) return res.status(404).json({ error: 'Product not found' });
     
    product.status = 'approved';
    await product.save();

    // Notify seller
    await NotificationController.createNotification({
      title: 'Product Approved',
      message: `Your product "${product.name}" has been approved by admin.`,
      productId: product._id,
      type:"products",
      senderId: req.user.id,
      recipientId: product.seller._id,
      recipientRole: 'seller',
    });

    res.json({ message: 'Product approved and seller notified', product });
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
};
const getSellers =async (req, res) => {
  try {
    const sellers = await userModel.find({role:"seller"}).select('name email _id'); // Fetch all sellers and select the fields you need
    res.status(200).json(sellers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
const getAllUsersForAdmin = async (req, res) => {
  console.log(res.token)
  try {
    const users = await User.find().select('-password'); // Exclude passwords for security

    const usersWithData = await Promise.all(
      users.map(async (user) => {
        let associatedData = null;

        if (user.role === 'seller') {
          // Find products for a seller
          associatedData = await Product.find({ seller: user._id });
        } else if (user.role === 'buyer') {
          // Find orders for a buyer
          associatedData = await order.find({ buyer: user._id });
        }

        return {
          ...user.toObject(), // Convert Mongoose document to a plain object
          associatedData,
        };
      })
    );

    res.status(200).json(usersWithData);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const rejectProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findById(productId).populate('seller');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Change the product status to 'rejected'
    product.status = 'rejected';
    await product.save();

    // Notify seller of the rejection
    await NotificationController.createNotification({
      title: 'Product Rejected',
      message: `Your product "${product.name}" has been rejected by admin due to policy violations.`,
      productId: product._id,
      type: "products",
      senderId: req.user.id,
      recipientId: product.seller._id,
      recipientRole: 'seller',
    });

    res.json({ message: 'Product rejected and seller notified', product });
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ error: 'Failed to reject product' });
  }
};
module.exports = {
  getAllUsersForAdmin,
  approveProduct,
  rejectProduct,
getSellers}