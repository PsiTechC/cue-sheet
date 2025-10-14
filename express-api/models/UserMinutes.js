const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserMinutesSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  minutesUsed: {
    type: Number,
    required: true,
    default: 0,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  lowBalanceEmailSent: {
    type: Boolean,
    default: false
  },
});

const UserMinutes = mongoose.model('UserMinutes', UserMinutesSchema);
module.exports = UserMinutes;
