const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  document: { type: String, required: true },
  documentData: { type: String },
  documentMimetype: { type: String },
  sourceInstitutionId: { type: String, ref: 'Institution' },
  targetInstitutionId: { type: String },
  targetVacancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy' },
  status: { type: String, enum: ['Aceptado', 'En Proceso', 'Cartera', 'Rechazado', 'En trámite', null], default: null },
  rejectionCode: { type: String, default: null },
  rejectionReasonCustom: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  rejectedBy: { type: String, default: '' },
  history: [{
    action: { type: String },
    date: { type: Date, default: Date.now },
    details: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('CV', cvSchema);
