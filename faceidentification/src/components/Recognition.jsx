import {useEffect, useState , useRef, } from 'react'
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Swal from 'sweetalert2';
const Recognition = () => {

  const [employees, setEmployees]= useState([]);

  const videoRef = useRef();
  const canvasRef = useRef();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [userDescriptor, setUserDescriptor] = useState([]);


  const fetchEmpNames = async()=>{
    const response = await axios.get("https://facerecognitioncheck.onrender.com/fetchEmployeeNames");
    // const response = await axios.get("http://localhost:3000/fetchEmployeeNames");
    if(response){
      console.log(response);
      setEmployees(response.data.EmployeeNames);
    }
  }

  const selectEmployeeFace = async(event)=>{
    console.log("event = " , event.target.value)
    if(event.target.value){
      const response = await axios.get(`https://facerecognitioncheck.onrender.com/employeeDescriptor/${event.target.value}`)
      if(response){
        console.log("response = " , response.data.userDescriptor)
        setUserDescriptor(response.data.userDescriptor);
      }
    } else {
      setUserDescriptor([]);
    }
  }

  useEffect(()=>{
    fetchEmpNames();
  } , [])

  
  useEffect(() => {
    const loadModels = async () => {
      const modelPromises = [
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ];

      await Promise.all(modelPromises);
      setModelsLoaded(true);
      console.log("Models loaded.");

    };

    loadModels();
  }, []);

  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => console.error('Error accessing webcam: ', err));
    };

    const handleVideoPlay = () => {
      console.log("Detecting ...");
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvasRef.current.innerHTML = ''; // Clear previous canvas
      canvasRef.current.appendChild(canvas);
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvas, displaySize);

      const intervalId = setInterval(async () => {
      console.log("Detecting face...");

        if (!videoRef.current) return; // Ensure videoRef.current is valid

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        // faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

        if (detections.length > 0) {
          // const faceDescriptor = detections[0].descriptor;
          const faceDescriptor = Array.from(detections[0].descriptor);
          // console.log("faceDescriptor = ", faceDescriptor)

          const distance = faceapi.euclideanDistance(faceDescriptor, userDescriptor);
          console.log("distance = " , distance)
          if (distance < 0.37) { // Adjust the threshold as needed
            clearInterval(intervalId);
            if (videoRef.current && videoRef.current.srcObject) {
              videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (canvasRef.current) {
              canvasRef.current.innerHTML = ''; // Clear the canvas
            }
            setIsCameraOn(false); // Turn off the camera
            // alert("Face recognized!");

            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: "Face recognized",
              showConfirmButton: true, // Show confirm button
              confirmButtonText: 'OK'
            });
            console.log("Face recognized!")
            return;
          }
        }
      }, 100);

      return () => clearInterval(intervalId); // Cleanup on unmount
    };

    if (isCameraOn && modelsLoaded) {
      startVideo();
      videoRef.current.addEventListener('play', handleVideoPlay);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, [isCameraOn, modelsLoaded, userDescriptor]);

  const handleOpenCamera = () => {
    setIsCameraOn(true);
  };


  return (
    <div className='pt-5'>
      <div className="row">
        <div className="col"></div>
        <div className="col-lg-8 col-12">
          <div className="px-2">
            <div className="form-group">
              <label htmlFor="">Select Employee: </label>
              <select name="employee" id="employee" onChange={selectEmployeeFace}>
                  <option value="">----Select Employee----</option>
                  {employees && employees.map((item, index) => (
                    <option value={item._id} key={index}>{item.name}</option>
                  ))}
                </select>
            </div>

            <div>
            <h1 className='pt-3'>Face Recognition</h1>
            {!isCameraOn && !modelsLoaded && (
              <p>Loading models, please wait...</p>
            )}
            {!isCameraOn && userDescriptor.length!=0 && modelsLoaded && (
              <button onClick={handleOpenCamera} className='btn btn-primary' >Open Camera</button>
            )}
            {isCameraOn && (
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video ref={videoRef} autoPlay muted className='img-fluid'></video>
                {/* <video ref={videoRef} autoPlay muted className='videoCanva' width="720" height="560" style={{ marginRight: '20px' }}></video> */}
                <div ref={canvasRef} style={{ position: 'absolute' }}></div>
              </div>
            )}
          </div>


          </div>
        </div>
        <div className="col"></div>
      </div>
    </div>
  )
}

export default Recognition