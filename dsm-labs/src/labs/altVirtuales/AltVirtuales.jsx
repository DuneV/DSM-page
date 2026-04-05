import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

/* ============================================================
   PHYSICS HELPERS
============================================================ */

// Lever virtual work: equilibrium force on right arm
// δW = -m·g·a·δθ + F·b·δθ = 0  →  F = m·g·a / b
function leverForce(m, g, a, L) {
  const b = L - a
  if (b <= 0) return Infinity
  return (m * g * a) / b
}

// Slider-crank velocity ratio: dxB/dθ
// xB(θ) = a·cos(θ) + √(b²-a²sin²(θ))
// dxB/dθ = -a·sin(θ) - a²sin(θ)cos(θ)/√(b²-a²sin²(θ))
function sliderVR(a, b, theta) {
  const s2 = Math.sin(theta)
  const c = Math.cos(theta)
  const det = b * b - a * a * s2 * s2
  if (det <= 0) return 0
  return -a * s2 - (a * a * s2 * c) / Math.sqrt(det)
}

function sliderPos(a, b, theta) {
  const s = Math.sin(theta)
  const det = b * b - a * a * s * s
  if (det < 0) return a * Math.cos(theta)
  return a * Math.cos(theta) + Math.sqrt(det)
}

// Build torque-vs-angle data for slider-crank
function buildTorqueData(a, b, F) {
  const data = []
  for (let i = 0; i <= 360; i += 2) {
    const theta = (i * Math.PI) / 180
    const vr = sliderVR(a, b, theta)
    // Virtual work: τ·δθ + F·δxB = 0  → τ = -F·(dxB/dθ)
    const tau = -F * vr
    data.push({ theta: i, tau: +tau.toFixed(4) })
  }
  return data
}

// 4-bar mechanism virtual work:
// Given crank torque T1 and output moment arm, find equilibrium load torque
// Using loop-closure: θ3, θ4 as functions of θ2
// Virtual work: T1·δθ2 + T4·δθ4 = 0  → T4 = -T1·(dθ2/dθ4)
function solve4BarAngles(a, b, c, d, theta2) {
  // Freudenstein equation
  const K1 = d / a, K2 = d / c, K3 = (a * a - b * b + c * c + d * d) / (2 * a * c)
  const K4 = d / b, K5 = (c * c - d * d - a * a - b * b) / (2 * a * b)
  const cos2 = Math.cos(theta2), sin2 = Math.sin(theta2)
  const A4 = cos2 - K1 - K2 * cos2 + K3
  const B4 = -2 * sin2
  const C4 = K1 - (K2 + 1) * cos2 + K3
  const disc4 = B4 * B4 - 4 * A4 * C4
  if (disc4 < 0) return null
  const theta4 = 2 * Math.atan2(-B4 - Math.sqrt(disc4), 2 * A4)
  const A3 = cos2 - K1 + K4 * cos2 + K5
  const B3 = -2 * sin2
  const C3 = K1 + (K4 - 1) * cos2 + K5
  const disc3 = B3 * B3 - 4 * A3 * C3
  if (disc3 < 0) return null
  const theta3 = 2 * Math.atan2(-B3 - Math.sqrt(disc3), 2 * A3)
  return { theta3, theta4 }
}

