import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'

/* ============================================================
   3-DOF EIGENVALUE SOLVER (Jacobi-like for symmetric 3x3)
   M·x'' + K·x = 0
   We solve det(K - λM) = 0 for λ = ω²
   For diagonal M and tridiagonal K (chain system):
============================================================ */
function solveNDOF(masses, stiffnesses) {
  // masses = [m1, m2, m3], stiffnesses = [k0, k1, k2, k3]
  // k0 = ground-m1, k1 = m1-m2, k2 = m2-m3, k3 = m3-ground
  const [m1, m2, m3] = masses
  const [k0, k1, k2, k3] = stiffnesses

  // Stiffness matrix K
  const K = [
    [k0 + k1, -k1, 0],
    [-k1, k1 + k2, -k2],
    [0, -k2, k2 + k3],
  ]

  // Mass matrix M (diagonal)
  const M = [[m1, 0, 0], [0, m2, 0], [0, 0, m3]]

  // Inverse of M (diagonal)
  const Minv = [[1 / m1, 0, 0], [0, 1 / m2, 0], [0, 0, 1 / m3]]

  // A = M^{-1} K
  function matMul(A, B) {
    const n = A.length
    return A.map((row, i) => B[0].map((_, j) => row.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)))
  }

  const A = matMul(Minv, K)

  // Power iteration is too basic; use characteristic polynomial for 3x3
  // det(A - λI) = 0  →  -λ³ + tr(A)λ² - (sum of 2x2 principal minors)λ + det(A) = 0
  const tr = A[0][0] + A[1][1] + A[2][2]

  const m00 = A[1][1] * A[2][2] - A[1][2] * A[2][1]
  const m11 = A[0][0] * A[2][2] - A[0][2] * A[2][0]
  const m22 = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const sumMinors = m00 + m11 + m22

  const det =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

  // Cubic: λ³ - tr·λ² + sumMinors·λ - det = 0
  const roots = solveCubic(1, -tr, sumMinors, -det)
  const omegas = roots.filter(r => r > 0).map(r => Math.sqrt(r)).sort((a, b) => a - b)

  // Compute mode shapes by power of (A - λI) null space
  const modes = omegas.map(wn => {
    const B = A.map((row, i) => row.map((v, j) => v - (i === j ? wn * wn : 0)))
    // The mode shape: solve B·v = 0 with v[0] = 1
    // Use first 2 rows: B[0]·v = 0, B[1]·v = 0
    // v[0] = 1, then v[1] = -B[0][0]/B[0][1] approx
    const v = [1, 0, 0]
    if (Math.abs(B[0][1]) > 1e-10) {
      v[1] = -B[0][0] / B[0][1]
      if (Math.abs(B[1][2]) > 1e-10) {
        v[2] = -(B[1][0] * v[0] + B[1][1] * v[1]) / B[1][2]
      }
    } else if (Math.abs(B[0][2]) > 1e-10) {
      v[2] = -B[0][0] / B[0][2]
    }
    const norm = Math.hypot(...v)
    return v.map(x => x / (norm || 1))
  })

  return { omegas, modes, K, A }
}

