const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User"); // Assuming User model is in models/User.js
const router = express.Router();
require('dotenv').config();


// Initialize Razorpay instance with environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,   
  key_secret: process.env.RAZORPAY_KEY_SECRET, 
});

// Route to create a Razorpay order
router.post("/create-order", async (req, res) => {
  const { amount } = req.body; 

  const options = {
    amount: amount * 100, 
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({ message: "Error creating order" });
  }
});

// Route to verify payment and update user minutes
router.post("/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,      // Pass the userId from the frontend
    rechargeMinutes, // Minutes to add based on the recharge
  } = req.body;

  // Generate the expected signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    try {
      // Update the user's minutes in the database
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Increment the total minutes based on the recharge
      user.totalMinutes += rechargeMinutes;
      await user.save();

      return res.json({
        message: "Payment successful and minutes updated",
        totalMinutes: user.totalMinutes,
      });
    } catch (error) {
      console.error("Error updating user minutes:", error);
      return res.status(500).json({ message: "Database error" });
    }
  } else {
    return res.status(400).json({ message: "Invalid payment signature" });
  }
});

module.exports = router;
