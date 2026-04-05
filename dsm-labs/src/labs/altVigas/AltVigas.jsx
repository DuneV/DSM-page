import { useState, useRef, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

/* ============================================================
   EULER-BERNOULLI BEAM NATURAL FREQUENCIES
   ωn = (βnL)² · √(EI / ρA·L⁴)
   Boundary conditions (βnL values):
   Simply-Supported:  nπ
   Cantilever (C-F):  1.875, 4.694, 7.855, 10.996, 14.137
   Free-Free   (F-F): 4.730, 7.853, 10.996, 14.137
   Clamped-Clamped:   4.730, 7.853, 10.996, 14.137 (same as FF for interior)
============================================================ */

const BC_DATA = {
  'SS': {
    label: 'Simplemente apoyada (S-S)',
    betaL: n => n * Math.PI,
    shape: (n, x) => Math.sin(n * Math.PI * x),
    color: '#2b6cb0',
  },
  'CF': {
    label: 'Voladizo (C-F)',
    betaL: n => [0, 1.8751, 4.6941, 7.8548, 10.9955, 14.1372][n],
    shape: (n, x, bL) => {
      const sig = (Math.cosh(bL) + Math.cos(bL)) / (Math.sinh(bL) + Math.sin(bL))
      return Math.cosh(bL * x) - Math.cos(bL * x) - sig * (Math.sinh(bL * x) - Math.sin(bL * x))
    },
    color: '#276749',
  },
  'CC': {
    label: 'Empotrada-Empotrada (C-C)',
    betaL: n => [0, 4.7300, 7.8532, 10.9956, 14.1372, 17.2788][n],
    shape: (n, x, bL) => {
      const sig = (Math.cosh(bL) - Math.cos(bL)) / (Math.sinh(bL) - Math.sin(bL))
      return Math.cosh(bL * x) - Math.cos(bL * x) - sig * (Math.sinh(bL * x) - Math.sin(bL * x))
    },
    color: '#975a16',
  },
  'CS': {
    label: 'Empotrada-Apoyada (C-S)',
    betaL: n => [0, 3.9266, 7.0686, 10.2102, 13.3518, 16.4934][n],
    shape: (n, x, bL) => {
      const sig = (Math.cosh(bL) - Math.cos(bL)) / (Math.sinh(bL) - Math.sin(bL))
      return Math.cosh(bL * x) - Math.cos(bL * x) - sig * (Math.sinh(bL * x) - Math.sin(bL * x))
    },
    color: '#553c9a',
  },
}

export default function AltVigas() {
  const [activeTab, setActiveTab] = useState('modes')

  return (
    <div className="lab-page alt-lab">
      <div className="container">
        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #3d2100 0%, #975a16 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#fefcbf', color: '#744210' }}>Vibraciones</span>
          <h1>Vibraciones de Vigas</h1>
          <p className="lab-subtitle">Euler-Bernoulli · Frecuencias naturales · Formas modales · Condiciones de frontera</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Teoria de Vibracion de Vigas</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            La <strong>viga de Euler-Bernoulli</strong> es el modelo mas usado para vibraciones transversales de vigas
            esbeltas. La ecuacion de movimiento es una EDP de cuarto orden en espacio y segundo en tiempo.
            Las <strong>condiciones de frontera</strong> (apoyos, empotramientos, extremos libres) determinan
            las frecuencias naturales discretas y las correspondientes <strong>formas modales</strong>.
            Cada modo tiene su propia frecuencia y patron de desplazamiento — los nodos son puntos de
            desplazamiento nulo.
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[['Tipo', 'Continuo'], ['EDP', '4to orden'], ['BC', 'Determinan ωn']].map(([l, v]) => (
              <div className="alt-stat-box" key={l} style={{ background: '#fffbeb' }}>
                <span className="alt-stat-label">{l}</span>
                <span className="alt-stat-value" style={{ fontSize: '1rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['modes', 'Formas Modales'], ['freqs', 'Frecuencias Naturales'], ['eq', 'Modelo y Ecuaciones']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'modes' && <ModeShapesCanvas />}
        {activeTab === 'freqs' && <NaturalFreqTab />}
        {activeTab === 'eq'    && <BeamEquations />}
      </div>
    </div>
  )
}

/* ---- TAB 1 — ANIMATED MODE SHAPES ---- */
function ModeShapesCanvas() {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const tRef      = useRef(0)
  const lastRef   = useRef(null)

  const [bc,   setBc]   = useState('SS')
  const [mode, setMode] = useState(1)
  const [amp,  setAmp]  = useState(1.0)
  const [playing, setPlaying] = useState(true)

  const pRef = useRef({})
  useEffect(() => { pRef.current = { bc, mode, amp, playing } }, [bc, mode, amp, playing])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.04)
      lastRef.current = time
      const { bc, mode, amp, playing } = pRef.current
      if (playing) tRef.current += dt * 3

      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fffbeb'); bg.addColorStop(1, '#fef3c7')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      const bcDef = BC_DATA[bc]
      const bL    = bcDef.betaL(mode)
      const N     = 200
      const pad   = 50, beamY = H / 2
      const beamW = W - 2 * pad, scaleY = H * 0.28 * amp

      // Undeformed beam
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(pad, beamY); ctx.lineTo(pad + beamW, beamY); ctx.stroke()
      ctx.setLineDash([])

      // Deformed beam
      const pts = []
      for (let i = 0; i <= N; i++) {
        const xi = i / N
        const phi = bcDef.shape(mode, xi, bL)
        const py = beamY - phi * Math.cos(tRef.current) * scaleY / (Math.abs(phi) > 0.01 ? Math.max(...Array.from({length:51},(_,j)=>Math.abs(bcDef.shape(mode,j/50,bL)))) : 1)
        pts.push([pad + xi * beamW, py])
      }

      // Normalise
      let maxPhi = 0
      for (let i = 0; i <= N; i++) { const xi = i/N; const phi = Math.abs(bcDef.shape(mode, xi, bL)); if (phi > maxPhi) maxPhi = phi }
      if (maxPhi < 1e-10) maxPhi = 1

      ctx.strokeStyle = bcDef.color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const xi = i / N
        const phi = bcDef.shape(mode, xi, bL) / maxPhi
        const py = beamY - phi * Math.cos(tRef.current) * scaleY
        if (i === 0) ctx.moveTo(pad + xi * beamW, py); else ctx.lineTo(pad + xi * beamW, py)
      }
      ctx.stroke()

      // Fill area between deformed and undeformed
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const xi = i / N
        const phi = bcDef.shape(mode, xi, bL) / maxPhi
        const py = beamY - phi * Math.cos(tRef.current) * scaleY
        if (i === 0) ctx.moveTo(pad + xi * beamW, py); else ctx.lineTo(pad + xi * beamW, py)
      }
      ctx.lineTo(pad + beamW, beamY); ctx.lineTo(pad, beamY); ctx.closePath()
      ctx.fillStyle = bcDef.color + '28'; ctx.fill()

      // Nodes (zero-crossing markers)
      for (let i = 1; i < N; i++) {
        const xi0 = (i-1)/N, xi1 = i/N
        const p0 = bcDef.shape(mode, xi0, bL), p1 = bcDef.shape(mode, xi1, bL)
        if (p0 * p1 < 0) {
          const xNode = pad + ((xi0 + xi1) / 2) * beamW
          ctx.fillStyle = '#e53e3e'
          ctx.beginPath(); ctx.arc(xNode, beamY, 5, 0, 2 * Math.PI); ctx.fill()
        }
      }

      // BC symbols
      function drawSupport(x, type) {
        if (type === 'C') {
          ctx.fillStyle = '#142430'
          ctx.fillRect(x - 14, beamY - 22, 14, 44)
          ctx.strokeStyle = '#142430'; ctx.lineWidth = 1
          for (let sy = beamY - 20; sy < beamY + 22; sy += 10) { ctx.beginPath(); ctx.moveTo(x - 14, sy); ctx.lineTo(x - 22, sy + 8); ctx.stroke() }
        } else if (type === 'S') {
          ctx.strokeStyle = '#142430'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(x, beamY); ctx.lineTo(x - 12, beamY + 18); ctx.lineTo(x + 12, beamY + 18); ctx.closePath(); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(x - 15, beamY + 20); ctx.lineTo(x + 15, beamY + 20); ctx.stroke()
        } else { // F (free) — nothing
        }
      }

      const bcMap = { SS: ['S','S'], CF: ['C','F'], CC: ['C','C'], CS: ['C','S'] }
      const [left, right] = bcMap[bc]
      drawSupport(pad, left); drawSupport(pad + beamW, right)

      // Labels
      ctx.font = 'bold 12px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText(`Modo ${mode}`, 10, 22)
      ctx.fillText(`βnL = ${bL.toFixed(3)}`, 10, 38)
      ctx.fillText(bcDef.label, 10, 54)
      const nodos = Math.max(0, mode - 1)
      ctx.fillText(`Nodos interiores: ${nodos}`, 10, 70)

      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Formas Modales Animadas</h2>
      <div className="controls-panel"><h3>Configuracion</h3><div className="controls-row">
        <div className="slider-group">
          <label>Condicion de frontera</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {Object.entries(BC_DATA).map(([key, def]) => (
              <button key={key} className={`bank-filter-btn ${bc === key ? 'active' : ''}`}
                style={{ borderColor: def.color, ...(bc === key ? { background: def.color } : {}) }}
                onClick={() => setBc(key)}>{key}</button>
            ))}
          </div>
        </div>
        <div className="slider-group">
          <label>Numero de modo: {mode}</label>
          <input type="range" min="1" max="4" step="1" value={mode} onChange={e => setMode(+e.target.value)} />
        </div>
        <div className="slider-group">
          <label>Amplitud visual: {amp.toFixed(1)}</label>
          <input type="range" min="0.2" max="2" step="0.1" value={amp} onChange={e => setAmp(+e.target.value)} />
        </div>
      </div>
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pausar' : 'Reanudar'}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <canvas ref={canvasRef} width={680} height={340}
          style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }} />
      </div>
      <div className="info-box" style={{ marginTop: 12 }}>
        Los puntos rojos son <strong>nodos</strong> (desplazamiento siempre nulo). El modo n tiene n−1 nodos
        interiores. El modo 1 (fundamental) tiene la menor frecuencia y forma mas suave.
      </div>
    </div>
  )
}

