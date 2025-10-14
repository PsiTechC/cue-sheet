const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SavedTableSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, 
    ref: 'User',    
  },
  tableData: {
    type: Array,
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

const SavedTable = mongoose.model('SavedTable', SavedTableSchema);
module.exports = SavedTable;
