const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // e.g. 'Feria del Libro'
  description: { type: String, default: '' },
  image: { type: String },
  imageData: { type: String },
  imageMimetype: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
