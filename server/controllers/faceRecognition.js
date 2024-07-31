const express = require('express')
const router = express.Router();
const multer  = require('multer')
const fs = require('fs')
const path = require('path')

const canvas = require('canvas');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = canvas;

const SingleFaceData = require('../schema/SingleFaceData');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, '../models'));
  await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, '../models'));
  await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, '../models'));
};

// Ensure models are loaded before starting the server
loadModels().then(() => {
  console.log('Models loaded');
}).catch(err => {
  console.error('Failed to load models:', err);
});

function validateFileSize(file) {
    const fileSizeLimit = 30 * 1024 * 1024; // 30MB in bytes
    return file.size <= fileSizeLimit;
  }
  
  // Configure Multer storage with file size validation
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'files'); // Adjust 'files' as needed for your file storage location
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, uniqueSuffix + file.originalname);
    },
    limits: { fileSize: validateFileSize },
  });

const upload = multer({ storage: storage })



// Route to handle image upload and face recognition
router.post("/uploadSingleImage", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded.')
      return res.status(400).send('No file uploaded.');
    }

    // console.log("File received:", req.file);

    const filePath = path.join(__dirname, '../files', req.file.filename);
    console.log("filePath = ", filePath);

    console.log("detecting face in image...")
    // Load the image
    const img = await canvas.loadImage(filePath);
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
      console.log('No faces detected in the image.')
      return res.status(400).send('No faces detected in the image.');
    }

    console.log("Extracting face informations in image....")
    // Convert Float32Array to plain array
    const descriptorArray = Array.from(detections.descriptor);

    // Save the face descriptor to MongoDB
    const faceData = new SingleFaceData({
      name: req.body.name, // Use employee name or ID from the request
      descriptor: descriptorArray
    });

    console.log("Storing face info in database....")
    await faceData.save();
    console.log("saved successfully")

    res.status(200).send({ message: 'Face trained successfully', faceData });

  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong, sorry!");
  }
});


router.get('/userDescriptor', async(req, res)=>{
  try{

    const response = await SingleFaceData.findOne({name : 'Balaji'})
    if(response){
      console.log(response)
    } else {
      console.log("not found")
    }

    res.send({descriptor : response.descriptor })

  }catch(err){
    res.send("sryyy wrongg")
  }
})

router.get('/fetchEmployeeNames' , async(req,res)=>{
  try{

    const response =  await SingleFaceData.find({} , 'name');
    console.log("response = " , response)
    if(response){
      res.send({EmployeeNames : response})
    }

  }catch(err){
    res.send("sryy wrong")
  }
})

router.get('/employeeDescriptor/:empId' , async(req, res)=>{
  try{

    const { empId } = req.params;

    const response = await SingleFaceData.findById({_id : empId});
    if(response){
      console.log("response userDescriptor = " , response.descriptor)
      res.send({userDescriptor : response.descriptor})
    }

  }catch(err){
    res.send("sry wronggg")
  }
})


module.exports = router;
