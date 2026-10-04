const express = require("express");
const { rateLimit } = require("express-rate-limit");
const Subscriber = require("../models/Subscriber");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 10 signups per IP per hour (stops list-bombing and probing)
const subscribeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) =>
        res.status(429).json({ message: "Too many requests. Please try again later." }),
});

// @route POST /api/subscribe
// @desc Handle newsletter subscription
// @access Public (rate limited)
router.post("/subscribe", subscribeLimiter, async (req, res) => {
    // typeof check: an object like {"$regex": "^a"} must never reach the query
    const raw = req.body?.email;
    if (typeof raw !== "string") {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }
    const email = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }

    try {
        // Upsert: same response whether or not the address was already on the list,
        // so the form can't be used to check who is subscribed.
        await Subscriber.updateOne(
            { email },
            { $setOnInsert: { email, subscribeAt: new Date() } },
            { upsert: true }
        );
        res.status(200).json({ message: "Thanks for subscribing!" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({ message: "Thanks for subscribing!" });
        }
        console.error("Subscribe error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
