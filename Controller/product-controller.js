const Product = require("../Models/product-model");
const User = require("../Models/user-model");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { notifyAdminsOfNewProduct } = require("../services/notificationService");

// 🔹 Create Product (with variations and optional tags/sale)
const createProduct = async (req, res) => {
  try {
    // --- Handle Variations ---
    let rawVars = [];
    try {
      const raw = req.body.variations;
      console.log(raw);
      if (!raw) {
        rawVars = [];
      } else if (Array.isArray(raw)) {
        // case: FormData sends ["[{...}]"]
        rawVars = JSON.parse(raw[0]);
      } else if (typeof raw === "string") {
        // case: JSON string
        rawVars = JSON.parse(raw);
      } else {
        rawVars = [];
      }
    } catch (err) {
      console.error(
        "❌ Invalid variations JSON:",
        req.body.variations,
        err.message
      );
      return res.status(400).json({ error: "Invalid variations format" });
    }

    // --- Handle Uploaded Images ---
    const host = `${req.protocol}://${req.get("host")}`;
    const fileUrls =
      req.files?.images?.map((f) => `${host}/uploads/${f.filename}`) || [];

    let fileIndex = 0;
    rawVars.forEach((v) => {
      const count = Number(v.imageCount) || 0;
      v.images = fileUrls.slice(fileIndex, fileIndex + count);
      fileIndex += count;
      delete v.imageCount;
    });

    // --- Handle Tags ---
    const tagsArr = Array.isArray(req.body.tags)
      ? req.body.tags
      : req.body.tags?.split(",").map((tag) => tag.trim()) || [];

    // --- Get Seller Info ---
    const seller = await User.findById(req.user.id).select(
      "_id name email role"
    );

    if (!seller) {
      return res.status(400).json({ error: "Seller not found" });
    }

    // --- Create Product ---
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock || 0, // fallback if not passed
      seller: req.user.id,
      sale: req.body.sale === "true" || req.body.sale === true,
      tags: tagsArr,
      variations: rawVars,
      status: seller.role === "admin" ? "approved" : "pending",
    });

    await product.save();

    // --- Notify Admins (only if seller is not admin) ---
    if (seller.role !== "admin") {
      await notifyAdminsOfNewProduct(product, seller);
    }

    return res.status(201).json({
      message: "✅ Product created successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Product creation error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

// 🔹 Get All Products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("seller", "name email role");
    res.json(products);
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const getPublicProducts = async (req, res) => {
  try {
    // Only fetch products with an 'approved' status
    const products = await Product.find({ status: "approved" })
      .populate("seller", "name")
      .select("name price category description variations")
      .lean();

    res.json(products);
  } catch (err) {
    console.error("Public products fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch public products" });
  }
};

// 🔹 Get Product by ID
const getProductById = async (req, res) => {
  const productId = req.params.id;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const product = await Product.findById(productId).populate(
      "seller",
      "name email"
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Get product by ID error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // --- Process incoming data from FormData ---
    let updateData = { ...req.body };
    
    // Process variations
    let rawVars = [];
    if (req.body.variations) {
      try {
        rawVars = JSON.parse(req.body.variations);
      } catch (err) {
        console.error("❌ Invalid variations JSON:", err);
        return res.status(400).json({ error: "Invalid variations format" });
      }
    }

    // Process uploaded images and merge with existing ones
    const host = `${req.protocol}://${req.get("host")}`;
    const newFileUrls = req.files?.images?.map(f => `${host}/uploads/${f.filename}`) || [];

    let fileIndex = 0;
    const variationsWithImages = rawVars.map(v => {
      const count = Number(v.imageCount) || 0;
      const imagesToAdd = newFileUrls.slice(fileIndex, fileIndex + count);
      fileIndex += count;
      
      // Combine existing images with new ones
      const combinedImages = [...(v.images || []), ...imagesToAdd];
      return { ...v, images: combinedImages };
    });
    
    updateData.variations = variationsWithImages;

    // Handle tags
    if (req.body.tags) {
      updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(tag => tag.trim());
    }

    // --- Apply update logic based on user role ---
    if (userRole === "admin") {
      const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });
      return res.status(200).json({ message: "Product updated by admin", product: updatedProduct });
    }

    if (userRole === "seller") {
      if (product.seller.toString() !== userId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own products." });
      }

      if (req.body.status) {
        return res.status(403).json({ message: "Forbidden: Sellers cannot change product status." });
      }
      
      const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });
      return res.status(200).json({ message: "Product updated by seller", product: updatedProduct });
    }

    return res.status(403).json({ message: "Forbidden: You do not have permission." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
// 🔹 Delete Product
const deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Admin can delete any product, a seller can only delete their own
    if (
      req.user.role !== "admin" &&
      product.seller.toString() !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden: You cannot delete this product" });
    }

    await Product.findByIdAndDelete(productId);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).populate(
      "seller",
      "name email"
    );
    res.json(products);
  } catch (err) {
    console.error("Get seller products error:", err.message);
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
};

const getRelatedProducts = async (req, res) => {
  const { category, excludeId } = req.query;

  try {
    const related = await Product.find({
      category: { $regex: new RegExp(`^${category}$`, "i") },
      _id: { $ne: excludeId },
      status: "approved", // Only show approved products as related
    })
      .limit(6)
      .select("category variations")
      .lean();

    res.json(related);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ error: "Failed to fetch related products" });
  }
};

const getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, status: "approved" })
      .populate("seller", "name")
      .lean();

    if (!product) {
      return res
        .status(404)
        .json({ error: "Product not found or not approved" });
    }

    res.json(product);
  } catch (err) {
    console.error("Product fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

module.exports = {
  createProduct,
  getPublicProductById,
  getAllProducts,
  getPublicProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getRelatedProducts,
};
