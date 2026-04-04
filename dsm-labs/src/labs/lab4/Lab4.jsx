import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/* ================================================================
   LABORATORIO 4: VIBRACIONES MECANICAS
   ================================================================
   Sistema masa-resorte-amortiguador (1 GDL y 2 GDL).
   Objetivo: disenar configuracion que logre transmisibilidad < 0.2
   para frecuencias de forzamiento >= 5 Hz.

   SECCIONES EDITABLES:
   1. PARAMETROS DEL SISTEMA (m, k, c) ............ busca "EDITABLE: PARAMETROS"
   2. MODELO LIBRE AMORTIGUADO .................... busca "EDITABLE: LIBRE"
   3. MODELO FORZADO + TRANSMISIBILIDAD ........... busca "EDITABLE: FORZADO"
   4. SISTEMA 2 GDL (semana 17) ................... busca "EDITABLE: 2GDL"
================================================================ */

export default function Lab4() {
  const [activeTab, setActiveTab] = useState('free')

  return (
    <div className="lab-page">
      <div className="container">
        <div className="lab-header">
          <h1>Lab 4: Vibraciones Mecanicas</h1>
          <p className="lab-subtitle">
            Sistema masa-resorte-amortiguador | Transmisibilidad | Diseno de aislamiento
          </p>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'free' ? 'active' : ''}`}
            onClick={() => setActiveTab('free')}>Vibracion Libre</div>
          <div className={`tab ${activeTab === 'forced' ? 'active' : ''}`}
            onClick={() => setActiveTab('forced')}>Forzado + Transmisibilidad</div>
          <div className={`tab ${activeTab === 'twodof' ? 'active' : ''}`}
            onClick={() => setActiveTab('twodof')}>2 GDL (Serie)</div>
          <div className={`tab ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}>Diseno</div>
        </div>

        {activeTab === 'free' && <FreeVibration />}
        {activeTab === 'forced' && <ForcedVibration />}
        {activeTab === 'twodof' && <TwoDOF />}
        {activeTab === 'design' && <DesignSection />}
      </div>
    </div>
  )
}

