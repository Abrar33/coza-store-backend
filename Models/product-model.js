const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  category: {
    type: String,
    required: true
  },
subCategory: {
    type: String,},
  stock: {
    type: Number,
    default: 0
  },

  sale: {
    type: Boolean,
    default: false
  },

  tags: {
    type: [String],
    enum: ['summer', 'winter', 'men', 'new arrival', 'features'],
    default: []
  },

  variations: [
    {
      images: [{ type: String, required: true }],
      size: { type: String },
      color: { type: String, }
    }
  ],

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
status:{ 
  type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'},
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);

