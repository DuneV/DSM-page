import { useState, useRef, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'

/* ============================================================
   RK4 — SPRING-MASS WITH DAMPING
   x'' + 2ζωn x' + ωn² x = 0
============================================================ */
function rk4Spring(x, v, dt, m, k, c) {
  const alpha = (xi, vi) => -(k / m) * xi - (c / m) * vi
  const k1x = v,                   k1v = alpha(x, v)
  const k2x = v + k1v * dt / 2,    k2v = alpha(x + k1x * dt / 2, v + k1v * dt / 2)
  const k3x = v + k2v * dt / 2,    k3v = alpha(x + k2x * dt / 2, v + k2v * dt / 2)
  const k4x = v + k3v * dt,        k4v = alpha(x + k3x * dt, v + k3v * dt)
  return {
    x: x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    v: v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v),
  }
}

/* ============================================================
   RK4 — DOUBLE PENDULUM
   State: [t1, w1, t2, w2]
============================================================ */
function rk4DoublePend(state, dt, m1, m2, L1, L2, g) {
  function deriv([t1, w1, t2, w2]) {
    const d = t1 - t2
    const denom1 = (2 * m1 + m2) * L1 - m2 * L1 * Math.cos(2 * d)
    const denom2 = (L2 / L1) * denom1

    const alpha1 = (
      -m2 * L1 * w1 * w1 * Math.sin(2 * d)
      - 2 * m2 * L2 * w2 * w2 * Math.sin(d)
      - 2 * g * (m1 + m2) * Math.sin(t1)
      - 2 * m2 * g * Math.cos(d) * (Math.sin(t1) - Math.sin(t2))
      + 2 * m2 * g * Math.sin(d) * Math.cos(t2)
    ) / denom1

    const alpha2 = (
      2 * Math.sin(d) * (
        (m1 + m2) * L1 * w1 * w1
        + m2 * L2 * w2 * w2 * Math.cos(d)
        + (m1 + m2) * g * Math.cos(t1)
      )
    ) / denom2

    return [w1, alpha1, w2, alpha2]
  }

  const k1 = deriv(state)
  const s2 = state.map((s, i) => s + k1[i] * dt / 2)
  const k2 = deriv(s2)
  const s3 = state.map((s, i) => s + k2[i] * dt / 2)
  const k3 = deriv(s3)
  const s4 = state.map((s, i) => s + k3[i] * dt)
  const k4 = deriv(s4)
  return state.map((s, i) => s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AltEnergias() {
  const [activeTab, setActiveTab] = useState('spring')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #3d2100 0%, #975a16 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#fefcbf', color: '#744210' }}>Energias</span>
          <h1>Metodos Energeticos</h1>
          <p className="lab-subtitle">
            Lagrangiano · Conservacion de Energia · Sistemas no lineales
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Metodos Energeticos en Dinamica</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            Los <strong>metodos energeticos</strong> derivan ecuaciones de movimiento sin necesidad
            de analizar fuerzas internas. El <strong>Lagrangiano</strong> L = T − V usa energia
            cinetica T y potencial V para obtener las EOM via la ecuacion de Euler-Lagrange.
            Para sistemas conservativos, la <strong>energia mecanica total</strong> E = T + V
            permanece constante, lo que permite analizar equilibrios y estabilidad directamente.
          </p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {[
              ['Lagrangiano', 'L = T − V'],
              ['Euler-Lagrange', 'd/dt(∂L/∂q̇)−∂L/∂q=0'],
              ['Conservacion', 'dE/dt = 0'],
            ].map(([lbl, eq]) => (
              <div className="alt-stat-box" key={lbl} style={{ background: '#fffbeb' }}>
                <span className="alt-stat-label">{lbl}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#92400e' }}>{eq}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[
            ['spring', 'Sistema Masa-Resorte'],
            ['pendulum', 'Pendulo (Lagrangiano)'],
            ['double', 'Pendulo Doble'],
          ].map(([key, label]) => (
            <div key={key} className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </div>
          ))}
        </div>

        {activeTab === 'spring' && <SpringMass />}
        {activeTab === 'pendulum' && <PendulumEnergy />}
        {activeTab === 'double' && <DoublePendulum />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — SPRING-MASS CANVAS + ENERGY CHART
============================================================ */
function SpringMass() {
  const canvasRef = useRef(null)
  const stateRef = useRef({ x: 0.05, v: 0 })
  const pRef = useRef({})
  const animRef = useRef(null)
  const lastRef = useRef(null)
  const timeRef = useRef(0)
  const bufRef = useRef([])

  const [m, setM] = useState(2.0)
  const [k, setK] = useState(400)
  const [c, setC] = useState(1.0)
  const [x0, setX0] = useState(5)    // cm
  const [playing, setPlaying] = useState(true)
  const [tData, setTData] = useState([])

  useEffect(() => { pRef.current = { m, k, c, playing } }, [m, k, c, playing])

  const reset = () => {
    stateRef.current = { x: x0 / 100, v: 0 }
    timeRef.current = 0; bufRef.current = []; lastRef.current = null; setTData([])
  }
  useEffect(() => { reset() }, [x0, m, k, c]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.05)
      lastRef.current = time
      const { m, k, c, playing } = pRef.current

      if (playing && dt > 0) {
        for (let i = 0; i < 8; i++) {
          stateRef.current = rk4Spring(stateRef.current.x, stateRef.current.v, dt / 8, m, k, c)
        }
        timeRef.current += dt
        const { x, v } = stateRef.current
        const KE = 0.5 * m * v * v
        const PE = 0.5 * k * x * x
        bufRef.current.push({
          t: +timeRef.current.toFixed(3),
          x: +(x * 100).toFixed(3),
          KE: +KE.toFixed(4), PE: +PE.toFixed(4), E: +(KE + PE).toFixed(4),
        })
        if (bufRef.current.length > 2000) bufRef.current.shift()
        if (bufRef.current.length % 6 === 0) setTData([...bufRef.current])
      }

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#fffbeb'); bg.addColorStop(1, '#fef3c7')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const eq = W / 2
      const { x } = stateRef.current
      const scl = W * 1.2
      const blockX = eq + x * scl
      const blockH = 60, blockW = 70, blockY = H / 2 - blockH / 2

      // Wall
      ctx.fillStyle = '#d97706'
      ctx.fillRect(0, blockY - 20, 16, blockH + 40)
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1
      for (let py = blockY - 20; py < blockY + blockH + 20; py += 14) {
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(-10, py + 10); ctx.stroke()
      }

      // Spring (coil drawing)
      const nCoils = 12
      const sprX0 = 16, sprX1 = blockX
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.beginPath()
      ctx.moveTo(sprX0, H / 2)
      const dx = (sprX1 - sprX0) / (nCoils * 2)
      for (let i = 0; i < nCoils * 2; i++) {
        ctx.lineTo(sprX0 + dx * (i + 0.5), H / 2 + (i % 2 === 0 ? -12 : 12))
        ctx.lineTo(sprX0 + dx * (i + 1), H / 2)
      }
      ctx.stroke()

      // Equilibrium line
      ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 1; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(eq, blockY - 30); ctx.lineTo(eq, blockY + blockH + 30); ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '11px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText('eq.', eq + 4, blockY - 32)

      // Block with gradient
      const bGrad = ctx.createLinearGradient(blockX, blockY, blockX + blockW, blockY + blockH)
      bGrad.addColorStop(0, '#975a16'); bGrad.addColorStop(1, '#c05621')
      ctx.fillStyle = bGrad
      ctx.beginPath()
      ctx.roundRect(blockX, blockY, blockW, blockH, 6)
      ctx.fill()
      ctx.strokeStyle = '#7b341e'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(blockX, blockY, blockW, blockH, 6); ctx.stroke()
      ctx.font = 'bold 13px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
      ctx.fillText(`${m}kg`, blockX + blockW / 2, blockY + blockH / 2 + 5)
      ctx.textAlign = 'left'

      // Ground
      ctx.fillStyle = '#d97706'
      ctx.fillRect(0, blockY + blockH, W, 8)

      // Displacement indicator
      const dispCm = (x * 100).toFixed(1)
      ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(eq, blockY - 18); ctx.lineTo(blockX, blockY - 18); ctx.stroke()
      ctx.setLineDash([])
      if (Math.abs(x) > 0.001) {
        const mid = (eq + blockX) / 2
        ctx.font = 'bold 11px Inter'; ctx.fillStyle = '#e53e3e'; ctx.textAlign = 'center'
        ctx.fillText(`x=${dispCm}cm`, mid, blockY - 22)
        ctx.textAlign = 'left'
      }

      // Info
      const KE = 0.5 * m * stateRef.current.v ** 2
      const PE = 0.5 * k * x * x
      ctx.font = '12px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText(`ωn = ${Math.sqrt(k/m).toFixed(2)} rad/s`, 12, 20)
      ctx.fillText(`KE = ${KE.toFixed(3)} J`, 12, 36)
      ctx.fillText(`PE = ${PE.toFixed(3)} J`, 12, 52)
      ctx.fillText(`E  = ${(KE + PE).toFixed(3)} J`, 12, 68)

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Sistema Masa-Resorte — Conservacion de Energia</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>Masa m: {m.toFixed(1)} kg</label>
            <input type="range" min="0.5" max="10" step="0.1" value={m} onChange={e => setM(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Rigidez k: {k} N/m</label>
            <input type="range" min="50" max="2000" step="10" value={k} onChange={e => setK(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Amort. c: {c.toFixed(1)} N·s/m</label>
            <input type="range" min="0" max="30" step="0.5" value={c} onChange={e => setC(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Despl. inicial x₀: {x0} cm</label>
            <input type="range" min="1" max="15" step="0.5" value={x0} onChange={e => setX0(+e.target.value)} />
          </div>
        </div>
        <button className="btn btn-outline" style={{ marginTop: 8, marginRight: 8 }} onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pausar' : 'Reanudar'}
        </button>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={reset}>Reiniciar</button>
      </div>

      <div className="viz-container">
        <div className="viz-panel">
          <h3>Simulacion</h3>
          <canvas ref={canvasRef} width={480} height={280}
            style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>
        <div className="viz-panel">
          <h3>Energia vs Tiempo</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={tData.slice(-400)}>
              <defs>
                <linearGradient id="gradKE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ed8936" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ed8936" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2b6cb0" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2b6cb0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'E (J)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="KE" stroke="#ed8936" fill="url(#gradKE)" name="KE" dot={false} strokeWidth={2} />
              <Area type="monotone" dataKey="PE" stroke="#2b6cb0" fill="url(#gradPE)" name="PE" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="E" stroke="#e53e3e" name="E total" dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Lagrangiano del Sistema</h3>
        <p>T = ½·m·ẋ² &nbsp;&nbsp; V = ½·k·x² &nbsp;&nbsp; L = T − V</p>
        <div className="equation">d/dt(∂L/∂ẋ) − ∂L/∂x = 0 &nbsp;→&nbsp; m·ẍ + k·x = 0</div>
        <p style={{ marginTop: 8, fontSize: 13 }}>
          Para c {'>'} 0: m·ẍ + c·ẋ + k·x = 0 &nbsp;|&nbsp;
          ωn = √(k/m) = {Math.sqrt(k / m).toFixed(3)} rad/s &nbsp;|&nbsp;
          ζ = c/(2√km) = {(c / (2 * Math.sqrt(k * m))).toFixed(4)}
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — PENDULUM ENERGY (LAGRANGIAN DERIVATION)
============================================================ */
function PendulumEnergy() {
  const [L, setL] = useState(1.2)
  const [theta0, setTheta0] = useState(60)

  const energyData = useMemo(() => {
    const g = 9.81, m = 1
    const wn = Math.sqrt(g / L)
    const data = []
    let theta = theta0 * Math.PI / 180, omega = 0
    for (let i = 0; i <= 6000; i++) {
      const dt = 0.002
      const s = rk4Spring(theta, omega, dt, 1, wn * wn, 0)
      // Actually use proper pendulum
      const alpha = -(g / L) * Math.sin(theta)
      const k1t = omega, k1w = alpha
      const k2t = omega + k1w * dt / 2, k2w = -(g / L) * Math.sin(theta + k1t * dt / 2)
      const k3t = omega + k2w * dt / 2, k3w = -(g / L) * Math.sin(theta + k2t * dt / 2)
      const k4t = omega + k3w * dt, k4w = -(g / L) * Math.sin(theta + k3t * dt)
      theta += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t)
      omega += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w)

      const KE = 0.5 * m * L * L * omega * omega
      const PE = m * g * L * (1 - Math.cos(theta))
      if (i % 10 === 0) {
        data.push({
          t: +(i * dt).toFixed(3),
          KE: +KE.toFixed(4), PE: +PE.toFixed(4), E: +(KE + PE).toFixed(4),
          theta: +(theta * 180 / Math.PI).toFixed(2),
        })
      }
    }
    return data
  }, [L, theta0])

  return (
    <div>
      <h2 className="section-title">Pendulo — Metodo Lagrangiano</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>L: {L.toFixed(2)} m</label>
            <input type="range" min="0.2" max="3" step="0.05" value={L} onChange={e => setL(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>θ₀: {theta0}°</label>
            <input type="range" min="5" max="170" step="5" value={theta0} onChange={e => setTheta0(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Energia Cinetica y Potencial vs t</h4>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={energyData}>
              <defs>
                <linearGradient id="gKE2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ed8936" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#ed8936" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPE2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b46c1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b46c1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'E (J)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Area type="monotone" dataKey="KE" stroke="#ed8936" fill="url(#gKE2)" name="T (cinetica)" dot={false} />
              <Area type="monotone" dataKey="PE" stroke="#6b46c1" fill="url(#gPE2)" name="V (potencial)" dot={false} />
              <Line type="monotone" dataKey="E" stroke="#e53e3e" name="E total" dot={false} strokeDasharray="5 3" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>θ(t)</h4>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Line type="monotone" dataKey="theta" stroke="#975a16" name="θ(t)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Derivacion Lagrangiana del Pendulo</h3>
        <p><strong>Coordenada generalizada:</strong> q = θ</p>
        <p><strong>T</strong> = ½·m·L²·θ̇² &nbsp;&nbsp; <strong>V</strong> = m·g·L·(1 − cos θ)</p>
        <div className="equation">L = T − V = ½mL²θ̇² − mgL(1−cosθ)</div>
        <p style={{ marginTop: 8 }}>
          <strong>Euler-Lagrange:</strong> d/dt(mL²θ̇) + mgL·sinθ = 0
        </p>
        <div className="equation">mL²·θ̈ + mgL·sinθ = 0 &nbsp;→&nbsp; θ̈ + (g/L)·sinθ = 0</div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>
          El Lagrangiano <em>evita</em> calcular la tension en la cuerda (fuerza de ligadura),
          trabajando directamente con la coordenada generalizada θ.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — DOUBLE PENDULUM CHAOS CANVAS
============================================================ */
function DoublePendulum() {
  const canvasRef = useRef(null)
  const stateRef = useRef([Math.PI / 2, 0, Math.PI / 2 + 0.01, 0])
  const pRef = useRef({})
  const animRef = useRef(null)
  const lastRef = useRef(null)
  const trailRef = useRef([])

  const [L1, setL1] = useState(1.2)
  const [L2, setL2] = useState(1.0)
  const [m1, setM1] = useState(1.5)
  const [m2, setM2] = useState(1.0)
  const [playing, setPlaying] = useState(true)
  const [t1init, setT1] = useState(90)
  const [t2init, setT2] = useState(91)

  useEffect(() => { pRef.current = { L1, L2, m1, m2, playing } }, [L1, L2, m1, m2, playing])

  const reset = () => {
    stateRef.current = [t1init * Math.PI / 180, 0, t2init * Math.PI / 180, 0]
    trailRef.current = []; lastRef.current = null
  }
  useEffect(() => { reset() }, [t1init, t2init]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const g = 9.81

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.04)
      lastRef.current = time
      const { L1, L2, m1, m2, playing } = pRef.current

      if (playing && dt > 0) {
        for (let i = 0; i < 12; i++) {
          stateRef.current = rk4DoublePend(stateRef.current, dt / 12, m1, m2, L1, L2, g)
        }
      }

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#fffbeb'); bgGrad.addColorStop(1, '#fef3c7')
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H)

      const [t1, , t2] = stateRef.current
      const pivX = W / 2, pivY = H * 0.18
      const scale = Math.min(W, H) / (2.6 * (L1 + L2))

      const x1 = pivX + L1 * scale * Math.sin(t1)
      const y1 = pivY + L1 * scale * Math.cos(t1)
      const x2 = x1 + L2 * scale * Math.sin(t2)
      const y2 = y1 + L2 * scale * Math.cos(t2)

      // Trail
      trailRef.current.push([x2, y2])
      if (trailRef.current.length > 400) trailRef.current.shift()
      if (trailRef.current.length > 2) {
        ctx.beginPath()
        trailRef.current.forEach(([tx, ty], i) => {
          const alpha = i / trailRef.current.length
          ctx.strokeStyle = `rgba(194,120,22,${alpha * 0.6})`
          ctx.lineWidth = 1.5
          if (i === 0) ctx.moveTo(tx, ty)
          else ctx.lineTo(tx, ty)
        })
        ctx.stroke()
      }

      // Pivot
      ctx.fillStyle = '#d97706'
      ctx.fillRect(pivX - 30, pivY - 10, 60, 8)
      ctx.fillStyle = '#142430'
      ctx.beginPath(); ctx.arc(pivX, pivY, 6, 0, 2 * Math.PI); ctx.fill()

      // Links
      ctx.strokeStyle = '#975a16'; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(x1, y1); ctx.stroke()
      ctx.strokeStyle = '#c05621'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

      // Bobs
      ctx.fillStyle = '#975a16'
      ctx.shadowColor = 'rgba(151,90,22,0.4)'; ctx.shadowBlur = 14
      ctx.beginPath(); ctx.arc(x1, y1, 14 + m1 * 3, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = '#c05621'
      ctx.beginPath(); ctx.arc(x2, y2, 12 + m2 * 3, 0, 2 * Math.PI); ctx.fill()
      ctx.shadowBlur = 0

      ctx.font = '12px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText(`θ₁=${(t1 * 180 / Math.PI).toFixed(1)}°  θ₂=${(t2 * 180 / Math.PI).toFixed(1)}°`, 10, 20)

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Pendulo Doble — Comportamiento Caotico</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['L₁', L1, setL1, 0.3, 2, 0.05],
            ['L₂', L2, setL2, 0.3, 2, 0.05],
            ['m₁ (kg)', m1, setM1, 0.5, 5, 0.1],
            ['m₂ (kg)', m2, setM2, 0.5, 5, 0.1],
            ['θ₁₀ (°)', t1init, setT1, 10, 170, 1],
            ['θ₂₀ (°)', t2init, setT2, 10, 170, 1],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(2) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
        <button className="btn btn-outline" style={{ marginTop: 8, marginRight: 8 }}
          onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pausar' : 'Reanudar'}
        </button>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={reset}>Reiniciar</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <canvas ref={canvasRef} width={540} height={420}
          style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }} />
      </div>

      <div className="info-box" style={{ marginTop: 20 }}>
        <strong>Caos Deterministico:</strong> Cambia θ₂₀ en 1° y observa como la trayectoria
        diverge completamente. El pendulo doble es sensible a condiciones iniciales (efecto mariposa).
        Su Lagrangiano tiene 2 coordenadas generalizadas (θ₁, θ₂) y produce dos EOM acopladas.
      </div>
    </div>
  )
}
