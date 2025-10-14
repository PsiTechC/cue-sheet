// models/Metadata.js
const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true }, // Unique identifier for the file
  customProperties: { type: Object, default: {} }, // To store custom metadata properties
});

module.exports = mongoose.model('Metadata', metadataSchema);
