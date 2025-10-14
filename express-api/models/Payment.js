const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    amount: { type: Number, required: true },
    plan: { type: String, required: true },
    description: { type: String },
    gstNumber: { type: String, default: null }, // Optional
    billingAddress: { type: String, default: null }, // Optional 
    companyName: { type: String, default: null }, // Optional
    panNumber: { type: String, default: null }, // Optional
    contactPerson: { type: String, default: null }, // Optional
    contactPersonPhone: { type: String, default: null }, // Optional
    orderId: { type: String, required: true }, // Razorpay Order ID
    paymentId: { type: String, default: null }, // Razorpay Payment ID
    paymentMethod: { type: String, default: null }, // Payment method (e.g., card, UPI)
    status: { type: String, default: "created" }, // Payment status: created, paid, failed
    createdAt: { type: Date, default: Date.now },
    totalMinutes: { type: Number }
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;