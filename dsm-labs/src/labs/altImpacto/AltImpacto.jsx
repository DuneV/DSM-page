import { useState, useRef, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

/* ============================================================
   COLLISION SOLVER — 1D Central Impact
   v1' = ((m1-e·m2)·v1 + (1+e)·m2·v2) / (m1+m2)
   v2' = ((m2-e·m1)·v2 + (1+e)·m1·v1) / (m1+m2)
============================================================ */
function solveCollision(m1, v1, m2, v2, e) {
  const v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2)
  const v2p = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2)
  const p_before = m1 * v1 + m2 * v2
  const p_after = m1 * v1p + m2 * v2p
  const ke_before = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  const ke_after = 0.5 * m1 * v1p * v1p + 0.5 * m2 * v2p * v2p
  return { v1p, v2p, p_before, p_after, ke_before, ke_after }
}

export default function AltImpacto() {
  const [activeTab, setActiveTab] = useState('sim')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #2f6b4a 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#c6f6d5', color: '#276749' }}>Dinamica</span>
          <h1>Impacto y Colisiones</h1>
          <p className="lab-subtitle">
            Impacto central directo · Coeficiente de restitucion · Conservacion del momento
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Teoria del Impacto</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>impacto</strong> es una colision de corta duracion donde las fuerzas
            de contacto son muy grandes comparadas con las externas. Se analiza usando
            la <strong>conservacion del momento lineal</strong> y el
            <strong> coeficiente de restitucion</strong> e, que mide la relacion entre las
            velocidades relativas de separacion y aproximacion.
            e = 1 (elastico puro), 0 &lt; e &lt; 1 (parcialmente elastico), e = 0 (plastico).
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[
              ['Elastico', 'e = 1, KE conservada'],
              ['Parcial', '0 < e < 1'],
              ['Plastico', 'e = 0, KE perdida maxima'],
            ].map(([l, v]) => (
              <div className="alt-stat-box" key={l} style={{ background: '#f0fff4' }}>
                <span className="alt-stat-label">{l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#276749' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[
            ['sim', 'Simulacion'],
            ['analysis', 'Analisis'],
            ['sweep', 'Variacion de e'],
          ].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`}
              onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'sim' && <CollisionSim />}
        {activeTab === 'analysis' && <CollisionAnalysis />}
        {activeTab === 'sweep' && <RestitutionSweep />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — CANVAS ANIMATION
============================================================ */
function CollisionSim() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const stateRef = useRef({ phase: 'pre', x1: 0, x2: 0, v1: 0, v2: 0 })
  const pRef = useRef({})
  const lastRef = useRef(null)

  const [m1, setM1] = useState(3)
  const [m2, setM2] = useState(2)
  const [v1init, setV1init] = useState(4)
  const [v2init, setV2init] = useState(-2)
  const [e, setE] = useState(0.8)

  useEffect(() => { pRef.current = { m1, m2, v1: v1init, v2: v2init, e } }, [m1, m2, v1init, v2init, e])

  const resetAnim = () => {
    const W = 560
    stateRef.current = {
      phase: 'pre',
      x1: W * 0.18,
      x2: W * 0.82,
      v1: v1init * 50,
      v2: v2init * 50,
    }
    lastRef.current = null
  }

  useEffect(() => { resetAnim() }, [m1, m2, v1init, v2init, e]) // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.05)
      lastRef.current = time
      const { m1, m2, e } = pRef.current

      const W = canvas.width, H = canvas.height
      const r1 = 10 + m1 * 6, r2 = 10 + m2 * 6
      const s = stateRef.current
      const cy = H / 2

      // Move
      if (s.phase !== 'done') {
        s.x1 += s.v1 * dt
        s.x2 += s.v2 * dt

        // Collision detection
        if (s.phase === 'pre' && s.x2 - s.x1 <= r1 + r2) {
          // Solve collision
          const sol = solveCollision(m1, s.v1 / 50, m2, s.v2 / 50, e)
          s.v1 = sol.v1p * 50
          s.v2 = sol.v2p * 50
          s.phase = 'post'
        }

        // Boundary check — stop if balls go off screen
        if (s.x1 < r1 || s.x2 > W - r2 || s.x1 > W || s.x2 < 0) s.phase = 'done'
      }

      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f0fdf4'); bg.addColorStop(1, '#dcfce7')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Track
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(0, cy - 50); ctx.lineTo(W, cy - 50); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy + 50); ctx.lineTo(W, cy + 50); ctx.stroke()
      ctx.setLineDash([])

      // Draw balls
      function ball(x, r, color, label, vel) {
        ctx.fillStyle = color
        ctx.shadowColor = color + '60'; ctx.shadowBlur = 14
        ctx.beginPath(); ctx.arc(x, cy, r, 0, 2 * Math.PI); ctx.fill()
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x, cy, r, 0, 2 * Math.PI); ctx.stroke()

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath(); ctx.arc(x - r * 0.3, cy - r * 0.3, r * 0.35, 0, 2 * Math.PI); ctx.fill()

        // Label
        ctx.font = `bold ${Math.max(12, r * 0.5)}px Inter`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
        ctx.fillText(label, x, cy + 5)
        ctx.textAlign = 'left'

        // Velocity arrow
        const arrowLen = vel * 8
        const ay = cy - r - 16
        ctx.strokeStyle = vel > 0 ? '#059669' : '#dc2626'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x + arrowLen, ay); ctx.stroke()
        if (Math.abs(arrowLen) > 4) {
          const dir = arrowLen > 0 ? 1 : -1
          ctx.fillStyle = vel > 0 ? '#059669' : '#dc2626'
          ctx.beginPath()
          ctx.moveTo(x + arrowLen, ay)
          ctx.lineTo(x + arrowLen - dir * 10, ay - 5)
          ctx.lineTo(x + arrowLen - dir * 10, ay + 5)
          ctx.closePath(); ctx.fill()
        }
        ctx.font = '11px Inter'; ctx.fillStyle = vel > 0 ? '#059669' : '#dc2626'; ctx.textAlign = 'center'
        ctx.fillText(`v=${(vel / 50).toFixed(1)}`, x + arrowLen / 2, ay - 8)
        ctx.textAlign = 'left'
      }

      ball(s.x1, r1, '#276749', `m₁=${m1}`, s.v1)
      ball(s.x2, r2, '#38a169', `m₂=${m2}`, s.v2)

      // Phase label
      ctx.font = 'bold 13px Inter'; ctx.fillStyle = '#142430'
      ctx.textAlign = 'center'
      const label = s.phase === 'pre' ? 'Pre-Impacto' : s.phase === 'post' ? 'Post-Impacto' : 'Finalizado'
      ctx.fillText(label, W / 2, 22)
      ctx.textAlign = 'left'

      // e label
      ctx.font = '12px Inter'; ctx.fillStyle = '#276749'
      ctx.fillText(`e = ${e.toFixed(2)}`, 10, 22)

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  const sol = useMemo(() => solveCollision(m1, v1init, m2, v2init, e), [m1, v1init, m2, v2init, e])

  return (
    <div>
      <h2 className="section-title">Simulacion de Colision</h2>

      <div className="controls-panel">
        <h3>Condiciones Iniciales</h3>
        <div className="controls-row">
          {[
            ['m₁ (kg)', m1, setM1, 0.5, 10, 0.5],
            ['m₂ (kg)', m2, setM2, 0.5, 10, 0.5],
            ['v₁ (m/s)', v1init, setV1init, -8, 12, 0.5],
            ['v₂ (m/s)', v2init, setV2init, -12, 8, 0.5],
            ['e (coef. restitucion)', e, setE, 0, 1, 0.05],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 0.1 ? val.toFixed(2) : val.toFixed(1)}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={resetAnim}>
          Reiniciar Animacion
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <canvas ref={canvasRef} width={560} height={200}
          style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }} />
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Velocidades</h3>
          <div className="alt-stat-grid">
            {[
              ['v₁ antes', `${v1init.toFixed(1)} m/s`],
              ['v₂ antes', `${v2init.toFixed(1)} m/s`],
              ['v₁\' despues', `${sol.v1p.toFixed(3)} m/s`],
              ['v₂\' despues', `${sol.v2p.toFixed(3)} m/s`],
            ].map(([l, v]) => (
              <div className="alt-stat-row" key={l}>
                <span>{l}</span><span className="alt-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Conservacion</h3>
          <div className="alt-stat-grid">
            {[
              ['p antes', `${sol.p_before.toFixed(3)} kg·m/s`],
              ['p despues', `${sol.p_after.toFixed(3)} kg·m/s`],
              ['KE antes', `${sol.ke_before.toFixed(3)} J`],
              ['KE despues', `${sol.ke_after.toFixed(3)} J`],
              ['ΔKE perdida', `${(sol.ke_before - sol.ke_after).toFixed(3)} J`],
            ].map(([l, v]) => (
              <div className="alt-stat-row" key={l}>
                <span>{l}</span><span className="alt-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — MOMENTUM / ENERGY BAR CHARTS
============================================================ */
function CollisionAnalysis() {
  const [m1, setM1] = useState(3)
  const [m2, setM2] = useState(2)
  const [v1, setV1] = useState(4)
  const [v2, setV2] = useState(-2)
  const [e, setE] = useState(0.8)

  const sol = useMemo(() => solveCollision(m1, v1, m2, v2, e), [m1, v1, m2, v2, e])

  const momentumData = [
    { name: 'Antes', m1: +(m1 * v1).toFixed(3), m2: +(m2 * v2).toFixed(3), total: +sol.p_before.toFixed(3) },
    { name: 'Despues', m1: +(m1 * sol.v1p).toFixed(3), m2: +(m2 * sol.v2p).toFixed(3), total: +sol.p_after.toFixed(3) },
  ]

  const energyData = [
    { name: 'Antes', KE1: +(0.5 * m1 * v1 * v1).toFixed(3), KE2: +(0.5 * m2 * v2 * v2).toFixed(3), total: +sol.ke_before.toFixed(3) },
    { name: 'Despues', KE1: +(0.5 * m1 * sol.v1p ** 2).toFixed(3), KE2: +(0.5 * m2 * sol.v2p ** 2).toFixed(3), total: +sol.ke_after.toFixed(3) },
  ]

  const loss = (sol.ke_before - sol.ke_after)
  const lossPercent = sol.ke_before > 0 ? (loss / sol.ke_before * 100) : 0

  return (
    <div>
      <h2 className="section-title">Analisis de Momento y Energia</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['m₁ (kg)', m1, setM1, 0.5, 10, 0.5],
            ['m₂ (kg)', m2, setM2, 0.5, 10, 0.5],
            ['v₁ (m/s)', v1, setV1, -8, 12, 0.5],
            ['v₂ (m/s)', v2, setV2, -12, 8, 0.5],
            ['e', e, setE, 0, 1, 0.05],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 0.1 ? val.toFixed(2) : val.toFixed(1)}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Momento Lineal (kg·m/s)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={momentumData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="m1" fill="#276749" name="p₁ (masa 1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="m2" fill="#38a169" name="p₂ (masa 2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#142430" name="p total" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Energia Cinetica (J)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={energyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="KE1" fill="#276749" name="KE₁" radius={[4, 4, 0, 0]} />
              <Bar dataKey="KE2" fill="#38a169" name="KE₂" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#142430" name="KE total" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`card ${lossPercent > 50 ? '' : ''}`} style={{ marginTop: 20, textAlign: 'center' }}>
        <h3>Perdida de Energia Cinetica</h3>
        <div style={{ fontSize: 42, fontWeight: 800, color: lossPercent > 30 ? '#e53e3e' : '#276749', margin: '12px 0' }}>
          {lossPercent.toFixed(1)}%
        </div>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>
          ΔKE = {loss.toFixed(3)} J &nbsp;|&nbsp; e = {e.toFixed(2)}
          &nbsp;|&nbsp; {e === 1 ? 'Colision Elastica' : e === 0 ? 'Colision Perfectamente Plastica' : 'Colision Parcialmente Elastica'}
        </p>
      </div>

      <div className="editable-section" style={{ marginTop: 20 }}>
        <h3>Ecuaciones del Impacto</h3>
        <div className="equation">v₁' = [(m₁−e·m₂)·v₁ + (1+e)·m₂·v₂] / (m₁+m₂)</div>
        <div className="equation" style={{ marginTop: 8 }}>v₂' = [(m₂−e·m₁)·v₂ + (1+e)·m₁·v₁] / (m₁+m₂)</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          <strong>Coeficiente de restitucion:</strong> e = |v₂'−v₁'| / |v₁−v₂|
          &nbsp;&nbsp; Definicion experimental: velocidad relativa de separacion / velocidad relativa de aproximacion.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — RESTITUTION SWEEP
============================================================ */
function RestitutionSweep() {
  const [m1, setM1] = useState(3)
  const [m2, setM2] = useState(2)
  const [v1, setV1] = useState(4)
  const [v2, setV2] = useState(-2)

  const sweepData = useMemo(() => {
    return Array.from({ length: 101 }, (_, i) => {
      const e = i / 100
      const sol = solveCollision(m1, v1, m2, v2, e)
      return {
        e: +e.toFixed(2),
        v1p: +sol.v1p.toFixed(4),
        v2p: +sol.v2p.toFixed(4),
        keLoss: +(sol.ke_before - sol.ke_after).toFixed(4),
        keLossPct: +(sol.ke_before > 0 ? (sol.ke_before - sol.ke_after) / sol.ke_before * 100 : 0).toFixed(2),
      }
    })
  }, [m1, v1, m2, v2])

  return (
    <div>
      <h2 className="section-title">Variacion del Coeficiente de Restitucion</h2>

      <div className="controls-panel">
        <h3>Condiciones fijas</h3>
        <div className="controls-row">
          {[
            ['m₁', m1, setM1, 0.5, 10, 0.5],
            ['m₂', m2, setM2, 0.5, 10, 0.5],
            ['v₁ (m/s)', v1, setV1, -8, 12, 0.5],
            ['v₂ (m/s)', v2, setV2, -12, 8, 0.5],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {val.toFixed(1)}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Velocidades Post-Impacto vs e</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sweepData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="e" label={{ value: 'e', position: 'bottom' }} />
              <YAxis label={{ value: 'v (m/s)', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="v1p" stroke="#276749" name="v₁'" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="v2p" stroke="#38a169" name="v₂'" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Perdida de KE (%) vs e</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sweepData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="e" label={{ value: 'e', position: 'bottom' }} />
              <YAxis label={{ value: 'ΔKE (%)', angle: -90, position: 'left' }} domain={[0, 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="keLossPct" stroke="#e53e3e" name="ΔKE %" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: 16 }}>
        <strong>Valores tipicos de e por material:</strong> Acero-Acero: 0.55–0.65 &nbsp;|&nbsp;
        Caucho-Acero: 0.85–0.95 &nbsp;|&nbsp; Madera-Acero: 0.40–0.50 &nbsp;|&nbsp;
        Arcilla (plastico): ≈ 0
      </div>
    </div>
  )
}