/* ================================================================
   VIBRACION LIBRE AMORTIGUADA (1 GDL)
   ================================================================
   mx'' + cx' + kx = 0

   Solucion subamortiguada (zeta < 1):
   x(t) = X0 * e^(-zeta*wn*t) * cos(wd*t - phi)

   wn = sqrt(k/m)         frecuencia natural
   zeta = c / (2*sqrt(km)) factor de amortiguamiento
   wd = wn*sqrt(1-zeta^2) frecuencia amortiguada
================================================================ */
function FreeVibration() {
  /* ===== EDITABLE: PARAMETROS DEL SISTEMA 1 GDL ===== */
  const [mass, setMass] = useState(1.5)       // kg (placa de acero)
  const [stiffness, setStiffness] = useState(500)  // N/m (rigidez del resorte)
  const [damping, setDamping] = useState(2.0)  // N·s/m (amortiguamiento)
  const [x0, setX0] = useState(0.01)          // m (desplazamiento inicial)
  const [v0, setV0] = useState(0)             // m/s (velocidad inicial)

  const simData = useMemo(() => {
    const wn = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
    const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta))
    const tau = 1 / (zeta * wn) // constante de tiempo

    const data = []
    const tMax = 5
    const dt = 0.002
    const numSteps = Math.floor(tMax / dt)

    for (let i = 0; i <= numSteps; i++) {
      const t = i * dt
      let x, v

      /* ===== EDITABLE: MODELO LIBRE =====
         Subamortiguado: x(t) = e^(-zeta*wn*t) * [A*cos(wd*t) + B*sin(wd*t)]
         A = x0
         B = (v0 + zeta*wn*x0) / wd
      */
      if (zeta < 1 && wd > 0) {
        const A = x0
        const B = (v0 + zeta * wn * x0) / wd
        const envelope = Math.exp(-zeta * wn * t)
        x = envelope * (A * Math.cos(wd * t) + B * Math.sin(wd * t))
        v = -zeta * wn * envelope * (A * Math.cos(wd * t) + B * Math.sin(wd * t))
          + envelope * (-A * wd * Math.sin(wd * t) + B * wd * Math.cos(wd * t))
      } else if (zeta >= 1) {
        // Sobreamortiguado o criticamente amortiguado
        const s1 = (-zeta + Math.sqrt(zeta * zeta - 1)) * wn
        const s2 = (-zeta - Math.sqrt(zeta * zeta - 1)) * wn
        const A2 = (v0 - s1 * x0) / (s2 - s1)
        const A1 = x0 - A2
        x = A1 * Math.exp(s1 * t) + A2 * Math.exp(s2 * t)
        v = A1 * s1 * Math.exp(s1 * t) + A2 * s2 * Math.exp(s2 * t)
      } else {
        x = x0
        v = 0
      }

      // Envelope
      const envPos = x0 * Math.exp(-zeta * wn * t)
      const envNeg = -x0 * Math.exp(-zeta * wn * t)

      data.push({
        t: +t.toFixed(4),
        x: +(x * 1000).toFixed(4),       // mm
        v: +v.toFixed(4),                  // m/s
        envPos: +(envPos * 1000).toFixed(4),
        envNeg: +(envNeg * 1000).toFixed(4),
      })
    }

    return { data, wn, wd, zeta, tau }
  }, [mass, stiffness, damping, x0, v0])

  return (
    <div>
      <h2 className="section-title">Vibracion Libre Amortiguada (1 GDL)</h2>

      <div className="controls-panel">
        <h3>Parametros del Sistema</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>Masa m: {mass.toFixed(2)} kg</label>
            <input type="range" min="0.5" max="5" step="0.1" value={mass}
              onChange={e => setMass(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Rigidez k: {stiffness} N/m</label>
            <input type="range" min="50" max="2000" step="10" value={stiffness}
              onChange={e => setStiffness(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Amortiguamiento c: {damping.toFixed(1)} N·s/m</label>
            <input type="range" min="0" max="100" step="0.5" value={damping}
              onChange={e => setDamping(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>x₀: {(x0 * 1000).toFixed(1)} mm</label>
            <input type="range" min="0.001" max="0.05" step="0.001" value={x0}
              onChange={e => setX0(+e.target.value)} />
          </div>
        </div>
      </div>

      {/* Parametros calculados */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3>Parametros Calculados</h3>
          <table>
            <tbody>
              <tr><td><strong>ωn (frec. natural)</strong></td><td>{simData.wn.toFixed(3)} rad/s</td><td>{(simData.wn / (2 * Math.PI)).toFixed(3)} Hz</td></tr>
              <tr><td><strong>ζ (amortiguamiento)</strong></td><td>{simData.zeta.toFixed(4)}</td>
                <td style={{ color: simData.zeta < 1 ? '#38a169' : simData.zeta === 1 ? '#ed8936' : '#e53e3e' }}>
                  {simData.zeta < 1 ? 'Subamortiguado' : simData.zeta === 1 ? 'Critico' : 'Sobreamortiguado'}
                </td>
              </tr>
              <tr><td><strong>ωd (frec. amortiguada)</strong></td><td>{simData.wd.toFixed(3)} rad/s</td><td>{(simData.wd / (2 * Math.PI)).toFixed(3)} Hz</td></tr>
              <tr><td><strong>τ (cte. tiempo)</strong></td><td>{simData.tau.toFixed(4)} s</td><td></td></tr>
              <tr><td><strong>Td (periodo amortiguado)</strong></td><td>{simData.wd > 0 ? (2 * Math.PI / simData.wd).toFixed(4) : '∞'} s</td><td></td></tr>
              <tr><td><strong>c_critico</strong></td><td>{(2 * Math.sqrt(stiffness * mass)).toFixed(2)} N·s/m</td><td></td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Ecuacion del Movimiento</h3>
          <div className="editable-section">
            <p><strong>EOM:</strong> m·x'' + c·x' + k·x = 0</p>
            <p><strong>Forma estandar:</strong> x'' + 2ζωn·x' + ωn²·x = 0</p>
            <p style={{ marginTop: 8 }}><strong>Solucion (subamortiguado):</strong></p>
            <p>x(t) = e^(-ζωn·t) · [A·cos(ωd·t) + B·sin(ωd·t)]</p>
            <p>A = x₀, B = (v₀ + ζωn·x₀) / ωd</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="profile-chart">
          <h4>Posicion x(t) [mm]</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={simData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'x (mm)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="x" stroke="#2b6cb0" name="x(t)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="envPos" stroke="#e53e3e" name="Envolvente +" dot={false} strokeWidth={1} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="envNeg" stroke="#e53e3e" name="Envolvente -" dot={false} strokeWidth={1} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Velocidad v(t) [m/s]</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={simData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'v (m/s)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Line type="monotone" dataKey="v" stroke="#38a169" name="v(t)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   VIBRACION FORZADA + TRANSMISIBILIDAD
   ================================================================
   mx'' + cx' + kx = F0*sin(wf*t)  o  base excitation: y(t) = Y*sin(wf*t)

   Transmisibilidad de desplazamiento:
   TR = sqrt[(1 + (2*zeta*r)^2) / ((1 - r^2)^2 + (2*zeta*r)^2)]
   r = wf / wn
================================================================ */
function ForcedVibration() {
  const [mass, setMass] = useState(1.5)
  const [stiffness, setStiffness] = useState(500)
  const [damping, setDamping] = useState(2.0)
  const [amplitude, setAmplitude] = useState(0.01) // m input amplitude
  const [freqForcing, setFreqForcing] = useState(5.0) // Hz

  const trData = useMemo(() => {
    const wn = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
    const fn = wn / (2 * Math.PI)

    /* ===== EDITABLE: TRANSMISIBILIDAD =====
       TR(r) = sqrt[(1 + (2ζr)²) / ((1-r²)² + (2ζr)²)]
       r = f/fn = wf/wn
    */
    const curve = []
    for (let f = 0.1; f <= 20; f += 0.1) {
      const r = f / fn
      const num = 1 + (2 * zeta * r) ** 2
      const den = (1 - r * r) ** 2 + (2 * zeta * r) ** 2
      const TR = Math.sqrt(num / den)
      curve.push({
        f: +f.toFixed(1),
        TR: +TR.toFixed(4),
        limit: 0.2,
      })
    }

    // Transmisibilidad en la frecuencia de forzamiento
    const rTarget = freqForcing / fn
    const numT = 1 + (2 * zeta * rTarget) ** 2
    const denT = (1 - rTarget * rTarget) ** 2 + (2 * zeta * rTarget) ** 2
    const TRatTarget = Math.sqrt(numT / denT)

    // Time response
    const wf = freqForcing * 2 * Math.PI
    const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta))
    const timeData = []
    const dt = 0.001
    for (let i = 0; i <= 5000; i++) {
      const t = i * dt
      // Steady-state particular solution for base excitation
      const r = wf / wn
      const X = amplitude * Math.sqrt((1 + (2 * zeta * r) ** 2) / ((1 - r * r) ** 2 + (2 * zeta * r) ** 2))
      const phi = Math.atan2(2 * zeta * r * r * r, 1 + (4 * zeta * zeta - 1) * r * r)
      const xInput = amplitude * Math.sin(wf * t)
      const xOutput = X * Math.sin(wf * t - phi)
      timeData.push({
        t: +t.toFixed(4),
        input: +(xInput * 1000).toFixed(4),
        output: +(xOutput * 1000).toFixed(4),
      })
    }

    return { curve, TRatTarget, fn, zeta, wn, timeData }
  }, [mass, stiffness, damping, amplitude, freqForcing])

  return (
    <div>
      <h2 className="section-title">Vibracion Forzada + Transmisibilidad</h2>

      <div className="controls-panel">
        <h3>Parametros</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>m: {mass.toFixed(2)} kg</label>
            <input type="range" min="0.5" max="5" step="0.1" value={mass}
              onChange={e => setMass(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>k: {stiffness} N/m</label>
            <input type="range" min="50" max="3000" step="10" value={stiffness}
              onChange={e => setStiffness(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>c: {damping.toFixed(1)} N·s/m</label>
            <input type="range" min="0" max="100" step="0.5" value={damping}
              onChange={e => setDamping(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>f_forzamiento: {freqForcing.toFixed(1)} Hz</label>
            <input type="range" min="1" max="15" step="0.1" value={freqForcing}
              onChange={e => setFreqForcing(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>Amplitud entrada: {(amplitude * 1000).toFixed(1)} mm</label>
            <input type="range" min="0.001" max="0.05" step="0.001" value={amplitude}
              onChange={e => setAmplitude(+e.target.value)} />
          </div>
        </div>
      </div>

      {/* TR at target */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <h3>Transmisibilidad a {freqForcing.toFixed(1)} Hz</h3>
        <div style={{
          fontSize: 48, fontWeight: 700,
          color: trData.TRatTarget <= 0.2 ? '#38a169' : '#e53e3e',
          margin: '12px 0'
        }}>
          TR = {trData.TRatTarget.toFixed(4)}
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: trData.TRatTarget <= 0.2 ? '#38a169' : '#e53e3e' }}>
          {trData.TRatTarget <= 0.2 ? 'CUMPLE (TR <= 0.2)' : 'NO CUMPLE (TR > 0.2)'}
        </p>
        <p style={{ fontSize: 13, color: '#718096' }}>
          fn = {trData.fn.toFixed(2)} Hz | ζ = {trData.zeta.toFixed(4)} | r = {(freqForcing / trData.fn).toFixed(3)}
        </p>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Curva de Transmisibilidad TR vs Frecuencia</h4>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trData.curve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="f" label={{ value: 'f (Hz)', position: 'bottom' }} />
              <YAxis label={{ value: 'TR', angle: -90, position: 'left' }} domain={[0, 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="TR" stroke="#2b6cb0" name="TR(f)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="limit" stroke="#e53e3e" name="Limite 0.2" dot={false} strokeWidth={1} strokeDasharray="8 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Respuesta temporal (estado estable)</h4>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trData.timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'x (mm)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="input" stroke="#ed8936" name="Entrada (base)" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="output" stroke="#2b6cb0" name="Salida (masa)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Ecuaciones de Transmisibilidad</h3>
        <p><strong>Excitacion de base:</strong> y(t) = Y·sin(ωf·t)</p>
        <p><strong>Ratio de frecuencia:</strong> r = ωf / ωn = f / fn</p>
        <p><strong>Transmisibilidad:</strong> TR = √[(1 + (2ζr)²) / ((1-r²)² + (2ζr)²)]</p>
        <p style={{ marginTop: 8 }}><strong>Para TR &lt; 0.2:</strong> Se necesita r &gt; √2 (zona de aislamiento) y el amortiguamiento apropiado.</p>
      </div>
    </div>
  )
}

/* ================================================================
   SISTEMA 2 GDL EN SERIE (semana 17)
   ================================================================
   [m1]-[k1,c1]-[m2]-[k2,c2]-[base]

   m1·x1'' + c1·(x1'-x2') + k1·(x1-x2) = 0
   m2·x2'' - c1·(x1'-x2') - k1·(x1-x2) + k2·x2 + c2·x2' = F(t)
================================================================ */
function TwoDOF() {
  /* ===== EDITABLE: 2GDL PARAMETROS ===== */
  const [m1, setM1] = useState(1.5)
  const [k1, setK1] = useState(500)
  const [m2] = useState(0.8)    // fijo por la guia
  const [k2] = useState(300)    // fijo por la guia
  const [c1, setC1] = useState(2.0)
  const [c2] = useState(1.0)    // fijo

  const trData2 = useMemo(() => {
    const curve = []

    for (let f = 0.1; f <= 20; f += 0.1) {
      const w = f * 2 * Math.PI

      // Impedance method for 2DOF
      // Z1 = -m1*w^2 + j*c1*w + k1
      // Z2 = -m2*w^2 + j*(c1+c2)*w + (k1+k2)
      // Transfer function from base to m1

      // Simplified: compute eigenvalues and transmissibility numerically
      const w2 = w * w

      // [K - w²M + jwC] * X = F
      // For base excitation, use the full matrix approach
      // Here we use the magnitude response approach

      const K11 = k1
      const K12 = -k1
      const K21 = -k1
      const K22 = k1 + k2

      const M11 = m1
      const M22 = m2

      const C11 = c1
      const C12 = -c1
      const C21 = -c1
      const C22 = c1 + c2

      // Dynamic stiffness matrix: D = K - w²M + jwC
      // D11 = K11 - w²M11 + jw*C11
      // D12 = K12 + jw*C12
      // D21 = K21 + jw*C21
      // D22 = K22 - w²M22 + jw*C22

      const D11r = K11 - w2 * M11
      const D11i = w * C11
      const D12r = K12
      const D12i = w * C12
      const D21r = K21
      const D21i = w * C21
      const D22r = K22 - w2 * M22
      const D22i = w * C22

      // det(D) = D11*D22 - D12*D21
      const detR = D11r * D22r - D11i * D22i - (D12r * D21r - D12i * D21i)
      const detI = D11r * D22i + D11i * D22r - (D12r * D21i + D12i * D21r)
      const detMag2 = detR * detR + detI * detI

      if (detMag2 < 1e-20) {
        curve.push({ f: +f.toFixed(1), TR1: 10, TR2: 10, limit: 0.2 })
        continue
      }

      // Force vector for base excitation: F = [0, k2 + jw*c2] * Y
      const Fr2 = k2
      const Fi2 = w * c2

      // X1 = (D22*F2 - D12*F2_component) / det(D) -- using Cramer's rule
      // X1 = (-D12 * F2) / det(D) for the force on mass 2
      const X1r = -(D12r * Fr2 - D12i * Fi2)
      const X1i = -(D12r * Fi2 + D12i * Fr2)
      const X1mag = Math.sqrt(X1r * X1r + X1i * X1i) / Math.sqrt(detMag2)

      // X2 = (D11 * F2) / det(D)
      const X2r = D11r * Fr2 - D11i * Fi2
      const X2i = D11r * Fi2 + D11i * Fr2
      const X2mag = Math.sqrt(X2r * X2r + X2i * X2i) / Math.sqrt(detMag2)

      // TR = |Xi| / Y, where F = (k2 + jw*c2)*Y, so |F|/Y = sqrt(k2² + (w*c2)²)
      // But Xi already includes the F scaling, so TR_i = |Xi|
      // Actually: X = D^{-1} * F, and F = [0; k2+jwc2]*Y
      // So X/Y = D^{-1} * [0; k2+jwc2]
      // TR1 = |X1/Y|, TR2 = |X2/Y|

      curve.push({
        f: +f.toFixed(1),
        TR1: +X1mag.toFixed(4),
        TR2: +X2mag.toFixed(4),
        limit: 0.2,
      })
    }

    return curve
  }, [m1, k1, m2, k2, c1, c2])

  return (
    <div>
      <h2 className="section-title">Sistema 2 GDL en Serie (Semana 17)</h2>

      <div className="info-box">
        <strong>Condicion:</strong> m₂ y k₂ son FIJOS. Solo puedes cambiar m₁ y k₁ para lograr
        TR &lt; 0.2 en todos los modos de vibracion para f ≥ 5 Hz.
      </div>

      <div className="controls-panel">
        <h3>Parametros Editables</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>m₁ (disenador): {m1.toFixed(2)} kg</label>
            <input type="range" min="0.3" max="5" step="0.1" value={m1}
              onChange={e => setM1(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>k₁ (disenador): {k1} N/m</label>
            <input type="range" min="50" max="3000" step="10" value={k1}
              onChange={e => setK1(+e.target.value)} />
          </div>
          <div className="slider-group">
            <label>c₁: {c1.toFixed(1)} N·s/m</label>
            <input type="range" min="0" max="50" step="0.5" value={c1}
              onChange={e => setC1(+e.target.value)} />
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 8 }}>
          Fijos: m₂ = {m2} kg | k₂ = {k2} N/m | c₂ = {c2} N·s/m
        </p>
      </div>

      <div className="profile-chart">
        <h4>Transmisibilidad 2 GDL (ambas masas)</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trData2}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="f" label={{ value: 'f (Hz)', position: 'bottom' }} />
            <YAxis label={{ value: 'TR', angle: -90, position: 'left' }} domain={[0, 'auto']} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="TR1" stroke="#2b6cb0" name="TR masa 1" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="TR2" stroke="#38a169" name="TR masa 2" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="limit" stroke="#e53e3e" name="Limite 0.2" dot={false} strokeWidth={1} strokeDasharray="8 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Ecuaciones 2 GDL</h3>
        <p><strong>Masa 1:</strong> m₁·x₁'' + c₁·(x₁' - x₂') + k₁·(x₁ - x₂) = 0</p>
        <p><strong>Masa 2:</strong> m₂·x₂'' - c₁·(x₁' - x₂') - k₁·(x₁ - x₂) + c₂·x₂' + k₂·x₂ = k₂·y + c₂·y'</p>
        <p style={{ marginTop: 8 }}>Donde y(t) = Y·sin(ωf·t) es la excitacion de la base (mesa de vibraciones).</p>
      </div>
    </div>
  )
}

/* ===== SECCION DE DISENO ===== */
function DesignSection() {
  return (
    <div>
      <h2 className="section-title">Guia de Diseno</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Objetivo de Diseno</h3>
        <div style={{ background: '#f0fff4', padding: 16, borderRadius: 8, border: '1px solid #c6f6d5' }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2f855a' }}>
            TR ≤ 0.2 para f ≥ 5 Hz (amplitud de entrada = 0.01 m)
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Insumos Disponibles</h3>
        <table>
          <thead>
            <tr><th>Insumo</th><th>Especificaciones</th><th>Cantidad</th></tr>
          </thead>
          <tbody>
            <tr><td>Resorte Rigidez 1</td><td>Caracterizar experimentalmente</td><td>8</td></tr>
            <tr><td>Resorte Rigidez 2</td><td>Caracterizar experimentalmente</td><td>8</td></tr>
            <tr><td>Resorte Rigidez 3</td><td>Caracterizar experimentalmente</td><td>8</td></tr>
            <tr><td>Placa acero (12mm)</td><td>180 × 180 × 12 mm</td><td>4</td></tr>
            <tr><td>Placa acero (10mm)</td><td>180 × 180 × 10 mm</td><td>4</td></tr>
            <tr><td>Placa acero (7mm)</td><td>180 × 180 × 7 mm</td><td>4</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Estrategia de Diseno</h3>
          <ol style={{ marginLeft: 20, fontSize: 14 }}>
            <li>Caracterizar rigidez de resortes (Hooke + incertidumbre)</li>
            <li>Pesar placas para conocer masas</li>
            <li>Calcular fn para cada combinacion</li>
            <li>Verificar que r = f_forzamiento / fn {'>'} √2</li>
            <li>Verificar que peso total no exceda limite elastico</li>
            <li>Proponer 3 configuraciones candidatas</li>
          </ol>
        </div>

        <div className="card">
          <h3>Criterios de Calificacion</h3>
          <table>
            <thead>
              <tr><th>Entregable</th><th>Peso</th></tr>
            </thead>
            <tbody>
              <tr><td>Quiz verificacion</td><td>15%</td></tr>
              <tr><td>PDF Prelaboratorio</td><td>30%</td></tr>
              <tr><td>PDF Laboratorio</td><td>35%</td></tr>
              <tr><td>Videos (YouTube)</td><td>5%</td></tr>
              <tr><td>Programa Python</td><td>15%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="warning-box" style={{ marginTop: 24 }}>
        <strong>Semana 17:</strong> Si se entrega en semana 17, el sistema cambia a 2 GDL en serie.
        m₂ y k₂ son fijos; solo se disenan m₁ y k₁. Use la pestana "2 GDL" para simular.
      </div>
    </div>
  )
}
