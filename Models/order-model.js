const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add new fields to store customer information from the checkout form
  customerInfo: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      seller:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},//Add seller field to track who sold the product
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
 
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
// const mongoose = require('mongoose');

// const OrderSchema = new mongoose.Schema({
//   buyer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   customerInfo: {
//     name: { type: String, required: true },
//     address: { type: String, required: true },
//     city: { type: String, required: true },
//     zip: { type: String, required: true },
//     country: { type: String, required: true },
//     phone: { type: String, required: true },
//     email: { type: String, required: true }
//   },
//   items: [
//     {
//       product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product',
//         required: true
//       },
//       quantity: {
//         type: Number,
//         required: true
//       },
//       seller: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'User', 
//         required: true 
//       },
//       // ✅ Status is now correctly defined for each item
//       status: {
//         type: String,
//         enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
//         default: 'pending' // Or a relevant initial status
//       },
//     }
//   ],
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   // ❌ The top-level status field is removed to avoid conflicts
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed'],
//     default: 'pending'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Order', OrderSchema);