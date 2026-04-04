import { Link } from 'react-router-dom'

const labs = [
  {
    num: 1,
    title: 'Cinematica de Cuerpos Rigidos',
    desc: 'Robot RR (SCARA 2D): FK, IK, Jacobiano, perfiles de posicion, velocidad y aceleracion. Trayectorias circulares y poligonales.',
    path: '/lab1',
    color: '#2b6cb0'
  },
  {
    num: 2,
    title: 'Clasificacion de Movimientos',
    desc: 'Datos de acelerometro, filtrado de senales, integracion numerica, redes neuronales (MLPClassifier) para clasificar movimientos.',
    path: '/lab2',
    color: '#2f855a'
  },
  {
    num: 3,
    title: 'Pata de Robot - Fuerzas en Nodos',
    desc: 'Analisis de fuerzas en una pata de robot con diferentes drivers (centros de inercia variables). Carga de CAD y calculo de fuerzas.',
    path: '/lab3',
    color: '#c05621'
  },
  {
    num: 4,
    title: 'Vibraciones Mecanicas',
    desc: 'Sistema masa-resorte-amortiguador. Transmisibilidad, diseno de aislamiento, 1 y 2 GDL.',
    path: '/lab4',
    color: '#6b46c1'
  },
]

export default function Home() {
  return (
    <div className="container">
      <div className="home-hero">
        <h1>Dinamica de Sistemas Mecanicos</h1>
        <p>GL-IMEC2540-01 | Universidad de los Andes | Laboratorios interactivos</p>
        <div className="lab-cards">
          {labs.map(lab => (
            <Link key={lab.num} to={lab.path} className="lab-card">
              <span className="lab-number" style={{ background: lab.color }}>
                Laboratorio {lab.num}
              </span>
              <h3>{lab.title}</h3>
              <p>{lab.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
