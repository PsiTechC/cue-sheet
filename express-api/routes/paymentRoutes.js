const express = require('express');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment'); // Ensure the path is correct
const User = require('../models/User'); // Import User model to fetch user data
const authenticateToken = require('../middleware/auth'); // Import the authentication middleware
const UserMinutes = require('../models/UserMinutes'); 
const cookieParser = require('cookie-parser');

const router = express.Router();
router.use(cookieParser());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Route to handle Razorpay order creation
router.post('/createOrder', authenticateToken, async (req, res) => {
  try {
    console.log("[DEBUG] Received request body:", req.body);

    const {
      amount,
      customer_email: email,
      customer_contact: contact,
      fullName,
      description,
      gstNumber,
      billingAddress,
      companyName,
      panNumber,
      contactPerson,
      contactPersonPhone,
      plan,
      totalMinutes
    } = req.body;

    // Get userId from the authenticated user
    const userId = req.user.id; // This will be set by the authenticateToken middleware

    console.log("[DEBUG] User ID:", userId);

    // Validate required fields
    if (!userId || !amount || !email || !contact || !fullName) {
      console.error("[ERROR] Missing required fields.");
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Create Razorpay order
    console.log("[DEBUG] Creating Razorpay order...");
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    console.log("[DEBUG] Razorpay order created:", order);

    // Save payment details to MongoDB
    console.log("[DEBUG] Saving payment details to database...");
    const payment = new Payment({
      userId, // Use the logged-in user's ID
      fullName,
      email,
      contact,
      amount,
      description,
      gstNumber,
      billingAddress,
      companyName,
      panNumber,
      contactPerson,
      contactPersonPhone,
      plan,
      orderId: order.id,
      status: "created",
      totalMinutes
    });

    await payment.save();
    console.log("[DEBUG] Payment details saved:", payment);

    const equivalentMinutes = amount;
    let userMinutes = await UserMinutes.findOne({ userId });
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("[ERROR] Error creating Razorpay order or saving payment:", error);
    res.status(500).json({ success: false, message: "Failed to create order." });
  }
});

router.put('/updatePayment', authenticateToken, async (req, res) => {
  const { orderId, paymentId, paymentMethod, status } = req.body;

  console.log("[DEBUG] Received PUT request body:", req.body);

  if (!orderId || !paymentId || !status) {
    console.error("[ERROR] Missing required fields for updating payment.");
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    console.log("[DEBUG] Updating payment details in database...");
    const payment = await Payment.findOneAndUpdate(
      { orderId },
      { paymentId, paymentMethod, status },
      { new: true }
    );

    if (!payment) {
      console.error("[ERROR] Payment record not found.");
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    // Check if payment was successful
    if (status === "successful") {
      const userId = payment.userId;
      const plan = payment.plan;
      const totalMinutes = payment.totalMinutes;
      console.log("[DEBUG] Received Plan:", plan);

    
      let minutesToAdd = 0;
      switch (plan) {
        case "Launch Plan":
          minutesToAdd = 25000;
          break;
        case "Growth Plan":
          minutesToAdd = 49000;
          break;
        case "Ascend Plan":
          minutesToAdd = 73000;
          break;
        case "Pinnacle Plan":
          minutesToAdd = 121000;
          break;
        case "Elite Plan":
          minutesToAdd = 122000;
          break;
          case "Custom Plan":
            if (totalMinutes) {
              minutesToAdd = totalMinutes; // Use totalMinutes for Custom Plan
            } else {
              console.error("[ERROR] Missing totalMinutes for Custom Plan.");
              return res.status(400).json({ success: false, message: "Missing totalMinutes for Custom Plan." });
            }
            break;
        default:
          return res.status(400).json({ success: false, message: "Invalid plan specified." });
      }
    
      // Update the user's minutes
      let userMinutes = await UserMinutes.findOne({ userId });
      if (!userMinutes) {
        userMinutes = new UserMinutes({ userId, minutesUsed: minutesToAdd });
        await userMinutes.save();
      } else {
        userMinutes.minutesUsed += minutesToAdd;
        await userMinutes.save();
      }
    }
    

    console.log("[DEBUG] Payment details updated successfully.");
    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error("[ERROR] Error updating payment record:", error);
    res.status(500).json({ success: false, message: "Failed to update payment record." });
  }
});

module.exports = router;
