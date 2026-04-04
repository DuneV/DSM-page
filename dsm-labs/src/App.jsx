import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Lab1 from './labs/lab1/Lab1'
import Lab2 from './labs/lab2/Lab2'
import Lab3 from './labs/lab3/Lab3'
import Lab4 from './labs/lab4/Lab4'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lab1" element={<Lab1 />} />
          <Route path="/lab2" element={<Lab2 />} />
          <Route path="/lab3" element={<Lab3 />} />
          <Route path="/lab4" element={<Lab4 />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <p>GL-IMEC2540-01 | Dinamica de Sistemas Mecanicos | Universidad de los Andes | 2025-20</p>
        </div>
      </footer>
    </div>
  )
}

export default App
