import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import Swal from 'sweetalert2';
import Webcam from 'react-webcam';
import './register.css';

const Recognition = () => {
  const [employees, setEmployees] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [userDescriptor, setUserDescriptor] = useState([]);

  const fetchEmpNames = async () => {
    const response = await axios.get("https://facerecognitioncheck.onrender.com/fetchEmployeeNames");
    if (response) {
      console.log(response);
      setEmployees(response.data.EmployeeNames);
    }
  };

  const selectEmployeeFace = async (event) => {
    console.log("event = ", event.target.value);
    if (event.target.value) {
      const response = await axios.get(`https://facerecognitioncheck.onrender.com/employeeDescriptor/${event.target.value}`);
      if (response) {
        console.log("response = ", response.data.userDescriptor);
        setUserDescriptor(response.data.userDescriptor);
      }
    } else {
      setUserDescriptor([]);
    }
  };

  useEffect(() => {
    fetchEmpNames();
  }, []);

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
      setIsCameraOn(false);
    };
    loadModels();
  }, []);

  // const handleVideoPlay = useCallback(() => {
  //   if (!videoRef.current || !videoRef.current.video) return;

  //   const onLoadedData = async () => {
  //     console.log("Detecting ...");
  //     const canvas = faceapi.createCanvasFromMedia(videoRef.current.video);
  //     canvasRef.current.innerHTML = ''; // Clear previous canvas
  //     canvasRef.current.appendChild(canvas);
  //     const displaySize = { width: videoRef.current.video.videoWidth, height: videoRef.current.video.videoHeight };
  //     faceapi.matchDimensions(canvas, displaySize);

  //     const intervalId = setInterval(async () => {
  //       if (!videoRef.current) return clearInterval(intervalId);
  //       console.log("Detecting face...");


  //       const detections = await faceapi.detectAllFaces(videoRef.current.video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
  //       const resizedDetections = faceapi.resizeResults(detections, displaySize);
  //       canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  //       faceapi.draw.drawDetections(canvas, resizedDetections);

  //       if (detections.length > 0) {
  //         const faceDescriptor = Array.from(detections[0].descriptor);
  //         const distance = faceapi.euclideanDistance(faceDescriptor, userDescriptor);
  //         console.log("distance = ", distance);
  //         if (distance <= 0.5) {
  //           clearInterval(intervalId);
  //           console.log("videoRef.current when face detected = ", videoRef.current);
  //           if (videoRef.current.video && videoRef.current.video.srcObject) {
  //             videoRef.current.video.srcObject.getTracks().forEach(track => track.stop());
  //           }
  //           if (canvasRef.current) {
  //             canvasRef.current.innerHTML = ''; // Clear the canvas
  //           }
  //           setIsCameraOn(false); // Turn off the camera

  //           Swal.fire({
  //             icon: 'success',
  //             title: 'Success!',
  //             text: "Face recognized",
  //             showConfirmButton: true, // Show confirm button
  //             confirmButtonText: 'OK'
  //           });
  //           console.log("Face recognized!");
  //           return;
  //         }
  //       }


  //     }, 100);

  //     return () => clearInterval(intervalId);
  //   };

  //   videoRef.current.video.addEventListener('loadeddata', onLoadedData);

  //   return () => {
  //     if (videoRef.current && videoRef.current.video) {
  //       videoRef.current.video.removeEventListener('loadeddata', onLoadedData);
  //     }
  //   };
  // }, [userDescriptor]);

  const handleVideoPlay = useCallback(() => {
    if (!videoRef.current || !videoRef.current.video) return;
  
    const onLoadedData = async () => {
      console.log("Detecting ...");
      const canvas = faceapi.createCanvasFromMedia(videoRef.current.video);
      canvasRef.current.innerHTML = ''; // Clear previous canvas
      canvasRef.current.appendChild(canvas);
      const displaySize = { width: videoRef.current.video.videoWidth, height: videoRef.current.video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
  
      const intervalId = setInterval(async () => {
        if (!videoRef.current) return clearInterval(intervalId);
        console.log("Detecting face...");
  
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current.video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
          // Check if detections are valid
          if (!resizedDetections || resizedDetections.length === 0) {
            return;
          }
  
          // Ensure bounding boxes are valid
          const validDetections = resizedDetections.filter(detection => {
            const { x, y, width, height } = detection.detection.box;
            return x !== null && y !== null && width !== null && height !== null;
          });
  
          if (validDetections.length === 0) {
            return;
          }
  
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, validDetections);
  
          if (validDetections.length > 0) {
            const faceDescriptor = Array.from(validDetections[0].descriptor);
            const distance = faceapi.euclideanDistance(faceDescriptor, userDescriptor);
            console.log("distance = ", distance);
            if (distance <= 0.5) {
              clearInterval(intervalId);
              console.log("videoRef.current when face detected = ", videoRef.current);
              if (videoRef.current.video && videoRef.current.video.srcObject) {
                videoRef.current.video.srcObject.getTracks().forEach(track => track.stop());
              }
              if (canvasRef.current) {
                canvasRef.current.innerHTML = ''; // Clear the canvas
              }
              setIsCameraOn(false); // Turn off the camera
  
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: "Face recognized",
                showConfirmButton: true, // Show confirm button
                confirmButtonText: 'OK'
              });
              console.log("Face recognized!");
              return;
            }
          }
        } catch (error) {
          console.error("Error during face detection:", error);
          clearInterval(intervalId);
          setIsCameraOn(false);
          if (videoRef.current.video && videoRef.current.video.srcObject) {
            videoRef.current.video.srcObject.getTracks().forEach(track => track.stop());
          }
          if (canvasRef.current) {
            canvasRef.current.innerHTML = ''; // Clear the canvas
          }
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: "An error occurred during face detection.",
            showConfirmButton: true,
            confirmButtonText: 'OK'
          });
        }
      }, 100);
  
      return () => clearInterval(intervalId);
    };
  
    videoRef.current.video.addEventListener('loadeddata', onLoadedData);
  
    return () => {
      if (videoRef.current && videoRef.current.video) {
        videoRef.current.video.removeEventListener('loadeddata', onLoadedData);
      }
    };
  }, [userDescriptor]);
  
  

  useEffect(() => {
    if (isCameraOn && modelsLoaded) {
      const cleanup = handleVideoPlay();
      return () => {
        cleanup();
        if (videoRef.current && videoRef.current.video && videoRef.current.video.srcObject) {
          videoRef.current.video.srcObject.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isCameraOn, modelsLoaded, userDescriptor, handleVideoPlay]);

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
              {!isCameraOn && userDescriptor.length !== 0 && modelsLoaded && (
                <button onClick={handleOpenCamera} className='btn btn-primary' >Open Camera</button>
              )}
              {isCameraOn && (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Webcam
                    audio={false}
                    ref={videoRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 720,
                      height: 560,
                      facingMode: "user"
                    }}
                    className = "videoCanva"
                    style={{ marginRight: '20px' }}
                  />
                  <div ref={canvasRef}
                  
                  className = "videoCanva" style={{ position: 'absolute' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col"></div>
      </div>
    </div>
  );
}

export default Recognition;
