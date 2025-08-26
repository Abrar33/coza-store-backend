const NotificationController = require('../Controller/notification-controller');
const User = require('../Models/user-model');
const notifyAdminsOfNewProduct = async (product, seller) => {
  const admins = await User.find({ role: 'admin' }).select('_id name email');
  return Promise.all(admins.map(admin =>
    NotificationController.createNotification({
      title: 'New product pending approval',
      message: `${seller.name} created "${product.name}".`,
      type:"products",
      productId: product._id,
      senderId: seller._id,
      recipientId: admin._id,
      recipientRole: 'admin'
    })
  ));
};


const notifySellerOfApproval = async (product, admin) => {
  return NotificationController.createNotification({
    title: 'Product Approved',
    message: `Your product "${product.name}" has been approved.`,
      type:"products",

    productId: product._id,
    senderId: admin._id,
    recipientId: product.seller._id,
    recipientRole: 'seller',
  });
};

module.exports = {
  notifyAdminsOfNewProduct,
  notifySellerOfApproval,
};