import { useState, useRef, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter,
} from 'recharts'

/* ============================================================
   RK4 PENDULUM INTEGRATOR
   dθ/dt = ω
   dω/dt = -(g/L)·sin(θ) − 2ζ·√(g/L)·ω
============================================================ */
function rk4Step(theta, omega, dt, L, g, zeta) {
  const wn = Math.sqrt(g / L)
  const alpha = (t, w) => -(g / L) * Math.sin(t) - 2 * zeta * wn * w
  const k1t = omega,                          k1w = alpha(theta, omega)
  const k2t = omega + k1w * dt / 2,           k2w = alpha(theta + k1t * dt / 2, omega + k1w * dt / 2)
  const k3t = omega + k2w * dt / 2,           k3w = alpha(theta + k2t * dt / 2, omega + k2w * dt / 2)
  const k4t = omega + k3w * dt,               k4w = alpha(theta + k3t * dt, omega + k3w * dt)
  return {
    theta: theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: omega + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w),
  }
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AltDinamica() {
  const [activeTab, setActiveTab] = useState('pendulum')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #276749 100%)' }}>
          <span className="alt-lab-topic-tag">Dinamica</span>
          <h1>Ecuaciones de Movimiento</h1>
          <p className="lab-subtitle">
            Newton-Euler · D'Alembert · Cuerpos rigidos en movimiento
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Principios de la Dinamica</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            La <strong>dinamica</strong> relaciona fuerzas y momentos con el movimiento que generan.
            El metodo de <strong>Newton-Euler</strong> aplica directamente las leyes de Newton
            (ΣF = ma, ΣM = Iα) sobre cada cuerpo. El principio de <strong>D'Alembert</strong>
            introduce la <em>fuerza inercial</em> (−ma) para transformar el problema dinamico
            en equilibrio estatico, facilitando el analisis grafico de mecanismos.
          </p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {[["Newton II", "ΣF = ma"], ["Rotacion", "ΣM = Iα"], ["D'Alembert", "ΣF − ma = 0"]].map(([l, v]) => (
              <div className="alt-stat-box" key={l} style={{ background: '#f0fff4' }}>
                <span className="alt-stat-label">{l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#276749' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[
            ['pendulum', 'Pendulo Simple'],
            ['phase', 'Diagrama de Fase'],
            ['dalembert', "D'Alembert"],
          ].map(([key, label]) => (
            <div key={key} className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </div>
          ))}
        </div>

        {activeTab === 'pendulum' && <PendulumSim />}
        {activeTab === 'phase' && <PhasePlot />}
        {activeTab === 'dalembert' && <DAlembert />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — PENDULUM CANVAS ANIMATION
============================================================ */
function PendulumSim() {
  const canvasRef = useRef(null)
  const stateRef = useRef({ theta: Math.PI / 4, omega: 0 })
  const pRef = useRef({})
  const animRef = useRef(null)
  const lastRef = useRef(null)
  const timeRef = useRef(0)
  const bufferRef = useRef([])

  const [L, setL] = useState(1.5)
  const [theta0, setTheta0] = useState(45)
  const [zeta, setZeta] = useState(0.03)
  const [playing, setPlaying] = useState(true)
  const [tData, setTData] = useState([])

  useEffect(() => { pRef.current = { L, zeta, playing } }, [L, zeta, playing])

  const reset = () => {
    stateRef.current = { theta: theta0 * Math.PI / 180, omega: 0 }
    timeRef.current = 0
    bufferRef.current = []
    lastRef.current = null
    setTData([])
  }

  useEffect(() => { reset() }, [theta0, L, zeta]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const g = 9.81

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.05)
      lastRef.current = time
      const { L, zeta, playing } = pRef.current

      if (playing && dt > 0) {
        for (let i = 0; i < 8; i++) {
          stateRef.current = rk4Step(stateRef.current.theta, stateRef.current.omega, dt / 8, L, g, zeta)
        }
        timeRef.current += dt
        const buf = bufferRef.current
        buf.push({
          t: +timeRef.current.toFixed(3),
          theta: +(stateRef.current.theta * 180 / Math.PI).toFixed(3),
          omega: +stateRef.current.omega.toFixed(4),
        })
        if (buf.length > 3000) buf.shift()
        if (buf.length % 8 === 0) setTData([...buf])
      }

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f0fdf4'); bg.addColorStop(1, '#e6f4ed')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const pivX = W / 2, pivY = H * 0.14
      const scale = Math.min(W, H) * 0.38 / L
      const pLen = L * scale
      const { theta } = stateRef.current
      const bobX = pivX + pLen * Math.sin(theta)
      const bobY = pivY + pLen * Math.cos(theta)

      // Vertical reference
      ctx.strokeStyle = '#c6f6d5'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5])
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(pivX, pivY + pLen + 30); ctx.stroke()
      ctx.setLineDash([])

      // Pivot ceiling
      ctx.fillStyle = '#276749'
      ctx.fillRect(pivX - 30, pivY - 12, 60, 10)
      ctx.strokeStyle = '#276749'; ctx.lineWidth = 1
      for (let px = pivX - 30; px < pivX + 30; px += 10) {
        ctx.beginPath(); ctx.moveTo(px, pivY - 12); ctx.lineTo(px + 6, pivY - 20); ctx.stroke()
      }

      // Rod with gradient
      const rodGrad = ctx.createLinearGradient(pivX, pivY, bobX, bobY)
      rodGrad.addColorStop(0, '#276749'); rodGrad.addColorStop(1, '#38a169')
      ctx.strokeStyle = rodGrad; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(pivX, pivY); ctx.lineTo(bobX, bobY); ctx.stroke()

      // Pivot joint
      ctx.fillStyle = '#142430'
      ctx.beginPath(); ctx.arc(pivX, pivY, 7, 0, 2 * Math.PI); ctx.fill()

      // Bob
      const bobR = 20
      ctx.shadowColor = 'rgba(39,103,73,0.4)'; ctx.shadowBlur = 16
      ctx.fillStyle = '#276749'
      ctx.beginPath(); ctx.arc(bobX, bobY, bobR, 0, 2 * Math.PI); ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath(); ctx.arc(bobX - bobR * 0.3, bobY - bobR * 0.3, bobR * 0.35, 0, 2 * Math.PI); ctx.fill()

      // Angle arc
      if (Math.abs(theta) > 0.02) {
        ctx.strokeStyle = '#f6ad55'; ctx.lineWidth = 2
        const a0 = Math.PI / 2, a1 = Math.PI / 2 - theta
        ctx.beginPath(); ctx.arc(pivX, pivY, 38, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke()
        ctx.font = '12px Inter'; ctx.fillStyle = '#c05621'
        ctx.fillText(`${(theta * 180 / Math.PI).toFixed(1)}°`, pivX + 44, pivY + 8)
      }

      // Info
      const wn = Math.sqrt(g / L)
      const KE = 0.5 * L * L * stateRef.current.omega ** 2
      const PE = g * L * (1 - Math.cos(theta))
      ctx.font = '12px Inter'; ctx.fillStyle = '#142430'
      ctx.fillText(`ωn = ${wn.toFixed(3)} rad/s`, 10, 20)
      ctx.fillText(`T = ${(2 * Math.PI / wn).toFixed(3)} s`, 10, 36)
      ctx.fillText(`KE = ${KE.toFixed(3)} J/kg`, 10, 52)
      ctx.fillText(`PE = ${PE.toFixed(3)} J/kg`, 10, 68)

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Pendulo Simple — Newton-Euler</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>Longitud L: {L.toFixed(2)} m</label>
            <input type="range" min="0.2" max="3.5" step="0.05" value={L} onChange={e => setL(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Angulo inicial θ₀: {theta0}°</label>
            <input type="range" min="5" max="175" step="5" value={theta0} onChange={e => setTheta0(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Amortiguamiento ζ: {zeta.toFixed(3)}</label>
            <input type="range" min="0" max="0.5" step="0.005" value={zeta} onChange={e => setZeta(+e.target.value)} />
          </div>
        </div>
        <button className="btn btn-outline" style={{ marginTop: 8, marginRight: 8 }}
          onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pausar' : 'Reanudar'}
        </button>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={reset}>
          Reiniciar
        </button>
      </div>

      <div className="viz-container">
        <div className="viz-panel">
          <h3>Animacion</h3>
          <canvas ref={canvasRef} width={380} height={380}
            style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>
        <div className="viz-panel">
          <h3>θ(t)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tData.slice(-600)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="theta" stroke="#276749" name="θ(t)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <h3 style={{ marginTop: 16 }}>ω(t)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tData.slice(-600)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'ω (rad/s)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Line type="monotone" dataKey="omega" stroke="#38a169" name="ω(t)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Ecuacion de Movimiento (Newton-Euler)</h3>
        <div className="equation">m·L²·θ'' + c·θ' + m·g·L·sin(θ) = 0</div>
        <p style={{ marginTop: 8, fontSize: 13 }}>
          <strong>Forma estandar:</strong> θ'' + 2ζ·ωn·θ' + ωn²·sin(θ) = 0
          &nbsp;&nbsp; ωn = √(g/L) = {Math.sqrt(9.81 / L).toFixed(3)} rad/s
        </p>
        <p style={{ fontSize: 13, marginTop: 4 }}>
          <strong>Linealizado:</strong> θ'' + ωn²·θ = 0 → θ(t) = θ₀·cos(ωn·t) para θ₀ pequeño
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — PHASE PORTRAIT
============================================================ */
function PhasePlot() {
  const [L, setL] = useState(1.5)
  const [zeta, setZeta] = useState(0.02)

  const phaseData = useMemo(() => {
    const g = 9.81
    const trajectories = []

    for (const theta0Deg of [20, 60, 100, 150]) {
      const pts = []
      let theta = theta0Deg * Math.PI / 180, omega = 0
      for (let i = 0; i < 8000; i++) {
        pts.push({ x: +(theta * 180 / Math.PI).toFixed(2), y: +omega.toFixed(4) })
        const s = rk4Step(theta, omega, 0.005, L, g, zeta)
        theta = s.theta; omega = s.omega
      }
      trajectories.push({ label: `θ₀=${theta0Deg}°`, pts })
    }
    return trajectories
  }, [L, zeta])

  const colors = ['#276749', '#2b6cb0', '#c05621', '#6b46c1']

  return (
    <div>
      <h2 className="section-title">Diagrama de Fase — Espacio de Estados</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>L: {L.toFixed(2)} m</label>
            <input type="range" min="0.3" max="3" step="0.05" value={L} onChange={e => setL(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>ζ: {zeta.toFixed(3)}</label>
            <input type="range" min="0" max="0.4" step="0.005" value={zeta} onChange={e => setZeta(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="profile-chart">
        <h4>θ vs ω — Cuatro condiciones iniciales</h4>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" name="θ (°)" label={{ value: 'θ (°)', position: 'bottom' }} domain={['auto', 'auto']} />
            <YAxis dataKey="y" type="number" name="ω (rad/s)" label={{ value: 'ω (rad/s)', angle: -90, position: 'left' }} domain={['auto', 'auto']} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {phaseData.map((traj, i) => (
              <Scatter key={traj.label} data={traj.pts} fill={colors[i]}
                line={{ stroke: colors[i], strokeWidth: 1.5 }} lineType="fitting"
                name={traj.label} />
            ))}
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="info-box" style={{ marginTop: 16 }}>
        <strong>Interpretacion:</strong> Los atractores espirales hacia el origen indican disipacion de energia (ζ {'>'} 0).
        Las orbitas cerradas ocurren cuando ζ = 0 (sistema conservativo). Para θ₀ grandes (cerca de 180°)
        el sistema puede mostrar comportamiento altamente no lineal.
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — D'ALEMBERT CANVAS DIAGRAM
============================================================ */
function DAlembert() {
  const [mass, setMass] = useState(10)
  const [angle, setAngle] = useState(30)
  const [mu, setMu] = useState(0.2)
  const g = 9.81

  const { N, W, Wpar, Wperp, Ff, a } = useMemo(() => {
    const phi = angle * Math.PI / 180
    const W = mass * g
    const Wpar = W * Math.sin(phi)
    const Wperp = W * Math.cos(phi)
    const N = Wperp
    const Ff = mu * N
    const netF = Wpar - Ff
    const a = netF / mass
    return { N, W, Wpar, Wperp, Ff, a: Math.max(0, a) }
  }, [mass, angle, mu])

  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W_canvas = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W_canvas, H)

    // Background
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W_canvas, H)

    const phi = angle * Math.PI / 180
    const cx = W_canvas / 2, cy = H / 2 - 20
    const blockSize = 50

    // Draw inclined plane
    const planeLen = 200
    const x0 = cx - planeLen * 0.5, y0 = cy + planeLen * 0.5 * Math.tan(phi)
    const x1 = cx + planeLen * 0.5, y1 = cy - planeLen * 0.5 * Math.tan(phi)

    ctx.strokeStyle = '#142430'; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + 30); ctx.lineTo(x1, y0 + 30); ctx.stroke()

    // Angle label
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x0, y0, 40, -phi, 0); ctx.stroke()
    ctx.font = '13px Inter'; ctx.fillStyle = '#c05621'
    ctx.fillText(`${angle}°`, x0 + 44, y0 - 8)

    // Block (rotated rect)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-phi)
    ctx.fillStyle = '#2b6cb0'
    ctx.fillRect(-blockSize / 2, -blockSize, blockSize, blockSize)
    ctx.strokeStyle = '#1a365d'; ctx.lineWidth = 2
    ctx.strokeRect(-blockSize / 2, -blockSize, blockSize, blockSize)
    ctx.font = `bold 13px Inter`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
    ctx.fillText(`${mass}kg`, 0, -blockSize / 2 + 6)
    ctx.textAlign = 'left'
    ctx.restore()

    // Draw force arrows
    function arrow(ox, oy, dx, dy, color, label, scale = 1) {
      const len = Math.hypot(dx, dy) * scale
      const angle_a = Math.atan2(dy, dx)
      const ex = ox + len * Math.cos(angle_a), ey = oy + len * Math.sin(angle_a)
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke()
      // Arrowhead
      const ah = 10
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - ah * Math.cos(angle_a - 0.4), ey - ah * Math.sin(angle_a - 0.4))
      ctx.lineTo(ex - ah * Math.cos(angle_a + 0.4), ey - ah * Math.sin(angle_a + 0.4))
      ctx.closePath(); ctx.fill()
      ctx.font = 'bold 12px Inter'; ctx.fillStyle = color
      ctx.fillText(label, ex + 6, ey + 4)
    }

    const scl = 2.5
    // Weight W (downward)
    arrow(cx, cy - blockSize / 2, 0, W * scl, '#e53e3e', `W=${W.toFixed(1)}N`)
    // Normal N (perpendicular to plane, upward from surface)
    arrow(cx, cy - blockSize, N * scl * Math.sin(phi), -N * scl * Math.cos(phi), '#38a169', `N=${N.toFixed(1)}N`)
    // Friction (along plane, opposing motion)
    if (a > 0) {
      arrow(cx, cy - blockSize / 2, -Ff * scl * Math.cos(phi), Ff * scl * Math.sin(phi), '#ed8936', `Ff=${Ff.toFixed(1)}N`)
      // Inertial force (D'Alembert, opposite to acceleration)
      arrow(cx, cy - blockSize / 2, Ff * scl * Math.cos(phi) + (Wpar - Ff) * scl * 0.5 * Math.cos(phi),
        -((Wpar - Ff) * scl * 0.5) * Math.sin(phi) + Ff * scl * (-0.5) * Math.sin(phi),
        '#9f7aea', `−ma`, 0.8)
    }
  }, [mass, angle, mu, N, W, Wpar, Ff, a]) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Principio de D'Alembert — Plano Inclinado</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>Masa m: {mass} kg</label>
            <input type="range" min="1" max="50" step="1" value={mass} onChange={e => setMass(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Angulo θ: {angle}°</label>
            <input type="range" min="5" max="75" step="1" value={angle} onChange={e => setAngle(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Coef. roce μ: {mu.toFixed(2)}</label>
            <input type="range" min="0" max="0.8" step="0.01" value={mu} onChange={e => setMu(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="viz-container">
        <div className="viz-panel">
          <h3>Diagrama de Fuerzas</h3>
          <canvas ref={canvasRef} width={460} height={340}
            style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>

        <div className="viz-panel">
          <h3>Resultados</h3>
          <div className="alt-stat-grid">
            {[
              ['Peso W', `${W.toFixed(2)} N`],
              ['Normal N', `${N.toFixed(2)} N`],
              ['Comp. paralela', `${Wpar.toFixed(2)} N`],
              ['Comp. perp.', `${Wperp.toFixed(2)} N`],
              ['Roce Ff', `${Ff.toFixed(2)} N`],
              ['Aceleracion a', `${a.toFixed(3)} m/s²`],
            ].map(([lbl, val]) => (
              <div className="alt-stat-row" key={lbl}>
                <span>{lbl}</span>
                <span className="alt-val">{val}</span>
              </div>
            ))}
          </div>

          <div className="editable-section" style={{ marginTop: 16 }}>
            <h4>D'Alembert</h4>
            <p style={{ fontSize: 13 }}>W·sin(θ) − μ·N − m·a = 0</p>
            <p style={{ fontSize: 13 }}>N = m·g·cos(θ)</p>
            <p style={{ fontSize: 13 }}>a = g·(sin(θ) − μ·cos(θ))</p>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>
              a = {g.toFixed(2)}·(sin({angle}°) − {mu.toFixed(2)}·cos({angle}°)) = {a.toFixed(3)} m/s²
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
