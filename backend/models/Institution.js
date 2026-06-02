const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  _id: { type: String }, // Explicit string ID to match mock users ('A', 'B')
  name: { type: String, required: true },
  profile: { type: String, default: 'General' },
  logo: { type: String },
  logoData: { type: String },
  logoMimetype: { type: String },
  titularName: { type: String },
  titularMail: { type: String },
  titularPhone: { type: String },
  suplenteName: { type: String },
  suplenteMail: { type: String },
  suplentePhone: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
