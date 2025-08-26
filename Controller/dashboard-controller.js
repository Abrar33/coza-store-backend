const Order = require('../Models/order-model');
const User = require('../Models/user-model');
const Product = require('../Models/product-model');

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const totalSales = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const ordersToday = await Order.countDocuments({ createdAt: { $gte: todayStart } });

    const activeUsers = await User.countDocuments(); // Optional: use last login for actual active count

    const totalOrders = await Order.countDocuments();
    const conversionRate = totalOrders / (activeUsers || 1); // rough estimate

    // Monthly Revenue Graph (past 6 months)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // User Growth Graph
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          users: { $sum: 1 }
        }
      }
    ]);

    // Product Categories Graph
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent Activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'name')
      .populate('items.product', 'name');

    res.json({
      totalSales: totalSales[0]?.total || 0,
      activeUsers,
      ordersToday,
      conversionRate: (conversionRate * 100).toFixed(2),
      monthlyRevenue,
      userGrowth,
      categoryStats,
      recentOrders
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};
module.exports = {
  getDashboardStats
};