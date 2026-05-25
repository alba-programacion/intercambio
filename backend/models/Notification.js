const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  targetInstitutionId: { type: String }, // Can be null for global/admin notifications
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'SUCCESS', 'ALERT'], default: 'INFO' },
  readBy: [{ type: String }], // Array of user emails or IDs who have read it
  link: { type: String, default: null } // Optional UI route
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
