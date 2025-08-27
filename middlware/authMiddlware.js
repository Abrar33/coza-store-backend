// const jwt = require('jsonwebtoken');
// const User = require('../Models/user-model');

// // Verify JWT and attach user to request
// exports.authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

//   if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // { id, role }
//     next();
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid token.' });
//   }
// };

// // Role checkers
// exports.isAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ error: 'Forbidden: Admins only.' });
//   }
//   next();
// };

// exports.isSeller = (req, res, next) => {
//   if (req.user.role !== 'seller') {
//     return res.status(403).json({ error: 'Forbidden: Sellers only.' });
//   }
//   next();
// };

// exports.isBuyer = (req, res, next) => {
//   if (req.user.role !== 'buyer') {
//     return res.status(403).json({ error: 'Forbidden: Buyers only.' });
//   }
//   next();
// }
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../Models/user-model');

// Verify JWT and attach full user document to request
exports.authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    req.user = user; // Attach full user
    console.log(user)
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Your role-checking middlewares remain correct and will now work as intended
exports.isAdmin = (req, res, next) => {
  // Now safely accesses the role from the full user document
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only.' });
  }
  next();
};

exports.isSeller = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Forbidden: Sellers only.' });
  }
  next();
};

exports.isBuyer = (req, res, next) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ error: 'Forbidden: Buyers only.' });
  }
  next();
};