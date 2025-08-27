const Order = require('../Models/order-model');
const Inventory = require('../Models/inventory-model');
const Product = require('../Models/product-model');
const User = require('../Models/user-model'); // Import the User model
const { createNotification } = require('./notification-controller');

const createOrder = async (req, res) => {
    const buyerId = req.user.id;
    const { items, customerInfo } = req.body;

    try {
        let totalAmount = 0;
        const productIdsForAdmin = [];
        const orderItems = [];

        // Prepare items with seller info and calculate total
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ error: `Product ${item.product} not found` });
            }

            const inventory = await Inventory.findOne({ productId: item.product });
            if (!inventory || inventory.quantityAvailable < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
            }

            totalAmount += product.price * item.quantity;
            productIdsForAdmin.push(product._id);

            // Include seller in the order item
            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
                seller: product.seller,
            });
        }

        // Deduct inventory
        for (const item of items) {
            await Inventory.findOneAndUpdate(
                { productId: item.product },
                {
                    $inc: { quantityAvailable: -item.quantity },
                    $set: { lastRestockedDate: new Date() }
                }
            );
        }

        // Create order
        const order = new Order({
            buyer: buyerId,
            items: orderItems,
            totalAmount,
            status: 'confirmed',
            paymentStatus: 'paid',
            customerInfo
        });

        await order.save();

        // Notify each seller
        for (const item of orderItems) {
            if (item.seller) {
                const product = await Product.findById(item.product);
                await createNotification({
                    title: 'New Order Placed',
                    message: `Your product "${product.name}" has been purchased!`,
                    type: 'orders',
                    senderId: buyerId,
                    recipientId: item.seller.toString(),
                    recipientRole: 'seller',
                    productId: product._id.toString(),
                    meta: { orderId: order._id.toString() }
                });
            }
        }

        // Notify admin
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            const buyer = await User.findById(buyerId).select('name email');
            const sellerDetails = await Promise.all(
                [...new Set(orderItems.map(item => item.seller.toString()))].map(async sellerId => {
                    const seller = await User.findById(sellerId).select('name email');
                    return { sellerId, name: seller.name, email: seller.email };
                })
            );

            // Corrected: productIdsForAdmin is now correctly passed in meta
            await createNotification({
                title: 'New Order Placed',
                message: `Order #${order._id} placed by ${buyer.name}`,
                type: 'orders',
                senderId: buyerId,
                recipientId: adminUser._id.toString(),
                recipientRole: 'admin',
                productId: null,
                meta: {
                    orderId: order._id.toString(),
                    buyer: {
                        id: buyerId,
                        name: buyer.name,
                        email: buyer.email,
                    },
                    sellers: sellerDetails,
                    productIds: productIdsForAdmin.map(id => id.toString()),
                },
            });
        }

        // Return populated order with seller and buyer info
        const populatedOrder = await Order.findById(order._id)
            .populate('buyer', 'name email')
            .populate('items.seller', 'name email')
            .populate('items.product', 'name price');

        res.status(201).json({ message: 'Order placed successfully', order: populatedOrder });

    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Order placement failed' });
    }
};


const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email')
    .populate('items.product', 'name price');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};
const getSellerOrderDetail = async (req, res) => {
  try {
    const { id } = req.params; // order ID
    const sellerId = req.user._id; // logged-in seller

    // Populate buyer & product & seller info
    const order = await Order.findById(id)
      .populate('buyer', 'name email')
      .populate('items.product', 'name price')
      .populate('items.seller', 'name email');

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Filter items that belong to this seller
    const sellerItems = order.items.filter(
      item => item.seller._id.toString() === sellerId.toString()
    );

    if (!sellerItems.length) {
      return res.status(403).json({ error: "No items for this seller in this order" });
    }

    // Calculate seller total
    const sellerTotalAmount = sellerItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    res.json({
      _id: order._id,
      buyer: order.buyer,
      customerInfo: order.customerInfo,
      items: sellerItems,
      sellerTotalAmount, // ✅ total for this seller
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt
    });

  } catch (err) {
    console.error("Error fetching seller order detail:", err);
    res.status(500).json({ error: "Server error" });
  }
};



// ✅ Update order status by seller (only their items)

const getAllOrders = async (req, res) => {
  const role = req.user.role;

  let filter = {};
  if (role === 'buyer') filter.buyer = req.user.id;
  if (role === 'seller') filter['items.product'] = { $exists: true };

  const orders = await Order.find(filter).populate('buyer', '-role -password').populate('items.product');
  res.json(orders);
};

// update seller order item status
// Backend Controller
// Backend Controller
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isSeller = order.items.some(item => item.seller.toString() === sellerId);
    if (!isSeller) {
      return res.status(403).json({ error: "You are not authorized to update this order" });
    }

    order.status = status;
    await order.save();
    
    const updatedOrder = await Order.findById(id)
      .populate('items.product')
      .populate('items.seller', 'name');

    // ✅ Add notification to buyer for status change
    await createNotification({
      title: 'Order Status Updated',
      message: `Your order #${updatedOrder._id} has been updated to "${status}".`,
      type: 'orders',
      senderId: sellerId,
      recipientId: updatedOrder.buyer.toString(), // Send to the buyer of the order
      recipientRole: 'buyer',
      meta: {
        orderId: updatedOrder._id.toString(),
        newStatus: status,
      }
    });
      
    res.json({ message: "Order updated successfully", order: updatedOrder });

  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Server error" });
  }
};



const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isOwner = order.buyer.toString() === req.user.id;
  const canDelete = req.user.role === 'admin' || isOwner;

  if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: 'Order deleted' });
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('items.product', 'name price')
      .populate('buyer', 'name email');
    res.json(orders);
  } catch (err) {
    console.error('Order history error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
};
// In your backend order-controller.js file
const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user.id;
        
        // Find all products that belong to the current seller
        const sellerProducts = await Product.find({ seller: sellerId }).select('_id');
        const sellerProductIds = sellerProducts.map(product => product._id);
        console.log("Seller's products IDs:", sellerProductIds); // Check this log!

        const orders = await Order.find({
            'items.product': { $in: sellerProductIds }
        })
        .populate('buyer', 'name email')
        .populate('items.product', 'name price');
        console.log("Found orders:", orders); // Check this log!

        // If you're filtering, check the filtered result too
        const filteredOrders = orders.map(order => {
            const sellerItems = order.items.filter(item =>
                sellerProductIds.some(id => id.equals(item.product._id))
            );
            return { ...order.toObject(), items: sellerItems };
        });
        console.log("Filtered orders to send:", filteredOrders); // Check this log!

        res.json(filteredOrders);
    } catch (err) {
        console.error("Get Seller Orders error:", err.message);
        res.status(500).json({ error: 'Failed to retrieve seller orders' });
    }
};

// ... existing controller functions (createOrder, getMyOrders, etc.)


module.exports = {
  createOrder,
  getSellerOrders,
  getSellerOrderDetail,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getMyOrders
};