/* ============================================================
   TAB 1: LEVER CANVAS
============================================================ */
function LeverTab() {
  const canvasRef = useRef(null)
  const [pivotPct, setPivotPct] = useState(40)   // % from left (0-100)
  const [mass, setMass]         = useState(10)    // kg
  const [L]                     = useState(4)     // m (total lever length)
  const [g]                     = useState(9.81)

  const a    = (pivotPct / 100) * L  // left arm
  const b    = L - a                  // right arm
  const Feq  = leverForce(mass, g, a, L)

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const ox = W * 0.1, oy = H * 0.55
    const scale = W * 0.8 / L
    const pivotX = ox + a * scale

    // ── Ground ──
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(ox - 20, oy + 20); ctx.lineTo(ox + L * scale + 20, oy + 20); ctx.stroke()

    // ── Lever bar ──
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + L * scale, oy); ctx.stroke()

    // ── Pivot triangle ──
    ctx.fillStyle = '#ee826d'
    ctx.beginPath()
    ctx.moveTo(pivotX, oy)
    ctx.lineTo(pivotX - 14, oy + 20)
    ctx.lineTo(pivotX + 14, oy + 20)
    ctx.closePath(); ctx.fill()

    // ── Mass (left) ──
    const massX = ox
    const massR = Math.max(12, Math.min(32, mass * 2))
    ctx.fillStyle = '#2b6cb0'
    ctx.beginPath(); ctx.arc(massX, oy - massR, massR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${mass}kg`, massX, oy - massR + 4)

    // Weight arrow (down)
    ctx.strokeStyle = '#f6ad55'; ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(massX, oy - massR * 2)
    ctx.lineTo(massX, oy + 40)
    ctx.stroke()
    // arrowhead
    ctx.fillStyle = '#f6ad55'
    ctx.beginPath()
    ctx.moveTo(massX - 6, oy + 28); ctx.lineTo(massX + 6, oy + 28); ctx.lineTo(massX, oy + 42)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#f6ad55'; ctx.font = '12px sans-serif'
    ctx.fillText(`W=${(mass*g).toFixed(1)}N`, massX + 30, oy + 38)

    // ── Equilibrium force (right, upward) ──
    const forceX = ox + L * scale
    const fScale = Math.min(80, (Feq / (mass * g)) * 60)
    ctx.strokeStyle = '#48bb78'; ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(forceX, oy + 20)
    ctx.lineTo(forceX, oy + 20 - fScale)
    ctx.stroke()
    ctx.fillStyle = '#48bb78'
    ctx.beginPath()
    ctx.moveTo(forceX - 6, oy + 20 - fScale + 12)
    ctx.lineTo(forceX + 6, oy + 20 - fScale + 12)
    ctx.lineTo(forceX, oy + 20 - fScale)
    ctx.closePath(); ctx.fill()
    ctx.font = '12px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(`F=${Feq.toFixed(1)}N`, forceX + 8, oy + 20 - fScale / 2)

    // ── Labels: arm lengths ──
    ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`a = ${a.toFixed(2)} m`, ox + a * scale / 2, oy - 28)
    ctx.fillText(`b = ${b.toFixed(2)} m`, pivotX + b * scale / 2, oy - 28)

    // ── Virtual displacement arc ──
    const deltaTheta = 0.18
    ctx.strokeStyle = '#cbd5e0'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.arc(pivotX, oy, a * scale, Math.PI - deltaTheta, Math.PI + deltaTheta)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#cbd5e0'; ctx.font = 'italic 11px sans-serif'
    ctx.fillText('δθ', pivotX - a * scale + 10, oy - 14)

  }, [a, b, mass, g, Feq, L])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div className="alt-stat-row" style={{ gap: 24, marginBottom: 16 }}>
        <div className="alt-stat-box">
          <span className="alt-val">{a.toFixed(2)} m</span>
          <span>Brazo izquierdo (a)</span>
        </div>
        <div className="alt-stat-box">
          <span className="alt-val">{b.toFixed(2)} m</span>
          <span>Brazo derecho (b)</span>
        </div>
        <div className="alt-stat-box" style={{ '--c': '#48bb78' }}>
          <span className="alt-val" style={{ color: '#48bb78' }}>{Feq.toFixed(2)} N</span>
          <span>Fuerza de equilibrio</span>
        </div>
        <div className="alt-stat-box">
          <span className="alt-val">{(mass * g).toFixed(1)} N</span>
          <span>Peso aplicado</span>
        </div>
      </div>

      <div style={{ background: '#0e1c26', borderRadius: 12, padding: 8, marginBottom: 20 }}>
        <canvas ref={canvasRef} width={720} height={280} style={{ width: '100%', height: 'auto' }} />
      </div>

      <div className="alt-controls">
        <label>
          Posicion pivote (% desde izquierda): <strong>{pivotPct}%</strong>
          <input type="range" min="10" max="90" value={pivotPct}
            onChange={e => setPivotPct(+e.target.value)} />
        </label>
        <label>
          Masa (kg): <strong>{mass} kg</strong>
          <input type="range" min="1" max="50" value={mass}
            onChange={e => setMass(+e.target.value)} />
        </label>
      </div>

      <div style={{ background: '#0e1c26', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.8 }}>
          <strong style={{ color: '#fff4d9' }}>Principio de Trabajos Virtuales:</strong><br />
          Para una palanca en equilibrio, la suma de trabajos virtuales es cero:<br />
          <code style={{ color: '#ee826d' }}>δW = −m·g·a·δθ + F·b·δθ = 0</code><br />
          Por tanto: <code style={{ color: '#48bb78' }}>F = m·g·a / b = {Feq.toFixed(2)} N</code>
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2: SLIDER-CRANK VIRTUAL WORK
============================================================ */
function SliderTab() {
  const [crank,  setCrank]  = useState(0.8)   // m
  const [conn,   setConn]   = useState(2.0)   // m
  const [force,  setForce]  = useState(500)   // N on slider

  const data = buildTorqueData(crank, conn, force)
  const tauMax = Math.max(...data.map(d => Math.abs(d.tau)))

  const currentIdx = 90  // show example at 90°
  const vrAt90 = sliderVR(crank, conn, Math.PI / 2)
  const tauAt90 = -force * vrAt90

  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
        Para una manivela-corredera, el par requerido para equilibrar una fuerza F en el piston
        se obtiene del principio de trabajos virtuales:
        <code style={{ color: '#ee826d', marginLeft: 6 }}>τ·δθ + F·δxB = 0 → τ = −F·(dxB/dθ)</code>
      </p>

      <div className="alt-stat-row" style={{ marginBottom: 16 }}>
        <div className="alt-stat-box">
          <span className="alt-val">{crank} m</span>
          <span>Longitud manivela (a)</span>
        </div>
        <div className="alt-stat-box">
          <span className="alt-val">{conn} m</span>
          <span>Longitud biela (b)</span>
        </div>
        <div className="alt-stat-box" style={{ '--c': '#ee826d' }}>
          <span className="alt-val" style={{ color: '#ee826d' }}>{force} N</span>
          <span>Fuerza en piston</span>
        </div>
        <div className="alt-stat-box" style={{ '--c': '#48bb78' }}>
          <span className="alt-val" style={{ color: '#48bb78' }}>{tauAt90.toFixed(1)} N·m</span>
          <span>Par @ θ=90°</span>
        </div>
      </div>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
            <XAxis dataKey="theta" tickFormatter={v => `${v}°`}
              label={{ value: 'θ (°)', position: 'insideBottom', offset: -4, fill: '#94a3b8', fontSize: 12 }}
              stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'τ (N·m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#142430', border: '1px solid #1e3a4a', color: '#fff4d9' }}
              formatter={(v) => [`${(+v).toFixed(2)} N·m`, 'Par τ']}
              labelFormatter={v => `θ = ${v}°`} />
            <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="tau" stroke="#ee826d" dot={false} strokeWidth={2} name="τ(θ)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="alt-controls" style={{ marginTop: 16 }}>
        <label>
          Manivela a (m): <strong>{crank} m</strong>
          <input type="range" min="0.3" max="1.5" step="0.1" value={crank}
            onChange={e => setCrank(+e.target.value)} />
        </label>
        <label>
          Biela b (m): <strong>{conn} m</strong>
          <input type="range" min={crank * 1.1} max="4" step="0.1" value={conn}
            onChange={e => setConn(+e.target.value)} />
        </label>
        <label>
          Fuerza en piston (N): <strong>{force} N</strong>
          <input type="range" min="100" max="2000" step="50" value={force}
            onChange={e => setForce(+e.target.value)} />
        </label>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3: EQUATIONS
============================================================ */
function EcuacionesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#0e1c26', borderRadius: 10, padding: '16px 20px' }}>
        <h3 style={{ color: '#fff4d9', marginBottom: 10, fontSize: 16 }}>Principio de Trabajos Virtuales</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>
          Un sistema en equilibrio satisface que la suma de trabajos virtuales de todas las fuerzas
          activas es cero para cualquier desplazamiento virtual compatible con las ligaduras:
        </p>
        <div style={{ background: '#142430', borderRadius: 8, padding: '10px 14px', margin: '10px 0' }}>
          <code style={{ color: '#ee826d', fontSize: 15 }}>
            δW = Σᵢ Fᵢ · δrᵢ = 0
          </code>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8 }}>
          Para sistemas con ligaduras, los desplazamientos virtuales deben ser compatibles con ellas.
          Las fuerzas de ligadura <em>no hacen trabajo virtual</em>.
        </p>
      </div>

      <div style={{ background: '#0e1c26', borderRadius: 10, padding: '16px 20px' }}>
        <h3 style={{ color: '#fff4d9', marginBottom: 10, fontSize: 16 }}>Coordenadas Generalizadas</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>
          Si el sistema tiene <em>n</em> grados de libertad con coordenadas generalizadas q₁, …, qₙ:
        </p>
        <div style={{ background: '#142430', borderRadius: 8, padding: '10px 14px', margin: '10px 0' }}>
          <code style={{ color: '#ee826d', fontSize: 14, display: 'block', marginBottom: 6 }}>
            δW = Σⱼ Qⱼ · δqⱼ = 0
          </code>
          <code style={{ color: '#94a3b8', fontSize: 13 }}>
            Qⱼ = Σᵢ Fᵢ · (∂rᵢ/∂qⱼ) → fuerza generalizada
          </code>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8 }}>
          Para equilibrio estático: <code style={{ color: '#48bb78' }}>Qⱼ = 0 ∀ j</code>.
          Esto equivale a las ecuaciones de Lagrange sin inercia.
        </p>
      </div>

      <div style={{ background: '#0e1c26', borderRadius: 10, padding: '16px 20px' }}>
        <h3 style={{ color: '#fff4d9', marginBottom: 10, fontSize: 16 }}>Palanca — Ejemplo</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#142430' }}>
              {['Variable','Simbolo','Descripcion'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: '#fff4d9', textAlign: 'left', borderBottom: '1px solid #1e3a4a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Despl. virtual', 'δθ', 'Rotacion virtual del sistema'],
              ['Trabajo del peso', '-m·g·a·δθ', 'Peso × brazo izq. (baja cuando δθ > 0)'],
              ['Trabajo de F', 'F·b·δθ', 'Fuerza aplicada × brazo der.'],
              ['Equilibrio', 'F = m·g·a/b', 'De δW = 0'],
            ].map(([v, s, d]) => (
              <tr key={v} style={{ borderBottom: '1px solid #0e1c26' }}>
                <td style={{ padding: '7px 12px', color: '#cbd5e0' }}>{v}</td>
                <td style={{ padding: '7px 12px', color: '#ee826d', fontFamily: 'monospace' }}>{s}</td>
                <td style={{ padding: '7px 12px', color: '#94a3b8' }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#0e1c26', borderRadius: 10, padding: '16px 20px' }}>
        <h3 style={{ color: '#fff4d9', marginBottom: 10, fontSize: 16 }}>Manivela-Corredera — Razon de Velocidades</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>
          Posicion del piston: <code style={{ color: '#ee826d' }}>xB = a·cosθ + √(b²−a²sin²θ)</code>
        </p>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>
          Razon de velocidades (derivada respecto a θ):
        </p>
        <div style={{ background: '#142430', borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}>
          <code style={{ color: '#ee826d', fontSize: 14 }}>
            dxB/dθ = −a·sinθ − a²·sinθ·cosθ / √(b²−a²sin²θ)
          </code>
        </div>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8 }}>
          Par de equilibrio:
          <code style={{ color: '#48bb78', marginLeft: 6 }}>τ = −F · (dxB/dθ)</code>
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AltVirtuales() {
  const [tab, setTab] = useState(0)
  const tabs = ['Palanca Virtual', 'Manivela-Corredera', 'Ecuaciones']

  return (
    <div className="alt-lab-page">
      <div className="alt-lab-header" style={{ '--grad-a': '#975a16', '--grad-b': '#744210' }}>
        <div className="alt-lab-topic-tag">Energias</div>
        <h1>Trabajos Virtuales</h1>
        <p>
          Principio de D'Alembert generalizado. Fuerzas generalizadas, coordenadas independientes
          y equilibrio de sistemas con ligaduras mediante desplazamientos virtuales.
        </p>
        <div className="alt-lab-meta">
          <span>2 GDL</span><span>Estatica</span><span>Ligaduras</span>
        </div>
      </div>

      <div className="alt-lab-body">
        <div className="alt-tabs">
          {tabs.map((t, i) => (
            <button key={t} className={`alt-tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        <div className="alt-tab-content">
          {tab === 0 && <LeverTab />}
          {tab === 1 && <SliderTab />}
          {tab === 2 && <EcuacionesTab />}
        </div>
      </div>
    </div>
  )
}
