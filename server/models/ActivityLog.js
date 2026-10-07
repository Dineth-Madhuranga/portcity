const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['login', 'add', 'edit', 'delete', 'status', 'save', 'user-mgmt'],
    required: true
  },
  msg: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
