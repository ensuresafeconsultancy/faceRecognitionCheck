const mongoose = require('mongoose');

const faceDataSchema = new mongoose.Schema({
  name: { type: String, required: true },
  descriptors: { type: [[Number]], required: true } // Change from descriptor to descriptors
});

module.exports = mongoose.model('FaceData', faceDataSchema);



