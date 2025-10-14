const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
});

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;