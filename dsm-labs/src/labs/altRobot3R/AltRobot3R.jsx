import { useState, useRef, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

/* ============================================================
   3R PLANAR ROBOT — FK & WORKSPACE
   x_e = Σ Lᵢ cos(θ₁+…+θᵢ)
   y_e = Σ Lᵢ sin(θ₁+…+θᵢ)
============================================================ */
function fk3R(L1, L2, L3, t1, t2, t3) {
  const a1 = t1, a2 = t1 + t2, a3 = t1 + t2 + t3
  return {
    j1: [0, 0],
    j2: [L1 * Math.cos(a1), L1 * Math.sin(a1)],
    j3: [L1 * Math.cos(a1) + L2 * Math.cos(a2), L1 * Math.sin(a1) + L2 * Math.sin(a2)],
    ee: [
      L1 * Math.cos(a1) + L2 * Math.cos(a2) + L3 * Math.cos(a3),
      L1 * Math.sin(a1) + L2 * Math.sin(a2) + L3 * Math.sin(a3),
    ],
    phi: a3,
  }
}

export default function AltRobot3R() {
  const [activeTab, setActiveTab] = useState('fk')

  return (
    <div className="lab-page alt-lab">
      <div className="container">
        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #1a2e4a 0%, #2b6cb0 100%)' }}>
          <span className="alt-lab-topic-tag">Cinematica</span>
          <h1>Robot Serial 3R</h1>
          <p className="lab-subtitle">Cinematica directa e inversa · Jacobiano · Espacio de trabajo</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Robot Planar de 3 GDL Rotacionales</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            Un <strong>robot 3R planar</strong> tiene tres articulaciones rotativas que permiten
            posicionar y orientar el efector en el plano 2D. La <strong>cinematica directa</strong> (FK)
            calcula la posicion del efector dados los angulos articulares. La
            <strong> cinematica inversa</strong> (IK) hace lo contrario — tiene multiples soluciones
            para la mayoria de posiciones accesibles. El <strong>Jacobiano</strong> relaciona
            velocidades articulares con velocidades del efector.
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[['GDL', '3'], ['Articulaciones', '3R'], ['Espacio tarea', 'x, y, φ']].map(([l, v]) => (
              <div className="alt-stat-box" key={l}><span className="alt-stat-label">{l}</span><span className="alt-stat-value">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['fk', 'Cinematica Directa'], ['workspace', 'Espacio de Trabajo'], ['jacobian', 'Jacobiano']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'fk' && <FKSim />}
        {activeTab === 'workspace' && <Workspace />}
        {activeTab === 'jacobian' && <JacobianTab />}
      </div>
    </div>
  )
}

function FKSim() {
  const canvasRef = useRef(null)
  const [L1, setL1] = useState(100); const [L2, setL2] = useState(80); const [L3, setL3] = useState(60)
  const [t1, setT1] = useState(30); const [t2, setT2] = useState(-45); const [t3, setT3] = useState(20)

  const robot = useMemo(() => fk3R(L1, L2, L3, t1 * Math.PI / 180, t2 * Math.PI / 180, t3 * Math.PI / 180), [L1, L2, L3, t1, t2, t3])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#ebf4ff'); bg.addColorStop(1, '#dbeafe')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    const ox = W / 2, oy = H * 0.65
    const scale = Math.min(W, H) / (2.8 * (L1 + L2 + L3))
    const tx = x => ox + x * scale, ty = y => oy - y * scale

    // Grid
    ctx.strokeStyle = 'rgba(147,197,253,0.4)'; ctx.lineWidth = 1
    for (let g = -200; g <= 200; g += 50) {
      ctx.beginPath(); ctx.moveTo(tx(g), ty(-200)); ctx.lineTo(tx(g), ty(200)); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(tx(-200), ty(g)); ctx.lineTo(tx(200), ty(g)); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(tx(-220), ty(0)); ctx.lineTo(tx(220), ty(0)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(tx(0), ty(-180)); ctx.lineTo(tx(0), ty(180)); ctx.stroke()
    ctx.font = '11px Inter'; ctx.fillStyle = '#2b6cb0'
    ctx.fillText('X', tx(215), ty(4)); ctx.fillText('Y', tx(4), ty(175))

    const pts = [robot.j1, robot.j2, robot.j3, robot.ee]
    const colors = ['#2b6cb0', '#38a169', '#ed8936']

    // Links
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = colors[i]; ctx.lineWidth = 6; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(tx(pts[i][0]), ty(pts[i][1])); ctx.lineTo(tx(pts[i + 1][0]), ty(pts[i + 1][1])); ctx.stroke()
    }

    // EE orientation line
    const ee = robot.ee, phi = robot.phi, eeLen = 25
    ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(tx(ee[0]), ty(ee[1])); ctx.lineTo(tx(ee[0] + eeLen * Math.cos(phi)), ty(ee[1] + eeLen * Math.sin(phi))); ctx.stroke()
    ctx.setLineDash([])

    // Joints
    pts.forEach((p, i) => {
      const r = i === 3 ? 6 : 9
      ctx.fillStyle = i === 3 ? '#e53e3e' : '#fff'
      ctx.strokeStyle = colors[Math.min(i, 2)]
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(tx(p[0]), ty(p[1]), r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke()
    })

    // Base
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(tx(0) - 14, ty(0), 28, 10)
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1
    for (let bx = tx(0) - 14; bx < tx(0) + 14; bx += 8) { ctx.beginPath(); ctx.moveTo(bx, ty(0) + 10); ctx.lineTo(bx + 6, ty(0) + 18); ctx.stroke() }

    // Labels
    ctx.font = 'bold 12px Inter'
    ;[['J₁', robot.j1, '#2b6cb0'], ['J₂', robot.j2, '#38a169'], ['J₃', robot.j3, '#ed8936'], ['EE', robot.ee, '#e53e3e']].forEach(([lbl, p, col]) => {
      ctx.fillStyle = col; ctx.fillText(lbl, tx(p[0]) + 10, ty(p[1]) - 6)
    })

    // Info box
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath(); ctx.roundRect(8, 8, 180, 70, 8); ctx.fill()
    ctx.font = '12px Inter'; ctx.fillStyle = '#142430'
    ctx.fillText(`EE = (${robot.ee[0].toFixed(1)}, ${robot.ee[1].toFixed(1)})`, 14, 26)
    ctx.fillText(`φ = ${(robot.phi * 180 / Math.PI).toFixed(1)}°`, 14, 44)
    ctx.fillText(`|EE| = ${Math.hypot(...robot.ee).toFixed(1)}`, 14, 62)
  }, [robot, L1, L2, L3]) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Cinematica Directa Interactiva</h2>
      <div className="controls-panel">
        <h3>Longitudes de Eslabones y Angulos Articulares</h3>
        <div className="controls-row">
          {[['L₁', L1, setL1, 30, 150, 1], ['L₂', L2, setL2, 20, 130, 1], ['L₃', L3, setL3, 10, 100, 1]].map(([l, v, s, mn, mx]) => (
            <div className="slider-group" key={l}><label>{l}: {v} mm</label><input type="range" min={mn} max={mx} value={v} onChange={e => s(+e.target.value)} /></div>
          ))}
          {[['θ₁', t1, setT1, -180, 180, 1], ['θ₂', t2, setT2, -150, 150, 1], ['θ₃', t3, setT3, -150, 150, 1]].map(([l, v, s, mn, mx]) => (
            <div className="slider-group" key={l}><label>{l}: {v}°</label><input type="range" min={mn} max={mx} value={v} onChange={e => s(+e.target.value)} /></div>
          ))}
        </div>
      </div>
      <div className="viz-container">
        <div className="viz-panel">
          <h3>Robot 3R Planar</h3>
          <canvas ref={canvasRef} width={460} height={380} style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>
        <div className="viz-panel">
          <h3>Estado del Efector Final</h3>
          <div className="alt-stat-grid">
            {[['x_EE', `${robot.ee[0].toFixed(3)} mm`], ['y_EE', `${robot.ee[1].toFixed(3)} mm`], ['φ (orientacion)', `${(robot.phi * 180 / Math.PI).toFixed(2)}°`],
              ['J₂ = (x,y)', `(${robot.j2[0].toFixed(1)}, ${robot.j2[1].toFixed(1)})`],
              ['J₃ = (x,y)', `(${robot.j3[0].toFixed(1)}, ${robot.j3[1].toFixed(1)})`],
              ['|EE|', `${Math.hypot(...robot.ee).toFixed(3)} mm`]].map(([l, v]) => (
              <div className="alt-stat-row" key={l}><span>{l}</span><span className="alt-val">{v}</span></div>
            ))}
          </div>
          <div className="editable-section" style={{ marginTop: 14 }}>
            <h4>FK — Suma de transformaciones</h4>
            <p style={{ fontSize: 12 }}>x = L₁c₁ + L₂c₁₂ + L₃c₁₂₃</p>
            <p style={{ fontSize: 12 }}>y = L₁s₁ + L₂s₁₂ + L₃s₁₂₃</p>
            <p style={{ fontSize: 12 }}>φ = θ₁ + θ₂ + θ₃</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Workspace() {
  const [L1, setL1] = useState(100); const [L2, setL2] = useState(80); const [L3, setL3] = useState(60)

  const wsData = useMemo(() => {
    const pts = []
    const N = 18
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
      const t1 = (i / N) * 2 * Math.PI, t2 = (j / N) * 2 * Math.PI, t3 = (k / N) * 2 * Math.PI
      const r = fk3R(L1, L2, L3, t1, t2, t3)
      pts.push({ x: +r.ee[0].toFixed(1), y: +r.ee[1].toFixed(1) })
    }
    return pts
  }, [L1, L2, L3])

  return (
    <div>
      <h2 className="section-title">Espacio de Trabajo del Efector</h2>
      <div className="controls-panel"><h3>Eslabones</h3><div className="controls-row">
        {[['L₁', L1, setL1, 30, 150], ['L₂', L2, setL2, 20, 130], ['L₃', L3, setL3, 10, 100]].map(([l, v, s, mn, mx]) => (
          <div className="slider-group" key={l}><label>{l}: {v} mm</label><input type="range" min={mn} max={mx} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div></div>
      <div className="profile-chart">
        <h4>Espacio de trabajo — Puntos alcanzables por el efector</h4>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart><CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" name="X" label={{ value: 'X (mm)', position: 'bottom' }} domain={['auto', 'auto']} />
            <YAxis dataKey="y" type="number" name="Y" label={{ value: 'Y (mm)', angle: -90, position: 'left' }} domain={['auto', 'auto']} />
            <Tooltip />
            <Scatter data={wsData} fill="#2b6cb0" opacity={0.3} name="EE" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="info-box" style={{ marginTop: 12 }}>
        <strong>Alcance maximo:</strong> L₁+L₂+L₃ = {L1 + L2 + L3} mm &nbsp;|&nbsp;
        <strong>Alcance minimo:</strong> |L₁−L₂−L₃| = {Math.abs(L1 - L2 - L3)} mm
      </div>
    </div>
  )
}

function JacobianTab() {
  const [L1, setL1] = useState(100); const [L2, setL2] = useState(80); const [L3, setL3] = useState(60)
  const [t1, setT1] = useState(30); const [t2, setT2] = useState(-45); const [t3, setT3] = useState(20)

  const { J, det, cond } = useMemo(() => {
    const a1 = t1 * Math.PI / 180, a2 = (t1 + t2) * Math.PI / 180, a3 = (t1 + t2 + t3) * Math.PI / 180
    const J = [
      [-(L1 * Math.sin(a1) + L2 * Math.sin(a2) + L3 * Math.sin(a3)), -(L2 * Math.sin(a2) + L3 * Math.sin(a3)), -L3 * Math.sin(a3)],
      [ L1 * Math.cos(a1) + L2 * Math.cos(a2) + L3 * Math.cos(a3),   L2 * Math.cos(a2) + L3 * Math.cos(a3),   L3 * Math.cos(a3)],
      [1, 1, 1],
    ]
    const det = J[0][0] * (J[1][1] * J[2][2] - J[1][2] * J[2][1]) - J[0][1] * (J[1][0] * J[2][2] - J[1][2] * J[2][0]) + J[0][2] * (J[1][0] * J[2][1] - J[1][1] * J[2][0])
    return { J, det, cond: Math.abs(det) }
  }, [L1, L2, L3, t1, t2, t3])

  const jData = useMemo(() => {
    const data = []
    for (let i = 0; i <= 360; i += 4) {
      const a1 = i * Math.PI / 180, a2 = (i - 45) * Math.PI / 180, a3 = 20 * Math.PI / 180
      const j11 = -(L1 * Math.sin(a1) + L2 * Math.sin(a2) + L3 * Math.sin(a3))
      const j21 = L1 * Math.cos(a1) + L2 * Math.cos(a2) + L3 * Math.cos(a3)
      const detJ = j11 - j21
      data.push({ deg: i, det: +detJ.toFixed(3) })
    }
    return data
  }, [L1, L2, L3])

  return (
    <div>
      <h2 className="section-title">Jacobiano Geometrico</h2>
      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        {[['L₁', L1, setL1, 30, 150], ['L₂', L2, setL2, 20, 130], ['L₃', L3, setL3, 10, 100], ['θ₁', t1, setT1, -180, 180], ['θ₂', t2, setT2, -150, 150], ['θ₃', t3, setT3, -150, 150]].map(([l, v, s, mn, mx]) => (
          <div className="slider-group" key={l}><label>{l}: {v}</label><input type="range" min={mn} max={mx} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div></div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Matriz Jacobiana J(θ)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table><thead><tr><th></th><th>∂/∂θ₁</th><th>∂/∂θ₂</th><th>∂/∂θ₃</th></tr></thead>
            <tbody>
              {['ẋ', 'ẏ', 'φ̇'].map((row, i) => (
                <tr key={row}><td><strong>{row}</strong></td>{J[i].map((v, j) => <td key={j} style={{ fontFamily: 'var(--mono)' }}>{v.toFixed(3)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="alt-stat-grid" style={{ marginTop: 12 }}>
          <div className="alt-stat-row"><span>det(J)</span><span className="alt-val" style={{ color: Math.abs(det) < 5 ? '#e53e3e' : '#276749' }}>{det.toFixed(4)}</span></div>
          <div className="alt-stat-row"><span>Singularidad</span><span className="alt-val" style={{ color: Math.abs(det) < 5 ? '#e53e3e' : '#276749' }}>{Math.abs(det) < 5 ? 'PROXIMA' : 'No'}</span></div>
        </div>
      </div>
      <div className="editable-section">
        <h3>Relacion Jacobiana</h3>
        <div className="equation">ẋ_EE = J(θ) · θ̇</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>Singularidades ocurren cuando det(J) = 0. En esas configuraciones el robot pierde capacidad de moverse en cierta direccion del espacio de tarea.</p>
      </div>
    </div>
  )
}
