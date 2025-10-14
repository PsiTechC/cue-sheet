const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FolderSchema = new Schema({
  folderName: {
    type: String,
    required: true
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentFolder: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  assignedSheets: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {  // Add userId to associate the folder with a user
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Folder = mongoose.model('Folder', FolderSchema);
module.exports = Folder;
