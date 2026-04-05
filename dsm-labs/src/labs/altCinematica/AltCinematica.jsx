import { useState, useRef, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter,
} from 'recharts'

/* ============================================================
   4-BAR MECHANISM SOLVER
   O2 at (0,0), O4 at (d,0)
   Links: crank=a, coupler=b, follower=c, ground=d
============================================================ */
function solve4Bar(a, b, c, d, t2, open = true) {
  const Ax = a * Math.cos(t2), Ay = a * Math.sin(t2)
  const Px = Ax - d, Py = Ay
  const R = Math.hypot(Px, Py)
  if (R < 1e-10) return null
  const K = (Px * Px + Py * Py + c * c - b * b) / (2 * c)
  if (Math.abs(K / R) > 1.0001) return null
  const phi = Math.atan2(Py, Px)
  const alpha = Math.acos(Math.max(-1, Math.min(1, K / R)))
  const t4 = open ? phi + alpha : phi - alpha
  const Bx = d + c * Math.cos(t4), By = c * Math.sin(t4)
  const t3 = Math.atan2(By - Ay, Bx - Ax)
  return { Ax, Ay, Bx, By, t3, t4 }
}

function velAnalysis(a, b, c, t2, t3, t4, w2) {
  const det =
    b * Math.cos(t3) * (-c * Math.sin(t4)) -
    -c * Math.cos(t4) * b * Math.sin(t3)
  if (Math.abs(det) < 1e-10) return { w3: 0, w4: 0 }
  const f1 = a * w2 * Math.sin(t2)
  const f2 = -a * w2 * Math.cos(t2)
  return {
    w3: (f1 * (-c * Math.sin(t4)) - f2 * (-c * Math.cos(t4))) / det,
    w4: (b * Math.cos(t3) * f2 - b * Math.sin(t3) * f1) / det,
  }
}

