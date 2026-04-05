import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

/* ============================================================
   2-DOF TMD SYSTEM — FRF via impedance matrix
   Primary: M, K, C  (force F₀cosωt applied to M)
   Absorber: m, k, c  (attached to M)
   [M  0][Ẍ₁]   [C+c  -c][Ẋ₁]   [K+k  -k][X₁]   [F₀]
   [0  m][Ẍ₂] + [-c    c][Ẋ₂] + [-k    k][X₂] = [0  ]
============================================================ */
function frf2DOF(M, K, C, m, k, c, omega) {
  const w2 = omega * omega
  // Dynamic stiffness matrix components (complex)
  // D = K_dyn - ω²M_dyn + jωC_dyn
  const D11r = (K + k) - w2 * M,   D11i = omega * (C + c)
  const D12r = -k,                  D12i = -omega * c
  const D22r = k - w2 * m,          D22i = omega * c

  // det(D) = D11*D22 - D12²
  const detR = D11r * D22r - D11i * D22i - (D12r * D12r - D12i * D12i)
  const detI = D11r * D22i + D11i * D22r - 2 * D12r * D12i
  const detMag2 = detR * detR + detI * detI
  if (detMag2 < 1e-30) return { H1: 1e6, H2: 1e6 }

  // X1 = D22 * F0 / det  →  |H1| = |D22|/|det|
  const D22mag = Math.sqrt(D22r * D22r + D22i * D22i)
  const H1 = D22mag / Math.sqrt(detMag2)

  // X2 = D12 * F0 / det  →  |H2| = |D12|/|det|  (using Cramer, X2 = D11_row2_col / det but simplified)
  const D12mag = Math.sqrt(D12r * D12r + D12i * D12i)
  const H2 = D12mag / Math.sqrt(detMag2)

  return { H1, H2 }
}

function frfSingle(M, K, C, omega) {
  const w2 = omega * omega
  const Dr = K - w2 * M, Di = omega * C
  return 1 / Math.sqrt(Dr * Dr + Di * Di)
}

