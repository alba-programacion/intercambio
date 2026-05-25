const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
  role: { type: String, required: true },
  salary: { type: String },
  location: { type: String },
  modality: { type: String, default: 'presencial' }, // virtual, presencial, híbrida, medio tiempo
  experience: { type: String },
  education: { type: String },
  observations: { type: String },
  language: { type: String },
  activities: { type: String },
  confidential: { type: Boolean, default: false },
  age: { type: String },
  gender: { type: String, default: 'Indistinto' }, // Indistinto, Femenino, Masculino
  skills: { type: String },
  institutionId: { type: String, ref: 'Institution' }, 
  status: { type: String, default: 'Abierta' },
}, { timestamps: true });

module.exports = mongoose.model('Vacancy', vacancySchema);
