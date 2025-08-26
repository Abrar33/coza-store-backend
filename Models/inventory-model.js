const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantityAvailable: {
    type: Number,
    required: true
  },
  lastRestockedDate: {
    type: Date,
    default: Date.now
  },
  warehouseLocation: {
    type: String
  },
  minimumStockAlert: {
    type: Number
  }
});
InventorySchema.post("save", async function (doc) {
  const Product = require("./product-model");
  await Product.findByIdAndUpdate(doc.productId, {
    stock: doc.quantityAvailable,
  });
});

module.exports = mongoose.model('Inventory', InventorySchema);