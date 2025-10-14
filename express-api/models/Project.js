
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  workspaceName: {
    type: String,
    required: true
  },
  assignedSheet: {
    type: [String], // Accept an array of strings
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