function grashof(a, b, c, d) {
  const links = [a, b, c, d].sort((x, y) => x - y)
  const [S, P, Q, L] = links
  if (L + S <= P + Q) {
    if (S === a) return 'Manivela-Manivela (Grashof)'
    if (S === d) return 'Manivela-Balancin (Grashof)'
    return 'Doble Balancin (Grashof)'
  }
  return 'No Grashof — Doble Balancin'
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AltCinematica() {
  const [activeTab, setActiveTab] = useState('mechanism')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header">
          <span className="alt-lab-topic-tag">Cinematica</span>
          <h1>Analisis Cinematico de Mecanismos</h1>
          <p className="lab-subtitle">
            Mecanismo de 4 barras — posicion, velocidades, curva del acoplador
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Fundamentos</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>mecanismo de 4 barras</strong> es el eslabon mas simple que convierte
            rotacion en movimiento complejo. Consta de: <strong>manivela</strong> (a),
            <strong> acoplador</strong> (b), <strong>seguidor</strong> (c) y
            <strong> eslabon fijo</strong> (d). La <em>ecuacion de Freudenstein</em> relaciona
            los angulos de entrada y salida de forma algebraica, evitando la solucion
            geometrica iterativa.
          </p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {[['GDL', '1'], ['Eslabones', '4'], ['Pares Cin.', '4R']].map(([l, v]) => (
              <div className="alt-stat-box" key={l}>
                <span className="alt-stat-label">{l}</span>
                <span className="alt-stat-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[
            ['mechanism', 'Simulacion'],
            ['coupler', 'Curva del Acoplador'],
            ['velocity', 'Velocidades'],
          ].map(([key, label]) => (
            <div key={key} className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </div>
          ))}
        </div>

        {activeTab === 'mechanism' && <MechanismSim />}
        {activeTab === 'coupler' && <CouplerCurve />}
        {activeTab === 'velocity' && <VelocityTab />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — CANVAS SIMULATION
============================================================ */
function MechanismSim() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const thetaRef = useRef(0)
  const lastRef = useRef(null)
  const pRef = useRef({})

  const [a, setA] = useState(60)
  const [b, setB] = useState(130)
  const [c, setC] = useState(100)
  const [d, setD] = useState(150)
  const [speed, setSpeed] = useState(1.5)
  const [playing, setPlaying] = useState(true)
  const [snap, setSnap] = useState(null)

  useEffect(() => { pRef.current = { a, b, c, d, speed, playing } }, [a, b, c, d, speed, playing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.05)
      lastRef.current = time
      const { a, b, c, d, speed, playing } = pRef.current

      if (playing) thetaRef.current += speed * dt

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f8fafc')
      bg.addColorStop(1, '#eef2f7')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const scale = Math.min(W, H) / (2.8 * Math.max(a + b, c + d))
      const ox = W * 0.28, oy = H * 0.58
      const tx = x => ox + x * scale
      const ty = y => oy - y * scale

      const O2x = tx(0), O2y = ty(0)
      const O4x = tx(d), O4y = ty(0)
      const t2 = thetaRef.current
      const sol = solve4Bar(a, b, c, d, t2)

      // Ground
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(O2x - 20, O2y); ctx.lineTo(O4x + 20, O4y); ctx.stroke()
      ctx.setLineDash([])
      for (let px = O2x - 20; px < O4x + 30; px += 14) {
        ctx.beginPath(); ctx.moveTo(px, O2y); ctx.lineTo(px - 8, O2y + 14); ctx.stroke()
      }

      function link(x1, y1, x2, y2, color, w = 4) {
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      }
      function joint(x, y, r, fill, stroke) {
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
      }

      if (!sol) {
        link(O2x, O2y, tx(a * Math.cos(t2)), ty(a * Math.sin(t2)), '#e53e3e', 4)
        joint(O2x, O2y, 7, '#fff', '#142430')
        ctx.font = '13px Inter'; ctx.fillStyle = '#e53e3e'
        ctx.fillText('Configuracion no valida', 10, 24)
        animRef.current = requestAnimationFrame(frame); return
      }

      const Ax = tx(sol.Ax), Ay = ty(sol.Ay)
      const Bx = tx(sol.Bx), By = ty(sol.By)

      link(O2x, O2y, Ax, Ay, '#2b6cb0', 5)
      link(Ax, Ay, Bx, By, '#ed8936', 5)
      link(O4x, O4y, Bx, By, '#38a169', 5)

      joint(O2x, O2y, 8, '#fff', '#142430')
      joint(O4x, O4y, 8, '#fff', '#142430')
      joint(Ax, Ay, 6, '#2b6cb0', '#1a365d')
      joint(Bx, By, 6, '#38a169', '#276749')

      // Coupler midpoint
      ctx.fillStyle = '#ed8936'
      ctx.beginPath(); ctx.arc((Ax + Bx) / 2, (Ay + By) / 2, 4, 0, 2 * Math.PI); ctx.fill()

      // Labels
      ctx.font = 'bold 12px Inter'; ctx.fillStyle = '#142430'
      ctx.fillText('O₂', O2x - 18, O2y + 18)
      ctx.fillText('O₄', O4x + 6, O4y + 18)
      ctx.fillStyle = '#2b6cb0'; ctx.fillText('A', Ax + 8, Ay - 4)
      ctx.fillStyle = '#38a169'; ctx.fillText('B', Bx + 8, By - 4)

      // Angle arc
      ctx.strokeStyle = '#ed8936'; ctx.lineWidth = 2
      const ang = ((t2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      ctx.beginPath(); ctx.arc(O2x, O2y, 22, 0, ang > Math.PI ? ang - 2 * Math.PI : ang); ctx.stroke()

      setSnap({
        t2: (ang * 180 / Math.PI).toFixed(1),
        t3: (sol.t3 * 180 / Math.PI).toFixed(1),
        t4: (sol.t4 * 180 / Math.PI).toFixed(1),
        Ax: sol.Ax.toFixed(1), Ay: sol.Ay.toFixed(1),
        Bx: sol.Bx.toFixed(1), By: sol.By.toFixed(1),
      })

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  const tipo = grashof(a, b, c, d)
  const isGrashof = !tipo.startsWith('No')

  return (
    <div>
      <h2 className="section-title">Simulacion del Mecanismo</h2>

      <div className="controls-panel">
        <h3>Longitudes de Eslabones</h3>
        <div className="controls-row">
          {[
            ['Manivela a', a, setA, 20, 120, 1],
            ['Acoplador b', b, setB, 60, 200, 1],
            ['Seguidor c', c, setC, 50, 170, 1],
            ['Fijo d', d, setD, 80, 210, 1],
            ['Velocidad ω₂ (rad/s)', speed, setSpeed, 0.2, 6, 0.1],
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
          <h3>Mecanismo 4 Barras</h3>
          <div style={{ textAlign: 'center' }}>
            <canvas ref={canvasRef} width={460} height={320}
              style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
            {[['#2b6cb0', 'Manivela a'], ['#ed8936', 'Acoplador b'], ['#38a169', 'Seguidor c']].map(([col, lbl]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 4, background: col, borderRadius: 2 }} />
                <span style={{ fontSize: 12 }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="viz-panel">
          <h3>Estado Actual</h3>
          <div className="alt-stat-grid">
            {snap && [
              ['θ₂ (manivela)', `${snap.t2}°`],
              ['θ₃ (acoplador)', `${snap.t3}°`],
              ['θ₄ (seguidor)', `${snap.t4}°`],
              ['A', `(${snap.Ax}, ${snap.Ay})`],
              ['B', `(${snap.Bx}, ${snap.By})`],
            ].map(([lbl, val]) => (
              <div className="alt-stat-row" key={lbl}>
                <span>{lbl}</span>
                <span className="alt-val">{val}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>Condicion de Grashof</h4>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: isGrashof ? '#f0fff4' : '#fff5f5',
              border: `1px solid ${isGrashof ? '#c6f6d5' : '#fed7d7'}`,
              fontSize: 13, fontWeight: 600,
              color: isGrashof ? '#276749' : '#c53030',
            }}>
              {tipo}
            </div>
          </div>

          <div className="editable-section" style={{ marginTop: 16 }}>
            <h4>Freudenstein</h4>
            <p style={{ fontSize: 12 }}>R₁·cos(θ₄) − R₂·cos(θ₂) + R₃ = cos(θ₂ − θ₄)</p>
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
              R₁ = d/c · R₂ = d/a · R₃ = (a²−b²+c²+d²)/(2ac)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — COUPLER CURVE
============================================================ */
function CouplerCurve() {
  const [a, setA] = useState(60)
  const [b, setB] = useState(130)
  const [c, setC] = useState(100)
  const [d, setD] = useState(150)
  const [p, setP] = useState(90)
  const [delta, setDelta] = useState(0.5)

  const { curveData, posData } = useMemo(() => {
    const curveData = [], posData = []
    for (let i = 0; i <= 360; i += 2) {
      const t2 = i * Math.PI / 180
      const sol = solve4Bar(a, b, c, d, t2)
      if (!sol) continue
      const Px = sol.Ax + p * Math.cos(sol.t3 + delta)
      const Py = sol.Ay + p * Math.sin(sol.t3 + delta)
      curveData.push({ x: +Px.toFixed(2), y: +Py.toFixed(2) })
      posData.push({
        deg: i,
        t3: +(sol.t3 * 180 / Math.PI).toFixed(2),
        t4: +(sol.t4 * 180 / Math.PI).toFixed(2),
      })
    }
    return { curveData, posData }
  }, [a, b, c, d, p, delta])

  return (
    <div>
      <h2 className="section-title">Curva del Punto Acoplador</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['a', a, setA, 20, 120, 1],
            ['b', b, setB, 60, 200, 1],
            ['c', c, setC, 50, 170, 1],
            ['d', d, setD, 80, 210, 1],
            ['p (dist. punto P)', p, setP, 10, 200, 1],
            ['δ (rad)', delta, setDelta, 0, 6.28, 0.05],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(2) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Curva del Acoplador P(x,y)</h4>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name="X" label={{ value: 'X (mm)', position: 'bottom' }} domain={['auto', 'auto']} />
              <YAxis dataKey="y" type="number" name="Y" label={{ value: 'Y (mm)', angle: -90, position: 'left' }} domain={['auto', 'auto']} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={curveData} fill="#ed8936" line={{ stroke: '#ed8936', strokeWidth: 2 }} lineType="fitting" name="P(θ₂)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>θ₃, θ₄ vs θ₂</h4>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={posData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="deg" label={{ value: 'θ₂ (°)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="t3" stroke="#ed8936" name="θ₃ acoplador" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="t4" stroke="#38a169" name="θ₄ seguidor" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — VELOCITY ANALYSIS
============================================================ */
function VelocityTab() {
  const [a, setA] = useState(60)
  const [b, setB] = useState(130)
  const [c, setC] = useState(100)
  const [d, setD] = useState(150)
  const [w2, setW2] = useState(10)

  const velData = useMemo(() => {
    const data = []
    for (let i = 0; i <= 360; i += 2) {
      const t2 = i * Math.PI / 180
      const sol = solve4Bar(a, b, c, d, t2)
      if (!sol) continue
      const { w3, w4 } = velAnalysis(a, b, c, t2, sol.t3, sol.t4, w2)
      data.push({ deg: i, w3: +w3.toFixed(3), w4: +w4.toFixed(3), ratio: +(w4 / w2).toFixed(4) })
    }
    return data
  }, [a, b, c, d, w2])

  return (
    <div>
      <h2 className="section-title">Analisis de Velocidades Angulares</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['a', a, setA, 20, 120, 1], ['b', b, setB, 60, 200, 1],
            ['c', c, setC, 50, 170, 1], ['d', d, setD, 80, 210, 1],
            ['ω₂ (rad/s)', w2, setW2, 1, 40, 1],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>ω₃, ω₄ vs θ₂ (rad/s)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={velData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="deg" label={{ value: 'θ₂ (°)', position: 'bottom' }} />
              <YAxis label={{ value: 'ω (rad/s)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="w3" stroke="#ed8936" name="ω₃" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="w4" stroke="#38a169" name="ω₄" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Relacion ω₄/ω₂ vs θ₂</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={velData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="deg" label={{ value: 'θ₂ (°)', position: 'bottom' }} />
              <YAxis label={{ value: 'ω₄/ω₂', angle: -90, position: 'left' }} />
              <Tooltip />
              <Line type="monotone" dataKey="ratio" stroke="#6b46c1" name="ω₄/ω₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Ecuaciones de Velocidad — Cierre de Lazo</h3>
        <div className="equation">
          a·ω₂·e^(jθ₂)·j + b·ω₃·e^(jθ₃)·j − c·ω₄·e^(jθ₄)·j = 0
        </div>
        <p style={{ marginTop: 8, fontSize: 13 }}>
          <strong>Sistema lineal 2×2:</strong> separando parte real e imaginaria,
          se resuelve para ω₃ y ω₄ dado ω₂ y la configuracion actual.
        </p>
      </div>
    </div>
  )
}
