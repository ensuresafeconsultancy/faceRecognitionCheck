import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter ,  Routes , Route, Link } from 'react-router-dom';
import Recognition from './components/Recognition';
import Register from './components/Register';
function App() {

  return (
    <BrowserRouter>


    <div className="pt-5 ps-3">
      <Link to='/' className='btn btn-primary' >Recognize</Link>
      <Link to='/register' className='btn btn-primary ms-3' >Register</Link>
    </div>



      <Routes>
        <Route path='/' element={<Recognition />} />
        <Route path='/register' element={<Register />} />
      </Routes>

     
    </BrowserRouter>
  )
}

export default App
