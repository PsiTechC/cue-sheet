const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pricePerMinute: { type: Number, required: true },
    range: {
        start: { type: Number, required: true },
        end: { type: Number, required: function() { return !this.isLast; } },
    },
    isLast: { type: Boolean, default: false },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;