function solveCubic(a, b, c, d) {
  // Cardano / numerical roots
  const p = (3 * a * c - b * b) / (3 * a * a)
  const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a)
  const D = (q / 2) ** 2 + (p / 3) ** 3
  const roots = []
  const offset = -b / (3 * a)

  if (D > 0) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(D))
    const v = Math.cbrt(-q / 2 - Math.sqrt(D))
    roots.push(u + v + offset)
  } else if (D === 0) {
    roots.push(3 * q / p + offset)
    roots.push(-3 * q / (2 * p) + offset)
  } else {
    const r = Math.sqrt((-p / 3) ** 3)
    const phi = Math.acos(Math.max(-1, Math.min(1, -q / (2 * r))))
    for (let k = 0; k < 3; k++) {
      roots.push(2 * Math.cbrt(r) * Math.cos((phi + 2 * Math.PI * k) / 3) + offset)
    }
  }
  return roots
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AltVibraciones() {
  const [activeTab, setActiveTab] = useState('modes')

  return (
    <div className="lab-page alt-lab">
      <div className="container">

        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #2d1a5c 0%, #553c9a 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#e9d8fd', color: '#44337a' }}>Vibraciones</span>
          <h1>Analisis Modal y Respuesta en Frecuencia</h1>
          <p className="lab-subtitle">
            Frecuencias naturales · Formas modales · FRF multi-GDL
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Analisis Modal de Estructuras</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>analisis modal</strong> determina las frecuencias naturales (ωn) y las
            <strong> formas modales</strong> (vectores propios) de un sistema mecanico multi-GDL.
            Los modos son patrones de deformacion en los que el sistema puede oscilar
            sincrónicamente. La <strong>Funcion de Respuesta en Frecuencia (FRF)</strong>
            relaciona la salida con la entrada en el dominio de frecuencias, mostrando resonancias
            como picos a las frecuencias naturales del sistema.
          </p>
          <div className="grid-3" style={{ marginTop: 16 }}>
            {[
              ['Ecuacion Modal', 'Kφ = ω²Mφ'],
              ['Ortogonalidad', 'φᵢᵀMφⱼ = δᵢⱼ'],
              ['FRF', 'H(ω) = (K−ω²M+jωC)⁻¹'],
            ].map(([lbl, eq]) => (
              <div className="alt-stat-box" key={lbl} style={{ background: '#faf5ff' }}>
                <span className="alt-stat-label">{lbl}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#44337a' }}>{eq}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[
            ['modes', 'Frecuencias Naturales'],
            ['shapes', 'Formas Modales'],
            ['frf', 'FRF'],
          ].map(([key, label]) => (
            <div key={key} className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </div>
          ))}
        </div>

        {activeTab === 'modes' && <NaturalFrequencies />}
        {activeTab === 'shapes' && <ModeShapes />}
        {activeTab === 'frf' && <FRFTab />}
      </div>
    </div>
  )
}

/* ============================================================
   TAB 1 — NATURAL FREQUENCIES (3-DOF CHAIN)
============================================================ */
function NaturalFrequencies() {
  const [m1, setM1] = useState(2.0)
  const [m2, setM2] = useState(2.0)
  const [m3, setM3] = useState(2.0)
  const [k0, setK0] = useState(1000)
  const [k1, setK1] = useState(800)
  const [k2, setK2] = useState(800)
  const [k3, setK3] = useState(600)

  const result = useMemo(() => {
    return solveNDOF([m1, m2, m3], [k0, k1, k2, k3])
  }, [m1, m2, m3, k0, k1, k2, k3])

  const freqData = result.omegas.map((wn, i) => ({
    mode: `Modo ${i + 1}`,
    omega: +wn.toFixed(3),
    freq: +(wn / (2 * Math.PI)).toFixed(4),
  }))

  return (
    <div>
      <h2 className="section-title">Frecuencias Naturales — Sistema 3 GDL</h2>

      <div className="info-box">
        Sistema de 3 masas en cadena: tierra −k₀− m₁ −k₁− m₂ −k₂− m₃ −k₃− tierra
      </div>

      <div className="controls-panel" style={{ marginTop: 16 }}>
        <h3>Parametros del Sistema</h3>
        <div className="controls-row">
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Masas (kg)</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[['m₁', m1, setM1], ['m₂', m2, setM2], ['m₃', m3, setM3]].map(([lbl, val, set]) => (
                <div className="slider-group" key={lbl}>
                  <label>{lbl}: {val.toFixed(1)}</label>
                  <input type="range" min="0.5" max="10" step="0.1" value={val}
                    onChange={e => set(+e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Rigideces (N/m)</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[['k₀', k0, setK0], ['k₁', k1, setK1], ['k₂', k2, setK2], ['k₃', k3, setK3]].map(([lbl, val, set]) => (
                <div className="slider-group" key={lbl}>
                  <label>{lbl}: {val}</label>
                  <input type="range" min="100" max="5000" step="50" value={val}
                    onChange={e => set(+e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Frecuencias Naturales</h3>
          <table>
            <thead>
              <tr><th>Modo</th><th>ωn (rad/s)</th><th>fn (Hz)</th><th>Periodo (s)</th></tr>
            </thead>
            <tbody>
              {result.omegas.map((wn, i) => (
                <tr key={i}>
                  <td><strong>Modo {i + 1}</strong></td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{wn.toFixed(3)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{(wn / (2 * Math.PI)).toFixed(4)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{(2 * Math.PI / wn).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 13, marginBottom: 8 }}>Matrices del Sistema</h4>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              Matriz de rigidez K (esquema tridiagonal):
            </p>
            <div className="equation" style={{ fontSize: 12 }}>
              K₁₁={result.K[0][0].toFixed(0)}, K₁₂={result.K[0][1].toFixed(0)},
              K₂₂={result.K[1][1].toFixed(0)}, K₂₃={result.K[1][2].toFixed(0)},
              K₃₃={result.K[2][2].toFixed(0)}
            </div>
          </div>
        </div>

        <div className="profile-chart">
          <h4>Frecuencias Naturales (rad/s)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={freqData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: 'ωn (rad/s)', position: 'bottom' }} />
              <YAxis dataKey="mode" type="category" width={70} />
              <Tooltip />
              <Bar dataKey="omega" name="ωn (rad/s)" radius={[0, 6, 6, 0]}>
                {freqData.map((_, i) => (
                  <Cell key={i} fill={['#553c9a', '#805ad5', '#b794f4'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 2 — MODE SHAPES VISUALIZATION
============================================================ */
function ModeShapes() {
  const [m1, setM1] = useState(2.0)
  const [m2, setM2] = useState(2.0)
  const [m3, setM3] = useState(2.0)
  const [k0, setK0] = useState(1000)
  const [k1, setK1] = useState(800)
  const [k2, setK2] = useState(800)
  const [k3, setK3] = useState(600)

  const result = useMemo(() => solveNDOF([m1, m2, m3], [k0, k1, k2, k3]), [m1, m2, m3, k0, k1, k2, k3])

  const modeData = result.modes.length > 0
    ? [
        { masa: 'Tierra', ...Object.fromEntries(result.modes.map((m, i) => [`Modo ${i + 1}`, 0])) },
        { masa: 'm₁', ...Object.fromEntries(result.modes.map((m, i) => [`Modo ${i + 1}`, +m[0].toFixed(4)])) },
        { masa: 'm₂', ...Object.fromEntries(result.modes.map((m, i) => [`Modo ${i + 1}`, +m[1].toFixed(4)])) },
        { masa: 'm₃', ...Object.fromEntries(result.modes.map((m, i) => [`Modo ${i + 1}`, +m[2].toFixed(4)])) },
      ]
    : []

  const colors = ['#553c9a', '#2b6cb0', '#276749']

  return (
    <div>
      <h2 className="section-title">Formas Modales (Vectores Propios)</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['m₁', m1, setM1, 0.5, 10, 0.1],
            ['m₂', m2, setM2, 0.5, 10, 0.1],
            ['m₃', m3, setM3, 0.5, 10, 0.1],
            ['k₀', k0, setK0, 100, 5000, 50],
            ['k₁', k1, setK1, 100, 5000, 50],
            ['k₂', k2, setK2, 100, 5000, 50],
            ['k₃', k3, setK3, 100, 5000, 50],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(1) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="profile-chart" style={{ marginTop: 24 }}>
        <h4>Formas Modales — Amplitud Relativa por Masa</h4>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={modeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="masa" />
            <YAxis label={{ value: 'Amplitud norm.', angle: -90, position: 'left' }} domain={[-1.2, 1.2]} />
            <Tooltip />
            <Legend />
            {result.modes.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`Modo ${i + 1}`}
                stroke={colors[i]} strokeWidth={2.5} dot={{ r: 6, fill: colors[i] }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-3" style={{ marginTop: 24 }}>
        {result.modes.map((mode, i) => (
          <div className="card" key={i} style={{ borderTop: `4px solid ${colors[i]}` }}>
            <h4>Modo {i + 1}</h4>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
              ωn = {result.omegas[i]?.toFixed(3)} rad/s
            </p>
            <div className="alt-stat-grid">
              {['m₁', 'm₂', 'm₃'].map((lbl, j) => (
                <div className="alt-stat-row" key={lbl}>
                  <span>{lbl}</span>
                  <span className="alt-val" style={{ color: colors[i] }}>{mode[j].toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Propiedad de Ortogonalidad Modal</h3>
        <div className="equation">φᵢᵀ · M · φⱼ = 0 &nbsp; si i ≠ j &nbsp;&nbsp;&nbsp; φᵢᵀ · K · φⱼ = 0 &nbsp; si i ≠ j</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Esta propiedad permite desacoplar las ecuaciones de movimiento en coordenadas modales,
          transformando el sistema de n EOM acopladas en n EOM independientes de 1 GDL.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   TAB 3 — FRF (FREQUENCY RESPONSE FUNCTION)
============================================================ */
function FRFTab() {
  const [m1, setM1] = useState(2.0)
  const [m2, setM2] = useState(2.0)
  const [m3, setM3] = useState(2.0)
  const [k0, setK0] = useState(1000)
  const [k1, setK1] = useState(800)
  const [k2, setK2] = useState(800)
  const [k3, setK3] = useState(600)
  const [c, setC] = useState(3.0)   // modal damping for all modes

  const frfData = useMemo(() => {
    const result = solveNDOF([m1, m2, m3], [k0, k1, k2, k3])
    const { omegas } = result
    const data = []

    for (let f = 0.05; f <= 30; f += 0.05) {
      const wf = f * 2 * Math.PI
      // FRF of DOF 1 due to force on DOF 1 using modal superposition
      // H11(w) = sum_i [ phi_i1^2 / (-w^2 + 2*j*zeta*wn_i*w + wn_i^2) ]
      let Hr = 0, Hi = 0
      omegas.forEach((wn, i) => {
        if (!result.modes[i]) return
        const phi1 = result.modes[i][0]
        // Modal damping
        const cc = 2 * c * wn
        const Den_r = wn * wn - wf * wf
        const Den_i = cc * wf
        const Den_mag2 = Den_r * Den_r + Den_i * Den_i
        Hr += phi1 * phi1 * Den_r / Den_mag2
        Hi += -phi1 * phi1 * Den_i / Den_mag2
      })
      const mag = Math.sqrt(Hr * Hr + Hi * Hi)
      const magdB = 20 * Math.log10(Math.max(mag, 1e-12))
      data.push({ f: +f.toFixed(2), mag: +mag.toFixed(6), dB: +magdB.toFixed(3) })
    }
    return data
  }, [m1, m2, m3, k0, k1, k2, k3, c])

  const result = useMemo(() => solveNDOF([m1, m2, m3], [k0, k1, k2, k3]), [m1, m2, m3, k0, k1, k2, k3])

  return (
    <div>
      <h2 className="section-title">Funcion de Respuesta en Frecuencia (FRF)</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          {[
            ['m₁', m1, setM1, 0.5, 10, 0.1],
            ['m₂', m2, setM2, 0.5, 10, 0.1],
            ['m₃', m3, setM3, 0.5, 10, 0.1],
            ['k₀', k0, setK0, 100, 5000, 50],
            ['k₁', k1, setK1, 100, 5000, 50],
            ['k₂', k2, setK2, 100, 5000, 50],
            ['k₃', k3, setK3, 100, 5000, 50],
            ['Amort. modal ζ', c, setC, 0.1, 20, 0.1],
          ].map(([lbl, val, set, min, max, step]) => (
            <div className="slider-group" key={lbl}>
              <label>{lbl}: {step < 1 ? val.toFixed(1) : val}</label>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="profile-chart">
          <h4>|H₁₁(f)| — Amplitud</h4>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={frfData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="f" label={{ value: 'f (Hz)', position: 'bottom' }} />
              <YAxis label={{ value: '|H| (m/N)', angle: -90, position: 'left' }} scale="log" domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="mag" stroke="#553c9a" name="|H₁₁|" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>|H₁₁(f)| — Escala dB</h4>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={frfData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="f" label={{ value: 'f (Hz)', position: 'bottom' }} />
              <YAxis label={{ value: 'dB', angle: -90, position: 'left' }} />
              <Tooltip />
              <Line type="monotone" dataKey="dB" stroke="#805ad5" name="dB" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Frecuencias de Resonancia Identificadas</h3>
        <table>
          <thead>
            <tr><th>Modo</th><th>fn (Hz)</th><th>ωn (rad/s)</th><th>Separacion modales</th></tr>
          </thead>
          <tbody>
            {result.omegas.map((wn, i) => (
              <tr key={i}>
                <td>Modo {i + 1}</td>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#553c9a' }}>
                  {(wn / (2 * Math.PI)).toFixed(3)} Hz
                </td>
                <td style={{ fontFamily: 'var(--mono)' }}>{wn.toFixed(3)}</td>
                <td>
                  {i > 0
                    ? `Δf = ${((result.omegas[i] - result.omegas[i - 1]) / (2 * Math.PI)).toFixed(3)} Hz`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>FRF por Superposicion Modal</h3>
        <div className="equation">
          H(ω) = Σᵢ φᵢ·φᵢᵀ / (ωnᵢ² − ω² + 2j·ζᵢ·ωnᵢ·ω)
        </div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Cada modo contribuye un <em>polo</em> complejo en la FRF. Los picos de resonancia
          ocurren cuando ω ≈ ωnᵢ. El ancho de banda a -3dB de cada pico es Δω = 2ζᵢ·ωnᵢ,
          lo que permite estimar el amortiguamiento modal experimentalmente.
        </p>
      </div>
    </div>
  )
}
