const Inventory = require('../Models/inventory-model');
const Product = require('../Models/product-model');
const { createNotification } = require('./notification-controller');

// Create or update inventory (Admin only)
const upsertInventory = async (req, res) => {
  try {
    const { productId, quantityAvailable, warehouseLocation, minimumStockAlert } = req.body;

    // Find existing inventory
    let inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      // Create new inventory
      inventory = new Inventory({
        productId,
        quantityAvailable,
        warehouseLocation,
        minimumStockAlert,
      });
    } else {
      // Update inventory
      inventory.quantityAvailable = quantityAvailable ?? inventory.quantityAvailable;
      inventory.warehouseLocation = warehouseLocation ?? inventory.warehouseLocation;
      inventory.minimumStockAlert = minimumStockAlert ?? inventory.minimumStockAlert;
    }

    await inventory.save();

    // Sync product stock
    await Product.findByIdAndUpdate(productId, {
      stock: inventory.quantityAvailable,
    });

    return res.status(200).json({ message: "Inventory updated and product synced", inventory });
  } catch (err) {
    console.error("Inventory upsert error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get inventory by product (Admin only)
const getInventoryByProduct = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ productId: req.params.productId }).populate('productId');
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

module.exports={
    upsertInventory,
    getInventoryByProduct
}