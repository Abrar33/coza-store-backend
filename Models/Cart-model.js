const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Make sure this matches your product model name
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }
}, { _id: false }); // Do not create an _id for subdocuments

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Make sure this matches your user model name
        required: true,
        unique: true
    },
    items: [cartItemSchema]
});

// Use mongoose.model() to create the model and export it
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;