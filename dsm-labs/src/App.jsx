import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Lab1 from './labs/lab1/Lab1'
import Lab2 from './labs/lab2/Lab2'
import Lab3 from './labs/lab3/Lab3'
import Lab4 from './labs/lab4/Lab4'
import AltCinematica from './labs/altCinematica/AltCinematica'
import AltDinamica from './labs/altDinamica/AltDinamica'
import AltEnergias from './labs/altEnergias/AltEnergias'
import AltVibraciones from './labs/altVibraciones/AltVibraciones'
import AltSlider from './labs/altSlider/AltSlider'
import AltImpacto from './labs/altImpacto/AltImpacto'
import AltRobot3R from './labs/altRobot3R/AltRobot3R'
import AltMulticuerpo from './labs/altMulticuerpo/AltMulticuerpo'
import AltDuffing from './labs/altDuffing/AltDuffing'
import AltVirtuales from './labs/altVirtuales/AltVirtuales'
import AltAbsorsor from './labs/altAbsorsor/AltAbsorsor'
import AltVigas from './labs/altVigas/AltVigas'
import './App.css'

function period() {
  const now = new Date()
  const sem = now.getMonth() < 6 ? 1 : 2   // 0-5 → enero-junio = 1, 6-11 → julio-dic = 2
  return `${now.getFullYear()}-${sem}0`
}

const COURSES = [
  { code: 'IMEC2540', name: 'Dinamica de Sistemas Mecanicos' },
]

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
          <Route path="/alt/cinematica" element={<AltCinematica />} />
          <Route path="/alt/dinamica" element={<AltDinamica />} />
          <Route path="/alt/energias" element={<AltEnergias />} />
          <Route path="/alt/vibraciones" element={<AltVibraciones />} />
          <Route path="/alt/slider" element={<AltSlider />} />
          <Route path="/alt/impacto" element={<AltImpacto />} />
          <Route path="/alt/robot3r" element={<AltRobot3R />} />
          <Route path="/alt/multicuerpo" element={<AltMulticuerpo />} />
          <Route path="/alt/duffing" element={<AltDuffing />} />
          <Route path="/alt/virtuales" element={<AltVirtuales />} />
          <Route path="/alt/absorsor" element={<AltAbsorsor />} />
          <Route path="/alt/vigas" element={<AltVigas />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-courses">
            {COURSES.map(c => (
              <span key={c.code} className="footer-course">
                <span className="footer-course-code">{c.code}</span>
                <span className="footer-course-name">{c.name}</span>
              </span>
            ))}
          </div>
          <p className="footer-meta">
            Universidad de los Andes · {period()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
