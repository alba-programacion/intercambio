const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  type: { type: String, enum: ['REVIEW_CV', 'REQUEST_CVS'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderEmail: { type: String },
  targetEmail: { type: String, required: true },
  targetVacancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy' },
  cvId: { type: mongoose.Schema.Types.ObjectId, ref: 'CV' },
  sourceInstitutionId: { type: String },
  targetInstitutionId: { type: String },
  description: { type: String },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'EXPIRED'], default: 'PENDING' },
  dueDate: { type: Date, required: true },
  expiresAt: { type: Date },
}, { timestamps: true });

// Dynamic fine calculation
taskSchema.virtual('fine').get(function() {
  if (this.status === 'COMPLETED') return 0;
  
  const now = new Date();
  if (now <= this.dueDate) return 0;
  
  const diffTime = Math.abs(now - this.dueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Base 50 + 50 for each daily increase
  return 50 * diffDays;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
