
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: false },
  totalMinutes: { type: Number, default: 0 },
  usedMinutes: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  accessKey: { type: String, required: false },
  secretKey: { type: String, required: false },
  bucket: { type: String, required: false },
  isAccess: { type: Boolean, default: true },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
