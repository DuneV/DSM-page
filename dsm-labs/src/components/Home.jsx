import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import VotePanel from './VotePanel'

/* ============================================================
   DATA
============================================================ */
const prelabs = [
  {
    num: 1, stars: 3,
    title: 'Cinematica de Cuerpos Rigidos',
    desc: 'Robot RR (SCARA 2D): FK, IK, Jacobiano, perfiles de posicion, velocidad y aceleracion.',
    path: '/lab1', color: '#2b6cb0',
  },
  {
    num: 2, stars: 4,
    title: 'Clasificacion de Movimientos',
    desc: 'Acelerometro, filtrado de senales, integracion numerica, MLPClassifier para clasificar movimientos.',
    path: '/lab2', color: '#2f855a',
  },
  {
    num: 3, stars: 3,
    title: 'Pata de Robot — Fuerzas en Nodos',
    desc: 'Analisis de fuerzas en pata de robot con drivers variables. Carga de CAD y calculo de fuerzas.',
    path: '/lab3', color: '#c05621',
  },
  {
    num: 4, stars: 4,
    title: 'Vibraciones Mecanicas',
    desc: 'Sistema masa-resorte-amortiguador. Transmisibilidad, diseno de aislamiento, 1 y 2 GDL.',
    path: '/lab4', color: '#6b46c1',
  },
]

const bankLabs = [
  // ── Cinematica ────────────────────────────────────────────
  {
    id: 'cinematica', topic: 'Cinematica', stars: 3, status: 'available',
    title: 'Mecanismo de 4 Barras',
    desc: 'Posicion, velocidades, condicion de Grashof y curva del punto acoplador.',
    path: '/alt/cinematica', color: '#2b6cb0',
  },
  {
    id: 'slider', topic: 'Cinematica', stars: 2, status: 'available',
    title: 'Manivela-Corredera',
    desc: 'Cinematica del piston: posicion, velocidad y aceleracion. Aproximacion de Fourier.',
    path: '/alt/slider', color: '#2b6cb0',
  },
  {
    id: 'robot3r', topic: 'Cinematica', stars: 5, status: 'available',
    title: 'Robot Serial 3R',
    desc: 'Cinematica directa e inversa de un robot de 3 GDL rotacionales. DH, Jacobiano, espacio de trabajo.',
    path: '/alt/robot3r', color: '#2b6cb0',
  },
  // ── Dinamica ──────────────────────────────────────────────
  {
    id: 'dinamica', topic: 'Dinamica', stars: 3, status: 'available',
    title: 'Ecuaciones de Movimiento',
    desc: 'Pendulo no lineal con RK4, diagrama de fase, D\'Alembert en plano inclinado.',
    path: '/alt/dinamica', color: '#276749',
  },
  {
    id: 'impacto', topic: 'Dinamica', stars: 3, status: 'available',
    title: 'Impacto y Colisiones',
    desc: 'Coeficiente de restitucion, conservacion de momento, perdida de energia cinetica.',
    path: '/alt/impacto', color: '#276749',
  },
  {
    id: 'multicuerpo', topic: 'Dinamica', stars: 4, status: 'available',
    title: 'Sistemas Multicuerpo',
    desc: 'Dinamica de cadenas cinematicas abiertas y cerradas. Ecuaciones de Newton-Euler recursivas.',
    path: '/alt/multicuerpo', color: '#276749',
  },
  // ── Energias ──────────────────────────────────────────────
  {
    id: 'energias', topic: 'Energias', stars: 4, status: 'available',
    title: 'Metodos Energeticos',
    desc: 'Lagrangiano, conservacion de energia, pendulo doble caotico y oscilador no lineal.',
    path: '/alt/energias', color: '#975a16',
  },
  {
    id: 'virtuales', topic: 'Energias', stars: 3, status: 'available',
    title: 'Trabajos Virtuales',
    desc: 'Principio de trabajos virtuales, fuerzas generalizadas, sistemas con ligaduras.',
    path: '/alt/virtuales', color: '#975a16',
  },
  {
    id: 'duffing', topic: 'Energias', stars: 4, status: 'available',
    title: 'Oscilador de Duffing',
    desc: 'Oscilador no lineal de Duffing. Bifurcaciones, atractores y diagramas de Poincare.',
    path: '/alt/duffing', color: '#975a16',
  },
  // ── Vibraciones ───────────────────────────────────────────
  {
    id: 'vibraciones', topic: 'Vibraciones', stars: 4, status: 'available',
    title: 'Analisis Modal y FRF',
    desc: 'Frecuencias naturales 3-GDL, formas modales ortogonales, FRF por superposicion modal.',
    path: '/alt/vibraciones', color: '#553c9a',
  },
  {
    id: 'absorsor', topic: 'Vibraciones', stars: 4, status: 'available',
    title: 'Absorsor de Vibraciones',
    desc: 'Diseno del absorsor dinamico sintonizado (TMD). Supresor de resonancia, frecuencia optima.',
    path: '/alt/absorsor', color: '#553c9a',
  },
  {
    id: 'vigas', topic: 'Vibraciones', stars: 5, status: 'available',
    title: 'Vibraciones de Vigas',
    desc: 'Modos de flexion de viga de Euler-Bernoulli. Condiciones de frontera, frecuencias continuas.',
    path: '/alt/vigas', color: '#553c9a',
  },
]

