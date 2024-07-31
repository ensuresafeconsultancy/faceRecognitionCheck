
const mongoose = require('mongoose');

const singleFaceDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  descriptor: { type: [Number], required: true }
});

module.exports = mongoose.model('singleFaceData', singleFaceDataSchema);
