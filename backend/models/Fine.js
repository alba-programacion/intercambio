const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  institutionId: { type: String, ref: 'Institution', required: true },
  reason: { 
    type: String, 
    required: true,
    enum: [
      'Falta a la sesión',
      'No enviar el reporte o enviarlo de forma incompleta',
      'No enviar el reporte de información en la fecha establecida',
      'No enviar los candidatos que se comprometieron a compartir'
    ]
  },
  amount: { type: Number, default: 50.00 },
  status: { type: String, enum: ['Pendiente', 'Pagado'], default: 'Pendiente' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Fine', fineSchema);