/* ---- TAB 2 — NATURAL FREQUENCIES TABLE ---- */
function NaturalFreqTab() {
  const [E,   setE]   = useState(200e9)   // Pa (steel)
  const [rho, setRho] = useState(7850)    // kg/m³
  const [L,   setL]   = useState(1.0)     // m
  const [b,   setB]   = useState(0.05)    // m (width)
  const [h,   setH]   = useState(0.01)    // m (height)
  const [bc,  setBc]  = useState('SS')

  const { freqs, alpha } = useMemo(() => {
    const I  = b * h ** 3 / 12
    const A  = b * h
    const al = Math.sqrt(E * I / (rho * A))
    const bcDef = BC_DATA[bc]
    const freqs = Array.from({ length: 5 }, (_, i) => {
      const n  = i + 1
      const bL = bcDef.betaL(n)
      const wn = (bL / L) ** 2 * al
      const fn = wn / (2 * Math.PI)
      return { mode: n, betaL: +bL.toFixed(4), wn: +wn.toFixed(3), fn: +fn.toFixed(4), Tn: +(1/fn).toFixed(5) }
    })
    return { freqs, alpha: +al.toFixed(4) }
  }, [E, rho, L, b, h, bc])

  const barData = freqs.map(f => ({ mode: `ωn${f.mode}`, fn: f.fn }))
  const colors  = ['#975a16', '#c05621', '#ed8936', '#f6ad55', '#fbd38d']

  return (
    <div>
      <h2 className="section-title">Frecuencias Naturales — Calculadora</h2>
      <div className="controls-panel"><h3>Propiedades de la Viga</h3><div className="controls-row">
        {[
          ['E (GPa)', E/1e9, v => setE(v*1e9), 50, 400, 5],
          ['ρ (kg/m³)', rho, setRho, 1000, 20000, 50],
          ['L (m)', L, setL, 0.1, 5, 0.05],
          ['b (m)', b, setB, 0.01, 0.2, 0.005],
          ['h (m)', h, setH, 0.002, 0.1, 0.001],
        ].map(([lbl, val, set, mn, mx, step]) => (
          <div className="slider-group" key={lbl}>
            <label>{lbl}: {val.toFixed(step < 0.01 ? 3 : step < 0.1 ? 3 : 1)}</label>
            <input type="range" min={mn} max={mx} step={step} value={val} onChange={e => set(+e.target.value)} />
          </div>
        ))}
        <div className="slider-group">
          <label>Condicion de frontera</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {Object.entries(BC_DATA).map(([key]) => (
              <button key={key} className={`bank-filter-btn ${bc === key ? 'active' : ''}`} onClick={() => setBc(key)}>{key}</button>
            ))}
          </div>
        </div>
      </div></div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Frecuencias Naturales</h3>
          <div className="alt-stat-row" style={{ marginBottom: 10, background: '#fef3c7' }}>
            <span>α = √(EI/ρA)</span>
            <span className="alt-val" style={{ color: '#92400e' }}>{alpha} m²/s</span>
          </div>
          <table>
            <thead><tr><th>Modo</th><th>βnL</th><th>ωn (rad/s)</th><th>fn (Hz)</th><th>Tn (s)</th></tr></thead>
            <tbody>
              {freqs.map(f => (
                <tr key={f.mode}>
                  <td><strong>n={f.mode}</strong></td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{f.betaL}</td>
                  <td style={{ fontFamily: 'var(--mono)', color: '#975a16', fontWeight: 700 }}>{f.wn}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{f.fn}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{f.Tn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="profile-chart">
          <h4>fn (Hz) por modo</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: 'fn (Hz)', position: 'bottom' }} />
              <YAxis dataKey="mode" type="category" width={40} />
              <Tooltip />
              <Bar dataKey="fn" name="fn (Hz)" radius={[0, 6, 6, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ---- TAB 3 — EQUATIONS ---- */
function BeamEquations() {
  return (
    <div>
      <h2 className="section-title">Modelo de Euler-Bernoulli</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Ecuacion de Movimiento</h3>
        <div className="equation">EI · ∂⁴w/∂x⁴ + ρA · ∂²w/∂t² = q(x,t)</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Separacion de variables: w(x,t) = φ(x)·q(t) →
        </p>
        <div className="equation">φ''''(x) − β⁴φ(x) = 0 &nbsp;&nbsp;&nbsp; β⁴ = ρA·ω²/(EI)</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>Solucion espacial: φ(x) = C₁cosh(βx) + C₂sinh(βx) + C₃cos(βx) + C₄sin(βx)</p>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Frecuencias Naturales</h3>
        <div className="equation">ωn = (βnL)² · √(EI / ρA·L⁴) = (βnL)² · α / L²</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>donde α = √(EI/ρA) es la <em>velocidad de ondas de flexion</em>.</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Los valores (βnL) se obtienen de la ecuacion caracteristica de cada BC:</p>
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>BC</th><th>Ec. caracteristica</th><th>β₁L</th><th>β₂L</th></tr></thead>
          <tbody>
            <tr><td>S-S</td><td>sin(βL) = 0</td><td>π</td><td>2π</td></tr>
            <tr><td>C-F</td><td>1 + cos(βL)cosh(βL) = 0</td><td>1.875</td><td>4.694</td></tr>
            <tr><td>C-C</td><td>cos(βL)cosh(βL) = 1</td><td>4.730</td><td>7.853</td></tr>
            <tr><td>C-S</td><td>tan(βL) = tanh(βL)</td><td>3.927</td><td>7.069</td></tr>
          </tbody>
        </table>
      </div>
      <div className="editable-section">
        <h3>Supuestos del Modelo</h3>
        <ul style={{ fontSize: 13, lineHeight: 1.9, marginLeft: 18 }}>
          <li>Secciones transversales permanecen planas y perpendiculares al eje neutro (sin deformacion por cortante)</li>
          <li>Material linealmente elastico, isotropo y homogeneo</li>
          <li>Deflexiones pequeñas comparadas con la longitud (hipotesis de pequenas deformaciones)</li>
          <li>Masa distribuida uniformemente (ρA = constante)</li>
        </ul>
      </div>
    </div>
  )
}