const TOPICS = ['Todos', 'Cinematica', 'Dinamica', 'Energias', 'Vibraciones']

// Seed counts so new visitors see some activity
const SEED = {
  lab1: 14, lab2: 9, lab3: 11, lab4: 17,
  cinematica: 23, slider: 18, robot3r: 12,
  dinamica: 27, impacto: 19, multicuerpo: 8,
  energias: 31, virtuales: 7, duffing: 15,
  vibraciones: 22, absorsor: 10, vigas: 13,
}

/* ============================================================
   APOYO HOOK + COMPONENT
============================================================ */
function useApoyo(id) {
  const key = `apoyo_${id}`
  const seed = SEED[id] ?? 5
  const stored = localStorage.getItem(key)
  const parsed = stored ? JSON.parse(stored) : { count: seed, liked: false }

  const [state, setState] = useState(parsed)

  const toggle = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const next = { count: state.liked ? state.count - 1 : state.count + 1, liked: !state.liked }
    localStorage.setItem(key, JSON.stringify(next))
    setState(next)
  }, [state, key])

  return [state, toggle]
}

function ApoyoBtn({ id }) {
  const [{ count, liked }, toggle] = useApoyo(id)
  return (
    <button
      className={`apoyo-btn ${liked ? 'apoyo-btn--active' : ''}`}
      onClick={toggle}
      title={liked ? 'Quitar apoyo' : 'Apoyar este laboratorio'}
    >
      <span className="apoyo-icon">{liked ? '♥' : '♡'}</span>
      <span className="apoyo-count">{count}</span>
    </button>
  )
}

/* ============================================================
   HOME PAGE
============================================================ */
export default function Home() {
  const [activeTopic, setActiveTopic] = useState('Todos')

  const filtered = activeTopic === 'Todos'
    ? bankLabs
    : bankLabs.filter(l => l.topic === activeTopic)

  return (
    <div className="container">
      <div className="home-hero">

        {/* ── Hero ── */}
        <h1>Dinamica de Sistemas Mecanicos</h1>
        <p>GL-IMEC2540-01 · Universidad de los Andes · Laboratorios interactivos</p>

        {/* ── Pre-Labs ── */}
        <div className="home-section">
          <div className="home-section-header">
            <span className="home-section-badge available">Disponibles</span>
            <h2>Pre-Laboratorios</h2>
          </div>
          <div className="lab-cards">
            {prelabs.map(lab => (
              <Link key={lab.num} to={lab.path} className="lab-card">
                <span className="lab-number" style={{ background: lab.color }}>
                  Pre-Lab {lab.num}
                </span>
                <h3>{lab.title}</h3>
                <p>{lab.desc}</p>
                <ApoyoBtn id={`lab${lab.num}`} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Banco de Laboratorios ── */}
        <div className="home-section">
          <div className="home-section-header">
            <span className="home-section-badge bank">Banco</span>
            <h2>Banco de Laboratorios</h2>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-light)', textAlign: 'left', marginBottom: 4 }}>
            {bankLabs.filter(l => l.status === 'available').length} laboratorios disponibles
            · {bankLabs.filter(l => l.status === 'stub').length} en desarrollo
          </p>

          {/* Filter */}
          <div className="bank-filter">
            {TOPICS.map(t => (
              <button
                key={t}
                className={`bank-filter-btn ${activeTopic === t ? 'active' : ''}`}
                onClick={() => setActiveTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <VotePanel labs={bankLabs} />

          <div className="lab-cards">
            {filtered.map(lab =>
              lab.status === 'available' ? (
                <Link
                  key={lab.id}
                  to={lab.path}
                  className="lab-card lab-card--bank"
                  style={{ '--topic-color': lab.color }}
                >
                  <span className="lab-number" style={{ background: lab.color }}>
                    {lab.topic}
                  </span>
                  <h3>{lab.title}</h3>
                  <p>{lab.desc}</p>
                  <ApoyoBtn id={lab.id} />
                </Link>
              ) : (
                <div
                  key={lab.id}
                  className="lab-card lab-card--bank lab-card--stub"
                  style={{ '--topic-color': lab.color }}
                >
                  <span className="lab-number" style={{ background: lab.color }}>
                    {lab.topic}
                  </span>
                  <h3>{lab.title}</h3>
                  <p>{lab.desc}</p>
                  <ApoyoBtn id={lab.id} />
                  <span className="lab-card-lock">En desarrollo</span>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
