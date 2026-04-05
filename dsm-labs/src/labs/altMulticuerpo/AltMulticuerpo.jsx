import { useState, useRef, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/* ============================================================
   2-LINK PLANAR ROBOT — INVERSE DYNAMICS (Newton-Euler)
   Given θ, θ̇, θ̈ → compute required joint torques τ₁, τ₂

   Equations of motion (standard 2R robot):
   τ = M(θ)·θ̈ + C(θ,θ̇)·θ̇ + G(θ)

   M11 = (m1+m2)L1² + m2L2² + 2m2L1L2cos(θ2)
   M12 = m2L2² + m2L1L2cos(θ2)
   M22 = m2L2²
   C11 = -m2L1L2sin(θ2)·θ̇2
   C12 = -m2L1L2sin(θ2)·(θ̇1+θ̇2)
   C21 =  m2L1L2sin(θ2)·θ̇1
   C22 = 0
   G1  = (m1+m2)g·L1cos(θ1) + m2g·L2cos(θ1+θ2)
   G2  = m2g·L2cos(θ1+θ2)
============================================================ */
function inverseDynamics2R(m1, m2, L1, L2, g, t1, t2, td1, td2, tdd1, tdd2) {
  const c2 = Math.cos(t2), s2 = Math.sin(t2)
  const M11 = (m1 + m2) * L1 * L1 + m2 * L2 * L2 + 2 * m2 * L1 * L2 * c2
  const M12 = m2 * L2 * L2 + m2 * L1 * L2 * c2
  const M22 = m2 * L2 * L2
  const C11 = -m2 * L1 * L2 * s2 * td2
  const C12 = -m2 * L1 * L2 * s2 * (td1 + td2)
  const C21 =  m2 * L1 * L2 * s2 * td1
  const G1  = (m1 + m2) * g * L1 * Math.cos(t1) + m2 * g * L2 * Math.cos(t1 + t2)
  const G2  = m2 * g * L2 * Math.cos(t1 + t2)
  const tau1 = M11 * tdd1 + M12 * tdd2 + C11 * td1 + C12 * td2 + G1
  const tau2 = M12 * tdd1 + M22 * tdd2 + C21 * td1 + G2
  return { tau1, tau2 }
}

/* ============================================================
   FORWARD DYNAMICS — RK4
   θ̈ = M⁻¹(τ − C·θ̇ − G)
============================================================ */
function forwardDyn(m1, m2, L1, L2, g, t1, t2, td1, td2, tau1, tau2) {
  const c2 = Math.cos(t2), s2 = Math.sin(t2)
  const M11 = (m1 + m2) * L1 * L1 + m2 * L2 * L2 + 2 * m2 * L1 * L2 * c2
  const M12 = m2 * L2 * L2 + m2 * L1 * L2 * c2
  const M22 = m2 * L2 * L2
  const C1  = -m2 * L1 * L2 * s2 * td2 * td1 - m2 * L1 * L2 * s2 * (td1 + td2) * td2
  const C2  =  m2 * L1 * L2 * s2 * td1 * td1
  const G1  = (m1 + m2) * g * L1 * Math.cos(t1) + m2 * g * L2 * Math.cos(t1 + t2)
  const G2  = m2 * g * L2 * Math.cos(t1 + t2)
  const det = M11 * M22 - M12 * M12
  const r1  = tau1 - C1 - G1, r2 = tau2 - C2 - G2
  return {
    tdd1: ( M22 * r1 - M12 * r2) / det,
    tdd2: (-M12 * r1 + M11 * r2) / det,
  }
}

function rk4Robot(state, dt, m1, m2, L1, L2, g) {
  const f = ([t1, t2, td1, td2]) => {
    const { tdd1, tdd2 } = forwardDyn(m1, m2, L1, L2, g, t1, t2, td1, td2, 0, 0)
    return [td1, td2, tdd1, tdd2]
  }
  const k1 = f(state)
  const s2 = state.map((s, i) => s + k1[i] * dt / 2), k2 = f(s2)
  const s3 = state.map((s, i) => s + k2[i] * dt / 2), k3 = f(s3)
  const s4 = state.map((s, i) => s + k3[i] * dt),     k4 = f(s4)
  return state.map((s, i) => s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
}

export default function AltMulticuerpo() {
  const [activeTab, setActiveTab] = useState('sim')

  return (
    <div className="lab-page alt-lab">
      <div className="container">
        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #276749 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#c6f6d5', color: '#276749' }}>Dinamica</span>
          <h1>Sistemas Multicuerpo</h1>
          <p className="lab-subtitle">Robot 2R — Dinamica directa e inversa · Newton-Euler · Torques articulares</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Dinamica de Sistemas Multicuerpo</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            Los <strong>sistemas multicuerpo</strong> consisten en cuerpos rigidos interconectados.
            La <strong>dinamica inversa</strong> calcula las fuerzas/torques articulares necesarios
            para seguir una trayectoria dada. La <strong>dinamica directa</strong> integra las
            ecuaciones de movimiento para encontrar la respuesta dado un torque.
            Las ecuaciones usan la forma matricial <strong>M(θ)·θ̈ + C(θ,θ̇)·θ̇ + G(θ) = τ</strong>,
            donde M es la matriz de inercia, C los terminos de Coriolis/centrifuga y G la gravedad.
          </p>
        </div>

        <div className="tabs">
          {[['sim', 'Simulacion Libre'], ['inv', 'Dinamica Inversa'], ['eq', 'Ecuaciones']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'sim' && <FreeFall />}
        {activeTab === 'inv' && <InverseDyn />}
        {activeTab === 'eq'  && <EOMSection />}
      </div>
    </div>
  )
}

/* ---- TAB 1 — FREE FALL SIMULATION ---- */
function FreeFall() {
  const canvasRef = useRef(null)
  const stateRef  = useRef([Math.PI / 2, Math.PI / 4, 0, 0])
  const pRef      = useRef({})
  const animRef   = useRef(null)
  const lastRef   = useRef(null)
  const bufRef    = useRef([])
  const tRef      = useRef(0)

  const [m1, setM1] = useState(2); const [m2, setM2] = useState(1.5)
  const [L1, setL1] = useState(0.8); const [L2, setL2] = useState(0.6)
  const [playing, setPlaying] = useState(true)
  const [tData, setTData] = useState([])

  useEffect(() => { pRef.current = { m1, m2, L1, L2, playing } }, [m1, m2, L1, L2, playing])

  const reset = () => { stateRef.current = [Math.PI/2, Math.PI/4, 0, 0]; bufRef.current = []; tRef.current = 0; lastRef.current = null; setTData([]) }
  useEffect(() => { reset() }, [m1, m2, L1, L2]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const g = 9.81

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.04); lastRef.current = time
      const { m1, m2, L1, L2, playing } = pRef.current

      if (playing && dt > 0) {
        for (let i = 0; i < 8; i++) stateRef.current = rk4Robot(stateRef.current, dt/8, m1, m2, L1, L2, g)
        tRef.current += dt
        const [t1, t2, td1, td2] = stateRef.current
        bufRef.current.push({ t: +tRef.current.toFixed(3), t1: +(t1*180/Math.PI).toFixed(2), t2: +(t2*180/Math.PI).toFixed(2), td1: +td1.toFixed(3), td2: +td2.toFixed(3) })
        if (bufRef.current.length > 2000) bufRef.current.shift()
        if (bufRef.current.length % 6 === 0) setTData([...bufRef.current])
      }

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f0fff4'); bg.addColorStop(1, '#dcfce7')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const [t1, t2] = stateRef.current
      const ox = W/2, oy = H*0.35
      const scale = Math.min(W, H) / (2.8 * (L1 + L2))

      const j1x = ox + L1*scale*Math.cos(t1), j1y = oy - L1*scale*Math.sin(t1)
      const j2x = j1x + L2*scale*Math.cos(t1+t2), j2y = j1y - L2*scale*Math.sin(t1+t2)

      // Base
      ctx.fillStyle = '#142430'; ctx.fillRect(ox-18, oy, 36, 8)
      ctx.strokeStyle = '#142430'; ctx.lineWidth = 1
      for (let bx = ox-18; bx < ox+18; bx += 8) { ctx.beginPath(); ctx.moveTo(bx, oy+8); ctx.lineTo(bx+5, oy+16); ctx.stroke() }

      // Links
      ctx.strokeStyle = '#276749'; ctx.lineWidth = 7; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(j1x, j1y); ctx.stroke()
      ctx.strokeStyle = '#38a169'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j2x, j2y); ctx.stroke()

      // Mass circles
      ;[[j1x, j1y, m1, '#276749'], [j2x, j2y, m2, '#38a169']].forEach(([x, y, m, col]) => {
        ctx.fillStyle = col; ctx.shadowColor = col+'50'; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(x, y, 8 + m*4, 0, 2*Math.PI); ctx.fill()
        ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x, y, 8+m*4, 0, 2*Math.PI); ctx.stroke()
      })

      // Base joint
      ctx.fillStyle = '#142430'; ctx.beginPath(); ctx.arc(ox, oy, 7, 0, 2*Math.PI); ctx.fill()

      ctx.font = '12px Inter'; ctx.fillStyle = '#276749'
      ctx.fillText(`θ₁=${(t1*180/Math.PI).toFixed(1)}°  θ₂=${(t2*180/Math.PI).toFixed(1)}°`, 10, 22)

      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Dinamica Libre (Caida bajo Gravedad)</h2>
      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        {[['m₁ (kg)', m1, setM1, 0.5, 5, 0.1], ['m₂ (kg)', m2, setM2, 0.5, 5, 0.1], ['L₁ (m)', L1, setL1, 0.2, 1.5, 0.05], ['L₂ (m)', L2, setL2, 0.2, 1.2, 0.05]].map(([l, v, s, mn, mx, step]) => (
          <div className="slider-group" key={l}><label>{l}: {v.toFixed(2)}</label><input type="range" min={mn} max={mx} step={step} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div>
        <button className="btn btn-outline" style={{ marginTop: 8, marginRight: 8 }} onClick={() => setPlaying(p => !p)}>{playing ? 'Pausar' : 'Reanudar'}</button>
        <button className="btn btn-primary"  style={{ marginTop: 8 }} onClick={reset}>Reiniciar</button>
      </div>
      <div className="viz-container">
        <div className="viz-panel">
          <h3>Animacion Robot 2R</h3>
          <canvas ref={canvasRef} width={380} height={360} style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>
        <div className="viz-panel">
          <h3>Angulos vs Tiempo</h3>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={tData.slice(-500)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="t1" stroke="#276749" name="θ₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="t2" stroke="#38a169" name="θ₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ---- TAB 2 — INVERSE DYNAMICS ---- */
function InverseDyn() {
  const [m1, setM1] = useState(2); const [m2, setM2] = useState(1.5)
  const [L1, setL1] = useState(0.8); const [L2, setL2] = useState(0.6)
  const [A1, setA1] = useState(30); const [A2, setA2] = useState(20)   // amplitude deg
  const [f1, setF1] = useState(0.5); const [f2, setF2] = useState(0.8) // frequency Hz

  const torqueData = useMemo(() => {
    const g = 9.81, dt = 0.01, T = 4
    const pts = []
    for (let t = 0; t <= T; t += dt) {
      const w1 = 2*Math.PI*f1, w2 = 2*Math.PI*f2
      const t1  = A1*Math.PI/180 * Math.sin(w1*t)
      const t2  = A2*Math.PI/180 * Math.sin(w2*t)
      const td1 = A1*Math.PI/180 * w1 * Math.cos(w1*t)
      const td2 = A2*Math.PI/180 * w2 * Math.cos(w2*t)
      const tdd1 = -A1*Math.PI/180 * w1*w1 * Math.sin(w1*t)
      const tdd2 = -A2*Math.PI/180 * w2*w2 * Math.sin(w2*t)
      const { tau1, tau2 } = inverseDynamics2R(m1, m2, L1, L2, g, t1, t2, td1, td2, tdd1, tdd2)
      pts.push({ t: +t.toFixed(3), tau1: +tau1.toFixed(3), tau2: +tau2.toFixed(3), t1: +(t1*180/Math.PI).toFixed(2), t2: +(t2*180/Math.PI).toFixed(2) })
    }
    return pts
  }, [m1, m2, L1, L2, A1, A2, f1, f2])

  return (
    <div>
      <h2 className="section-title">Dinamica Inversa — Torques Articulares Requeridos</h2>
      <div className="controls-panel"><h3>Parametros y Trayectoria Sinusoidal</h3><div className="controls-row">
        {[
          ['m₁ (kg)', m1, setM1, 0.5, 5, 0.1], ['m₂ (kg)', m2, setM2, 0.5, 5, 0.1],
          ['L₁ (m)', L1, setL1, 0.2, 1.5, 0.05], ['L₂ (m)', L2, setL2, 0.2, 1.2, 0.05],
          ['A₁ (°)', A1, setA1, 5, 60, 1], ['A₂ (°)', A2, setA2, 5, 60, 1],
          ['f₁ (Hz)', f1, setF1, 0.1, 3, 0.1], ['f₂ (Hz)', f2, setF2, 0.1, 3, 0.1],
        ].map(([l, v, s, mn, mx, step]) => (
          <div className="slider-group" key={l}><label>{l}: {v.toFixed(step < 0.1 ? 2 : 1)}</label><input type="range" min={mn} max={mx} step={step} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div></div>
      <div className="grid-2">
        <div className="profile-chart">
          <h4>Torques articulares τ₁, τ₂ (N·m)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={torqueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'τ (N·m)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="tau1" stroke="#276749" name="τ₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="tau2" stroke="#38a169" name="τ₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="profile-chart">
          <h4>Trayectoria angular θ₁, θ₂ (°)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={torqueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="t1" stroke="#2b6cb0" name="θ₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="t2" stroke="#ed8936" name="θ₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ---- TAB 3 — EQUATIONS ---- */
function EOMSection() {
  return (
    <div>
      <h2 className="section-title">Ecuaciones de Movimiento — Forma Matricial</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Ecuacion General</h3>
        <div className="equation">M(θ)·θ̈ + C(θ,θ̇)·θ̇ + G(θ) = τ</div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Componentes para Robot 2R</h3>
        <table>
          <thead><tr><th>Componente</th><th>Expresion</th><th>Descripcion</th></tr></thead>
          <tbody>
            <tr><td>M₁₁</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>(m₁+m₂)L₁² + m₂L₂² + 2m₂L₁L₂c₂</td><td>Inercia efectiva articulacion 1</td></tr>
            <tr><td>M₁₂=M₂₁</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>m₂L₂² + m₂L₁L₂c₂</td><td>Acoplamiento inercial</td></tr>
            <tr><td>M₂₂</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>m₂L₂²</td><td>Inercia efectiva articulacion 2</td></tr>
            <tr><td>C₁₁</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>−m₂L₁L₂s₂·θ̇₂</td><td>Termino Coriolis</td></tr>
            <tr><td>G₁</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>(m₁+m₂)gL₁c₁ + m₂gL₂c₁₂</td><td>Par gravitacional art. 1</td></tr>
            <tr><td>G₂</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>m₂gL₂cos(θ₁+θ₂)</td><td>Par gravitacional art. 2</td></tr>
          </tbody>
        </table>
      </div>
      <div className="editable-section">
        <h3>Newton-Euler Recursivo (algoritmo)</h3>
        <p style={{ fontSize: 13 }}><strong>Paso adelante</strong> (base → EE): calcula velocidades y aceleraciones de cada cuerpo.</p>
        <p style={{ fontSize: 13 }}><strong>Paso atras</strong> (EE → base): calcula fuerzas/momentos en cada articulacion usando Newton-Euler.</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Es el algoritmo O(n) mas eficiente para cadenas cinematicas abiertas con n GDL.</p>
      </div>
    </div>
  )
}
