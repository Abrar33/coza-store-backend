const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');

require('./db'); // Connect to MongoDB
const dashboardRoutes = require('./Routes/dashboard-route');
const userRoutes = require('./Routes/users-routes');
const productRoutes = require('./Routes/product-routes'); // ✅ Import product routes
const inventoryRoutes = require('./Routes/inventory-routes'); // ✅ Import inventory routes
const orderRoutes = require('./Routes/orders-routes'); // ✅ Import order routes
const adminRoutes = require('./Routes/adminRoutes'); // ✅ Import admin routes
const notificationRoutes = require('./Routes/notifications-route'); // ✅ Import notification routes
const cartRoutes = require('./Routes/cart-routes'); // ✅ Import cart routes
app.use(cors()); // ✅ Enable CORS

// After `app.use(express.json());`
app.use(
  '/uploads',

  express.static(path.join(__dirname, 'uploads'))
);
app.use(express.json()); // ✅ Parse JSON
app.use('/api/admin', adminRoutes); // ✅ Mount admin routes
app.use('/api/notifications', notificationRoutes); // ✅ Mount notification routes
app.use('/api/users', userRoutes); // ✅ Mount routes
app.use('/api/products',productRoutes ); // ✅ Mount product routes
app.use('/api/cart',cartRoutes); // ✅ Mount cart routes
app.use('/api/inventory', inventoryRoutes); // ✅ Mount inventory routes
app.use('/api/orders', orderRoutes); // ✅ Mount order routes
app.use('/api/dashboard', dashboardRoutes);
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});