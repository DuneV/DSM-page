import { useState, useRef, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

/* ============================================================
   SLIDER-CRANK GEOMETRY
   O at (0,0), A = (a·cosθ, a·sinθ), B = (xB, 0)
   xB = a·cosθ + √(b² − a²·sin²θ)
============================================================ */
function sliderPos(a, b, theta) {
  const disc = b * b - a * a * Math.sin(theta) ** 2
  if (disc < 0) return null
  return a * Math.cos(theta) + Math.sqrt(disc)
}

function sliderVel(a, b, theta, omega) {
  const disc = b * b - a * a * Math.sin(theta) ** 2
  if (disc < 1e-10) return 0
  return omega * (-a * Math.sin(theta) - a * a * Math.sin(theta) * Math.cos(theta) / Math.sqrt(disc))
}

export default function AltSlider() {
  const [activeTab, setActiveTab] = useState('sim')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #1a2e4a 0%, #2b6cb0 100%)' }}>
          <span className="alt-lab-topic-tag">Cinematica</span>
          <h1>Mecanismo Manivela-Corredera</h1>
          <p className="lab-subtitle">
            Cinematica de la biela-manivela · Piston · Posicion, velocidad y aceleracion
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Fundamentos</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>mecanismo manivela-corredera</strong> (o biela-manivela) convierte
            movimiento rotatorio continuo en movimiento alternativo rectilineo.
            Es la base de motores de combustion interna, compresores y bombas.
            La <strong>manivela</strong> (a) gira, la <strong>biela</strong> (b) la conecta
            al <strong>piston</strong> que desliza sobre una guia horizontal.
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[['GDL', '1'], ['Eslabones', '3+tierra'], ['Pares', '3R + 1P']].map(([l, v]) => (
              <div className="alt-stat-box" key={l}>
                <span className="alt-stat-label">{l}</span>
                <span className="alt-stat-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['sim', 'Simulacion'], ['charts', 'Pos · Vel · Acel'], ['eq', 'Ecuaciones']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`}
              onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'sim' && <SliderSim />}
        {activeTab === 'charts' && <SliderCharts />}
        {activeTab === 'eq' && <SliderEquations />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — CANVAS ANIMATION
============================================================ */
function SliderSim() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const lastRef = useRef(null)
  const thetaRef = useRef(0)
  const pRef = useRef({})

  const [a, setA] = useState(60)
  const [b, setB] = useState(150)
  const [omega, setOmega] = useState(2)
  const [playing, setPlaying] = useState(true)
  const [snap, setSnap] = useState(null)

  useEffect(() => { pRef.current = { a, b, omega, playing } }, [a, b, omega, playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.05)
      lastRef.current = time
      const { a, b, omega, playing } = pRef.current
      if (playing) thetaRef.current += omega * dt

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#ebf4ff'); bg.addColorStop(1, '#dbeafe')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const theta = thetaRef.current
      // Origin at left-center area
      const ox = W * 0.28, oy = H * 0.52
      const scale = Math.min(W, H) / (3.5 * (a + b))

      const Ax = ox + a * scale * Math.cos(theta)
      const Ay = oy - a * scale * Math.sin(theta)

      const xB_mm = sliderPos(a, b, theta)
      if (!xB_mm) { animRef.current = requestAnimationFrame(frame); return }

      const Bx = ox + xB_mm * scale
      const By = oy   // slider constrained to horizontal axis

      // Cylinder guide
      const cylY = oy - 22, cylH = 44
      ctx.fillStyle = '#bfdbfe'
      ctx.fillRect(ox - 10, cylY, W - ox, cylH)
      ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2
      ctx.strokeRect(ox - 10, cylY, W - ox, cylH)

      // Guide rail (center line)
      ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 10, oy); ctx.stroke()
      ctx.setLineDash([])

      // Crank pivot
      ctx.fillStyle = '#1e3a5f'
      ctx.beginPath(); ctx.arc(ox, oy, 8, 0, 2 * Math.PI); ctx.fill()

      // Crank disk
      ctx.fillStyle = 'rgba(43,108,176,0.15)'
      ctx.beginPath(); ctx.arc(ox, oy, a * scale, 0, 2 * Math.PI); ctx.fill()
      ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.arc(ox, oy, a * scale, 0, 2 * Math.PI); ctx.stroke()
      ctx.setLineDash([])

      // Crank arm
      ctx.strokeStyle = '#2b6cb0'; ctx.lineWidth = 6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(Ax, Ay); ctx.stroke()

      // Connecting rod
      ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.stroke()

      // Piston block
      const pW = 36, pH = 36
      ctx.fillStyle = '#2b6cb0'
      ctx.shadowColor = 'rgba(43,108,176,0.35)'; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.roundRect(Bx - pW / 2, By - pH / 2, pW, pH, 5); ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(Bx - pW / 2, By - pH / 2, pW, pH, 5); ctx.stroke()

      // Joints
      const joint = (x, y, r, fill, stroke) => {
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      }
      joint(Ax, Ay, 6, '#ed8936', '#92400e')
      joint(Bx, By, 5, '#fff', '#2b6cb0')

      // Angle arc
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2
      ctx.beginPath()
      const ang = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      ctx.arc(ox, oy, 26, 0, ang > Math.PI ? ang - 2 * Math.PI : ang)
      ctx.stroke()

      // Labels
      ctx.font = 'bold 12px Inter'; ctx.fillStyle = '#1e3a5f'
      ctx.fillText('O', ox - 18, oy + 18)
      ctx.fillStyle = '#ed8936'; ctx.fillText('A', Ax + 8, Ay - 4)
      ctx.fillStyle = '#2b6cb0'; ctx.fillText('B', Bx - 6, By - 24)

      // Displacement arrow
      ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(ox, oy + 32); ctx.lineTo(Bx, oy + 32); ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '11px Inter'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'center'
      ctx.fillText(`x = ${xB_mm.toFixed(1)}`, (ox + Bx) / 2, oy + 44)
      ctx.textAlign = 'left'

      // Info
      const vel = sliderVel(a, b, theta, omega)
      ctx.font = '12px Inter'; ctx.fillStyle = '#1e3a5f'
      ctx.fillText(`θ = ${(ang * 180 / Math.PI).toFixed(1)}°`, 10, 20)
      ctx.fillText(`x = ${xB_mm.toFixed(2)} mm`, 10, 36)
      ctx.fillText(`ẋ = ${vel.toFixed(2)} mm/s`, 10, 52)

      setSnap({ theta: (ang * 180 / Math.PI).toFixed(1), x: xB_mm.toFixed(2), v: vel.toFixed(3) })
      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Simulacion Manivela-Corredera</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['Manivela a (mm)', a, setA, 20, 100, 1],
            ['Biela b (mm)', b, setB, 80, 250, 1],
            ['Velocidad ω (rad/s)', omega, setOmega, 0.3, 10, 0.1],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(1) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
        <button className="btn btn-outline" style={{ marginTop: 8 }}
          onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pausar' : 'Reanudar'}
        </button>
      </div>

      <div className="viz-container">
        <div className="viz-panel">
          <h3>Animacion</h3>
          <canvas ref={canvasRef} width={520} height={300}
            style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {[['#2b6cb0', 'Manivela a'], ['#ed8936', 'Biela b'], ['#2b6cb0', 'Piston']].map(([col, lbl]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 18, height: 4, background: col, borderRadius: 2 }} />
                <span style={{ fontSize: 12 }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="viz-panel">
          <h3>Estado Actual</h3>
          {snap && (
            <div className="alt-stat-grid">
              {[
                ['Angulo θ', `${snap.theta}°`],
                ['Posicion x', `${snap.x} mm`],
                ['Velocidad ẋ', `${snap.v} mm/s`],
                ['Carrera (stroke)', `${(2 * a).toFixed(0)} mm`],
                ['Relacion λ = a/b', `${(a / b).toFixed(3)}`],
              ].map(([l, v]) => (
                <div className="alt-stat-row" key={l}>
                  <span>{l}</span><span className="alt-val">{v}</span>
                </div>
              ))}
            </div>
          )}
          <div className="info-box" style={{ marginTop: 12, fontSize: 13 }}>
            <strong>Carrera:</strong> El piston recorre 2a mm por revolucion.
            El PMS (punto muerto superior) ocurre en θ=0°, el PMI en θ=180°.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — POSITION, VELOCITY, ACCELERATION CHARTS
============================================================ */
function SliderCharts() {
  const [a, setA] = useState(60)
  const [b, setB] = useState(150)
  const [omega, setOmega] = useState(2)

  const data = useMemo(() => {
    const pts = []
    const dtheta = 2 * Math.PI / 360
    for (let i = 0; i <= 360; i++) {
      const theta = i * Math.PI / 180
      const x = sliderPos(a, b, theta)
      if (x == null) continue
      const v = sliderVel(a, b, theta, omega)

      // Acceleration: numerical derivative of velocity
      const th1 = theta + 0.001
      const v1 = sliderVel(a, b, th1, omega)
      const acc = (v1 - v) / 0.001 * omega

      pts.push({
        deg: i, x: +x.toFixed(3), v: +v.toFixed(4), a: +acc.toFixed(4),
      })
    }
    return pts
  }, [a, b, omega])

  return (
    <div>
      <h2 className="section-title">Posicion, Velocidad y Aceleracion del Piston</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['a (mm)', a, setA, 10, 100, 1],
            ['b (mm)', b, setB, 60, 250, 1],
            ['ω (rad/s)', omega, setOmega, 0.5, 20, 0.5],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(1) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="profiles-grid">
        {[
          { key: 'x', label: 'Posicion x(θ) [mm]', color: '#2b6cb0', unit: 'mm' },
          { key: 'v', label: 'Velocidad ẋ(θ) [mm/s]', color: '#ed8936', unit: 'mm/s' },
          { key: 'a', label: 'Aceleracion ẍ(θ) [mm/s²]', color: '#e53e3e', unit: 'mm/s²' },
        ].map(({ key, label, color }) => (
          <div className="profile-chart" key={key}>
            <h4>{label}</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="deg" label={{ value: 'θ (°)', position: 'bottom' }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={key} stroke={color} dot={false} strokeWidth={2} name={label} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      <div className="info-box" style={{ marginTop: 8 }}>
        <strong>Nota:</strong> Para λ = a/b pequeño la forma se aproxima a sinusoidal pura.
        Para λ grande (biela corta), la asimetria entre el semiciclo de expansion y compresion
        es notable en la aceleracion — importante en el diseno de motores.
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — EQUATIONS
============================================================ */
function SliderEquations() {
  return (
    <div>
      <h2 className="section-title">Modelo Cinematico</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Cierre de Lazo</h3>
        <div className="equation">a·e^(jθ) + b·e^(jφ) = xB</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Separando parte imaginaria: a·sinθ + b·sinφ = 0 → sinφ = −(a/b)·sinθ = −λ·sinθ
        </p>
        <p style={{ fontSize: 13 }}>
          Parte real: xB = a·cosθ + b·cosφ = a·cosθ + √(b² − a²·sin²θ)
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Velocidad del Piston</h3>
        <div className="equation">
          ẋB = −a·ω·sinθ · [1 + (a·cosθ) / √(b²−a²sin²θ)]
        </div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Velocidad maxima ≈ ocurre cerca de θ = 90° y 270°.
          En PMS (θ=0°) y PMI (θ=180°) la velocidad es cero.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Aproximacion de Fourier (λ = a/b pequeno)</h3>
        <div className="equation">
          xB ≈ b + a·cosθ + (a²/2b)·cos2θ
        </div>
        <div className="equation" style={{ marginTop: 8 }}>
          ẋB ≈ −a·ω·(sinθ + λ/2·sin2θ)
        </div>
        <div className="equation" style={{ marginTop: 8 }}>
          ẍB ≈ −a·ω²·(cosθ + λ·cos2θ)
        </div>
        <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-light)' }}>
          El segundo armonico (cos2θ) es la fuente de las fuerzas inerciales de segundo orden
          en motores de combustion interna.
        </p>
      </div>

      <div className="card">
        <h3>Relacion Manivela-Corredera vs 4 Barras</h3>
        <table>
          <thead><tr><th>Parametro</th><th>Manivela-Corredera</th><th>4 Barras</th></tr></thead>
          <tbody>
            <tr><td>GDL</td><td>1</td><td>1</td></tr>
            <tr><td>Salida</td><td>Traslacion (piston)</td><td>Rotacion (seguidor)</td></tr>
            <tr><td>Carrera</td><td>2a (fija)</td><td>Variable (segun diseño)</td></tr>
            <tr><td>Singularidades</td><td>PMS y PMI (θ = 0°, 180°)</td><td>Posiciones de bloqueo</td></tr>
            <tr><td>Aplicaciones</td><td>Motores, compresores</td><td>Prensas, actuadores</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