export default function AltAbsorsor() {
  const [activeTab, setActiveTab] = useState('design')

  return (
    <div className="lab-page alt-lab">
      <div className="container">
        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #2d1a5c 0%, #553c9a 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#e9d8fd', color: '#44337a' }}>Vibraciones</span>
          <h1>Absorsor Dinamico de Vibraciones</h1>
          <p className="lab-subtitle">TMD — Tuned Mass Damper · Supresion de resonancia · Sintonizacion optima</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Fundamento del TMD</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>absorbedor dinamico sintonizado</strong> (TMD) es una masa secundaria (m)
            conectada a la estructura principal (M) mediante un resorte y amortiguador.
            Cuando se sintoniza correctamente (ωₐ ≈ Ω₁), crea un <em>antiresonancia</em> en la
            frecuencia natural del sistema principal, eliminando prácticamente su resonancia.
            Ampliamente usado en rascacielos, puentes y maquinaria industrial para controlar
            vibraciones sin fuentes de energia externas.
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[['Ratio de masas', 'μ = m/M'], ['Sin. optima', 'fopt = 1/(1+μ)'], ['Amort. optimo', 'ζopt = √(3μ/8)']].map(([l, v]) => (
              <div className="alt-stat-box" key={l} style={{ background: '#faf5ff' }}>
                <span className="alt-stat-label">{l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#44337a' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['design', 'FRF con y sin Absorsor'], ['optimal', 'Sintonizacion Optima (Den Hartog)'], ['params', 'Efecto de Parametros']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'design'   && <FRFComparison />}
        {activeTab === 'optimal'  && <OptimalTuning />}
        {activeTab === 'params'   && <ParameterStudy />}
      </div>
    </div>
  )
}

/* ---- TAB 1 ---- */
function FRFComparison() {
  const [M,  setM]  = useState(100)
  const [K,  setK]  = useState(40000)
  const [C,  setC]  = useState(200)
  const [mu, setMu] = useState(0.05)   // mass ratio
  const [ft, setFt] = useState(1.0)    // tuning ratio ωa/ω1
  const [za, setZa] = useState(0.1)    // absorber damping ratio

  const data = useMemo(() => {
    const wn = Math.sqrt(K / M)
    const m = mu * M
    const k = (ft * wn) ** 2 * m
    const c = 2 * za * Math.sqrt(k * m)
    const pts = []
    for (let r = 0.3; r <= 2.2; r += 0.01) {
      const w = r * wn
      const H1 = frf2DOF(M, K, C, m, k, c, w).H1 * K    // non-dim: H1*K/F0
      const H0 = frfSingle(M, K, C, w) * K
      pts.push({ r: +r.toFixed(2), with: +Math.min(H1, 30).toFixed(4), without: +Math.min(H0, 30).toFixed(4) })
    }
    return { pts, wn, m, k, c }
  }, [M, K, C, mu, ft, za])

  const wn  = Math.sqrt(K / M)
  const fn  = wn / (2 * Math.PI)
  const m   = mu * M
  const k   = (ft * wn) ** 2 * m
  const fna = Math.sqrt(k / m) / (2 * Math.PI)

  return (
    <div>
      <h2 className="section-title">FRF con y sin Absorsor Dinamico</h2>

      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        {[
          ['M (kg)', M, setM, 10, 500, 5],
          ['K (N/m)', K, setK, 5000, 200000, 1000],
          ['C (N·s/m)', C, setC, 0, 2000, 20],
          ['μ = m/M', mu, setMu, 0.01, 0.2, 0.005],
          ['Sintonizacion ft = ωa/ω₁', ft, setFt, 0.5, 1.5, 0.01],
          ['ζa (absorsor)', za, setZa, 0, 0.4, 0.01],
        ].map(([lbl, val, set, mn, mx, step]) => (
          <div className="slider-group" key={lbl}>
            <label>{lbl}: {step < 0.1 ? val.toFixed(3) : val}</label>
            <input type="range" min={mn} max={mx} step={step} value={val} onChange={e => set(+e.target.value)} />
          </div>
        ))}
      </div></div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3>Parametros del Sistema</h3>
          <div className="alt-stat-grid">
            {[
              ['ω₁ (sistema principal)', `${wn.toFixed(2)} rad/s`],
              ['f₁', `${fn.toFixed(3)} Hz`],
              ['m (absorsor)', `${m.toFixed(1)} kg`],
              ['k (absorsor)', `${((ft * wn) ** 2 * m).toFixed(0)} N/m`],
              ['fna (absorsor)', `${fna.toFixed(3)} Hz`],
              ['Relacion ωa/ω₁', `${ft.toFixed(3)}`],
            ].map(([l, v]) => (
              <div className="alt-stat-row" key={l}><span>{l}</span><span className="alt-val">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="profile-chart">
          <h4>FRF |X₁·K/F₀| vs r = ω/ω₁</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.pts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="r" label={{ value: 'r = ω/ω₁', position: 'bottom' }} />
              <YAxis domain={[0, 12]} label={{ value: '|H|', angle: -90, position: 'left' }} />
              <Tooltip /><Legend />
              <ReferenceLine x={1} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'ω₁', position: 'top', fontSize: 11 }} />
              <ReferenceLine x={ft} stroke="#553c9a" strokeDasharray="4 4" label={{ value: 'ωa', position: 'top', fontSize: 11, fill: '#553c9a' }} />
              <Line type="monotone" dataKey="without" stroke="#e53e3e" name="Sin absorsor" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="with"    stroke="#553c9a" name="Con absorsor" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ---- TAB 2 ---- */
function OptimalTuning() {
  const [mu, setMu] = useState(0.05)

  const fopt  = 1 / (1 + mu)
  const zaopt = Math.sqrt(3 * mu / (8 * (1 + mu) ** 3))
  const fopt2 = Math.sqrt((1 + mu / 2) / (1 + mu))   // another fixed-point formula

  const M = 100, K = 40000, C = 80
  const wn = Math.sqrt(K / M)
  const m  = mu * M
  const k  = (fopt * wn) ** 2 * m
  const c  = 2 * zaopt * Math.sqrt(k * m)

  const curveData = useMemo(() => {
    const pts = []
    for (let r = 0.3; r <= 2.2; r += 0.01) {
      const w = r * wn
      const H = frf2DOF(M, K, C, m, k, c, w).H1 * K
      const H0 = frfSingle(M, K, C, w) * K
      pts.push({ r: +r.toFixed(2), opt: +Math.min(H, 20).toFixed(4), without: +Math.min(H0, 20).toFixed(4) })
    }
    return pts
  }, [mu, m, k, c, wn]) // eslint-disable-line

  const muRange = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const u = 0.01 + i * 0.005
      const f = 1 / (1 + u)
      const za = Math.sqrt(3 * u / (8 * (1 + u) ** 3))
      return { mu: +u.toFixed(3), fopt: +f.toFixed(4), zaopt: +za.toFixed(4) }
    })
  }, [])

  return (
    <div>
      <h2 className="section-title">Sintonizacion Optima — Formulas de Den Hartog</h2>

      <div className="controls-panel"><h3>Ratio de masas μ</h3><div className="controls-row">
        <div className="slider-group">
          <label>μ = m/M: {mu.toFixed(3)}</label>
          <input type="range" min="0.01" max="0.2" step="0.005" value={mu} onChange={e => setMu(+e.target.value)} />
        </div>
      </div></div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3>Valores Optimos (Den Hartog, 1947)</h3>
          <div className="alt-stat-grid">
            {[
              ['μ', mu.toFixed(3)],
              ['fopt = ωa_opt/ω₁', fopt.toFixed(4)],
              ['ζa_opt', zaopt.toFixed(4)],
              ['Pico max. (aprox.)', `${Math.sqrt(1 + 2/mu).toFixed(2)}`],
            ].map(([l, v]) => (
              <div className="alt-stat-row" key={l}><span>{l}</span><span className="alt-val" style={{ color: '#553c9a' }}>{v}</span></div>
            ))}
          </div>
          <div className="editable-section" style={{ marginTop: 14 }}>
            <h4>Formulas (Den Hartog)</h4>
            <p style={{ fontSize: 12 }}>fopt = 1/(1+μ)</p>
            <p style={{ fontSize: 12 }}>ζopt = √(3μ / 8(1+μ)³)</p>
            <p style={{ fontSize: 12, marginTop: 6, color: 'var(--text-light)' }}>Validas para amortiguamiento primario C ≈ 0</p>
          </div>
        </div>

        <div className="profile-chart">
          <h4>FRF con sintonizacion optima</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="r" label={{ value: 'r = ω/ω₁', position: 'bottom' }} />
              <YAxis domain={[0, 12]} />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="without" stroke="#e53e3e" name="Sin TMD"   dot={false} strokeWidth={1.5} strokeDasharray="6 3" />
              <Line type="monotone" dataKey="opt"     stroke="#553c9a" name="TMD optimo" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>fopt vs μ</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={muRange}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mu" label={{ value: 'μ', position: 'bottom' }} />
              <YAxis domain={[0.85, 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="fopt" stroke="#553c9a" name="fopt" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="profile-chart">
          <h4>ζopt vs μ</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={muRange}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mu" label={{ value: 'μ', position: 'bottom' }} />
              <YAxis domain={[0, 0.15]} />
              <Tooltip />
              <Line type="monotone" dataKey="zaopt" stroke="#805ad5" name="ζopt" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ---- TAB 3 ---- */
function ParameterStudy() {
  const [mu, setMu] = useState(0.05)
  const M = 100, K = 40000, C = 80, wn = Math.sqrt(K / M)

  const curves = useMemo(() => {
    const ratios = [0.8, 0.9, 1.0, 1.1, 1.2]
    return ratios.map(ft => {
      const m = mu * M, k = (ft * wn) ** 2 * m
      const za = Math.sqrt(3 * mu / (8 * (1 + mu) ** 3))
      const c = 2 * za * Math.sqrt(k * m)
      const pts = []
      for (let r = 0.4; r <= 2.0; r += 0.02) {
        const H = frf2DOF(M, K, C, m, k, c, r * wn).H1 * K
        pts.push({ r: +r.toFixed(2), [`ft=${ft}`]: +Math.min(H, 25).toFixed(3) })
      }
      return { ft, pts }
    })
  }, [mu, wn]) // eslint-disable-line

  const merged = useMemo(() => {
    const map = {}
    curves.forEach(({ ft, pts }) => pts.forEach(p => {
      if (!map[p.r]) map[p.r] = { r: p.r }
      map[p.r][`ft=${ft}`] = p[`ft=${ft}`]
    }))
    return Object.values(map)
  }, [curves])

  const colors = ['#e53e3e', '#ed8936', '#553c9a', '#38a169', '#2b6cb0']

  return (
    <div>
      <h2 className="section-title">Efecto de la Dessintonizacion</h2>
      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        <div className="slider-group">
          <label>μ = m/M: {mu.toFixed(3)}</label>
          <input type="range" min="0.01" max="0.15" step="0.005" value={mu} onChange={e => setMu(+e.target.value)} />
        </div>
      </div></div>
      <div className="profile-chart" style={{ marginTop: 16 }}>
        <h4>FRF para diferentes valores de sintonizacion ft = ωa/ω₁</h4>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="r" label={{ value: 'r = ω/ω₁', position: 'bottom' }} />
            <YAxis domain={[0, 15]} label={{ value: '|H|', angle: -90, position: 'left' }} />
            <Tooltip /><Legend />
            {[0.8, 0.9, 1.0, 1.1, 1.2].map((ft, i) => (
              <Line key={ft} type="monotone" dataKey={`ft=${ft}`} stroke={colors[i]} name={`ft = ${ft}`} dot={false} strokeWidth={ft === 1.0 ? 3 : 1.5} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="warning-box" style={{ marginTop: 12 }}>
        <strong>Impacto de la dessintonizacion:</strong> Un error del ±10% en ft puede
        incrementar el pico de resonancia significativamente. En estructuras reales
        (edificios, turbinas), se usan sistemas activos/semiactivos para mantener la
        sintonizacion a pesar de cambios de masa o rigidez.
      </div>
    </div>
  )
}
