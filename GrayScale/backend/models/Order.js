const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "", // not required: a product without images must not block a paid order
        },
        price: {
            type: Number,
            required: true,
        },
        size: String,
        color: String,
        quantity: {
            type: Number,
            required: true,
        },
    },
    { _id: false}
);

const orderSchema = new mongoose.Schema({
        // Link back to the checkout that produced this order (prevents duplicate orders)
        checkout: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Checkout",
            unique: true,
            sparse: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderItems: [orderItemSchema],
        shippingAddress: {
            firstName: { type: String },
            lastName: { type: String },
            phone: { type: String },
            address: { type: String, required: true },
            city:  { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        paymentStatus: {
            type: String,
            default: "pending",
        },
        // Items that were paid for but couldn't be taken from stock (sold out between
        // payment start and confirmation). Admin must restock, fulfil later, or refund.
        stockShortfall: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                name: String,
                size: String,
                color: String,
                quantity: Number,
                _id: false,
            },
        ],
        paymentDetails: {
            type: mongoose.Schema.Types.Mixed, // PayPal capture / PayMongo payment info
        },
        status: {
            type: String,
            enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Processing",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);