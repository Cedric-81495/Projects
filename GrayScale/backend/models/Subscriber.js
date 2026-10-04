const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    subscribeAt: {
        type: Date,
        default: Date.now, // function reference: evaluated per document, not once at startup
    },
});

module.exports = mongoose.model("Subscriber", subscriberSchema);