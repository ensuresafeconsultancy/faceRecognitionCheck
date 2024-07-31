


import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

const Register = () => {
  const [image, setImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

  const [employeeName , setEmployeeName] = useState('');

  useEffect(() => {
    if (isCameraOpen) {
      // Access the webcam
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        })
        .catch(err => console.error('Error accessing webcam: ', err));
    }
  }, [isCameraOpen]);

  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL('image/png');
    setImage(imageDataURL);
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const retakeImage = () => {
    setImage(null);
    setIsCameraOpen(true);
  };

  const sendImgBackend = async (event) => {
    event.preventDefault();
    let url = "https://facerecognitioncheck.onrender.com/uploadSingleImage"
    const newFormData = new FormData();
    newFormData.append('image', dataURItoBlob(image), `${employeeName.replace(/\s+/g, '')}.png`);
    newFormData.append('name', employeeName); // Change as needed for registration

    try {
      Swal.fire({
        title: 'Loading...',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.post(url, newFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Swal.close();
      if (response) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message,
          showConfirmButton: true, // Show confirm button
          confirmButtonText: 'OK'
        });
        console.log(response);
        console.log("File uploaded successfully");
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: response.data,
          showConfirmButton: true, // Show confirm button
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.response.data,
        showConfirmButton: true, // Show confirm button
        confirmButtonText: 'OK'
      });
      console.error('Error uploading image:', error);
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className='pt-5'>
      <div className="row">
        <div className="col"></div>
        <div className="col-lg-8 col-12">
          <div className="">
            <form action="" className='px-2' onSubmit={sendImgBackend}>
              <div className="form-group">
                <label htmlFor="">Employee Name: </label>
                <input type="text" className='form-control' onChange={(e)=>setEmployeeName(e.target.value)} required />
              </div>
              <div className="pt-5 ">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {!isCameraOpen && !image && (
                    <button className='btn btn-primary' type='button' onClick={openCamera}>Open Camera</button>
                  )}
                  {isCameraOpen && (
                    <div >
                      <video ref={videoRef} autoPlay className='img-fluid'></video>
                      <button className='btn btn-primary' type='button' onClick={captureImage} style={{ display: 'block', marginTop: '10px' }}>Capture Image</button>
                    </div>
                  )}
                  {image && (
                    <div>
                      <h2>Captured Image</h2>
                      <img src={image} alt="Captured"  />
                      <button className='btn btn-primary' type='button' onClick={retakeImage} style={{ display: 'block', marginTop: '10px' }}>Retake</button>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className='img-fluid' style={{ display: 'none' }}></canvas>

                {/* <button className='btn btn-primary' type='submit' onClick={() => sendImgBackend('http://localhost:3000/uploadSingleImage')}>Register</button> */}
                {/* <button type='button' onClick={() => sendImgBackend('http://localhost:3000/recognizeSingle')}>Recognize</button> */}
                <button className='btn btn-success ms-3' >Register</button>
              </div>

            </form>
          </div>
          <div className="col"></div>
        </div>
        <div className="col"></div>
      </div>
    </div>
  );
}

export default Register;
