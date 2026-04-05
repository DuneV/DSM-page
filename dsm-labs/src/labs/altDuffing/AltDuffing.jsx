import { useState, useRef, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

/* ============================================================
   DUFFING OSCILLATOR
   ẍ + δẋ + αx + βx³ = γcos(ωt)
   State: [x, v, t]  →  dx/dt = v,  dv/dt = f(x,v,t)
============================================================ */
function rk4Duffing(x, v, t, dt, delta, alpha, beta, gamma, omega) {
  const f = (xi, vi, ti) => -delta * vi - alpha * xi - beta * xi ** 3 + gamma * Math.cos(omega * ti)
  const k1x = v,              k1v = f(x, v, t)
  const k2x = v + k1v * dt/2, k2v = f(x + k1x*dt/2, v + k1v*dt/2, t + dt/2)
  const k3x = v + k2v * dt/2, k3v = f(x + k2x*dt/2, v + k2v*dt/2, t + dt/2)
  const k4x = v + k3v * dt,   k4v = f(x + k3x*dt, v + k3v*dt, t + dt)
  return {
    x: x + (dt/6)*(k1x+2*k2x+2*k3x+k4x),
    v: v + (dt/6)*(k1v+2*k2v+2*k3v+k4v),
  }
}

export default function AltDuffing() {
  const [activeTab, setActiveTab] = useState('sim')

  return (
    <div className="lab-page alt-lab">
      <div className="container">
        <div className="alt-lab-header" style={{ background: 'linear-gradient(135deg, #3d1a00 0%, #975a16 100%)' }}>
          <span className="alt-lab-topic-tag" style={{ background: '#fefcbf', color: '#744210' }}>Energias</span>
          <h1>Oscilador de Duffing</h1>
          <p className="lab-subtitle">Oscilador no lineal · Caos deterministico · Bifurcaciones</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>El Oscilador de Duffing</h3>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            El <strong>oscilador de Duffing</strong> agrega un termino cubico (βx³) a la rigidez de un
            oscilador armonico, modelando sistemas con <em>rigidez no lineal</em> (resortes endurecedores
            o suavizadores). Bajo ciertos parametros exhibe <strong>caos deterministico</strong>:
            trayectorias sensitivas a condiciones iniciales, a pesar de ser un sistema completamente
            deterministico. El potencial de pozo doble (α &lt; 0) tiene dos posiciones de equilibrio
            estables en x = ±1.
          </p>
          <div className="grid-3" style={{ marginTop: 14 }}>
            {[['Pozo doble', 'α < 0, β > 0'], ['Hard spring', 'α > 0, β > 0'], ['Caos', 'γ grande']].map(([l, v]) => (
              <div className="alt-stat-box" key={l} style={{ background: '#fffbeb' }}>
                <span className="alt-stat-label">{l}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: '#92400e' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabs">
          {[['sim', 'Simulacion'], ['phase', 'Diagrama de Fase'], ['freq', 'Respuesta en Frecuencia']].map(([k, lbl]) => (
            <div key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{lbl}</div>
          ))}
        </div>

        {activeTab === 'sim' && <DuffingSim />}
        {activeTab === 'phase' && <DuffingPhase />}
        {activeTab === 'freq' && <DuffingFreq />}
      </div>
    </div>
  )
}

function DuffingSim() {
  const [delta, setDelta] = useState(0.2)
  const [alpha, setAlpha] = useState(-1)
  const [beta, setBeta] = useState(1)
  const [gamma, setGamma] = useState(0.3)
  const [omega, setOmega] = useState(1.2)
  const [x0, setX0] = useState(1)
  const [playing, setPlaying] = useState(true)

  const stateRef = useRef({ x: 1, v: 0, t: 0 })
  const pRef = useRef({})
  const animRef = useRef(null)
  const lastRef = useRef(null)
  const bufRef = useRef([])
  const [tData, setTData] = useState([])

  useEffect(() => { pRef.current = { delta, alpha, beta, gamma, omega, playing } }, [delta, alpha, beta, gamma, omega, playing])

  const reset = () => { stateRef.current = { x: x0, v: 0, t: 0 }; bufRef.current = []; lastRef.current = null; setTData([]) }
  useEffect(() => { reset() }, [x0, delta, alpha, beta, gamma, omega]) // eslint-disable-line

  useEffect(() => {
    const canvas = document.getElementById('duffing-canvas')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    function frame(time) {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 1000, 0.04)
      lastRef.current = time
      const { delta, alpha, beta, gamma, omega, playing } = pRef.current

      if (playing && dt > 0) {
        for (let i = 0; i < 10; i++) {
          const s = rk4Duffing(stateRef.current.x, stateRef.current.v, stateRef.current.t, dt/10, delta, alpha, beta, gamma, omega)
          stateRef.current = { x: s.x, v: s.v, t: stateRef.current.t + dt/10 }
        }
        bufRef.current.push({ t: +stateRef.current.t.toFixed(3), x: +stateRef.current.x.toFixed(4), v: +stateRef.current.v.toFixed(4) })
        if (bufRef.current.length > 3000) bufRef.current.shift()
        if (bufRef.current.length % 8 === 0) setTData([...bufRef.current])
      }

      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#fffbeb'); bg.addColorStop(1, '#fef3c7')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

      // Draw potential V(x) = -α/2 x² + β/4 x⁴
      const cx = W/2, cy = H*0.65, scaleX = W*0.22, scaleV = H*0.18
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.beginPath()
      let first = true
      for (let xi = -2.5; xi <= 2.5; xi += 0.04) {
        const V = -alpha/2*xi*xi + beta/4*xi*xi*xi*xi
        const px = cx + xi*scaleX, py = cy - V*scaleV
        if (py < 0 || py > H) { first = true; continue }
        if (first) { ctx.moveTo(px, py); first = false } else ctx.lineTo(px, py)
      }
      ctx.stroke()

      // Axis
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx - W*0.46, cy); ctx.lineTo(cx + W*0.46, cy); ctx.stroke()
      ctx.font = '11px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText('V(x)', cx - W*0.44, cy - 8)
      ctx.fillText('x', cx + W*0.43, cy + 14)

      // Equilibria
      const xeq = Math.sqrt(Math.max(0, -alpha/beta))
      if (xeq > 0.01) {
        ;[-xeq, xeq].forEach(xe => {
          ctx.fillStyle = '#276749'
          ctx.beginPath(); ctx.arc(cx + xe*scaleX, cy - (-alpha/2*xe*xe + beta/4*xe*xe*xe*xe)*scaleV, 5, 0, 2*Math.PI); ctx.fill()
        })
      }

      // Current position ball
      const { x } = stateRef.current
      const V = -alpha/2*x*x + beta/4*x*x*x*x
      const bx = cx + x*scaleX, by = cy - V*scaleV
      ctx.fillStyle = '#c05621'
      ctx.shadowColor = 'rgba(192,86,33,0.4)'; ctx.shadowBlur = 12
      ctx.beginPath(); ctx.arc(Math.max(10, Math.min(W-10, bx)), Math.max(10, Math.min(H-10, by)), 10, 0, 2*Math.PI); ctx.fill()
      ctx.shadowBlur = 0

      // Info
      ctx.font = '12px Inter'; ctx.fillStyle = '#92400e'
      ctx.fillText(`x = ${stateRef.current.x.toFixed(3)}`, 10, 20)
      ctx.fillText(`v = ${stateRef.current.v.toFixed(3)}`, 10, 36)
      ctx.fillText(`t = ${stateRef.current.t.toFixed(2)}`, 10, 52)

      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // eslint-disable-line

  return (
    <div>
      <h2 className="section-title">Simulacion del Oscilador de Duffing</h2>
      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        {[
          ['δ (amort.)', delta, setDelta, 0, 1, 0.02],
          ['α (rigidez lineal)', alpha, setAlpha, -2, 2, 0.1],
          ['β (rigidez cubica)', beta, setBeta, 0.1, 3, 0.1],
          ['γ (amplitud fuerza)', gamma, setGamma, 0, 1, 0.02],
          ['ω (frec. forzamiento)', omega, setOmega, 0.5, 3, 0.05],
          ['x₀ (pos. inicial)', x0, setX0, -2, 2, 0.1],
        ].map(([lbl, val, set, mn, mx, step]) => (
          <div className="slider-group" key={lbl}>
            <label>{lbl}: {val.toFixed(2)}</label>
            <input type="range" min={mn} max={mx} step={step} value={val} onChange={e => set(+e.target.value)} />
          </div>
        ))}
      </div>
        <button className="btn btn-outline" style={{ marginTop: 8, marginRight: 8 }} onClick={() => setPlaying(p => !p)}>{playing ? 'Pausar' : 'Reanudar'}</button>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={reset}>Reiniciar</button>
      </div>
      <div className="viz-container">
        <div className="viz-panel">
          <h3>Potencial V(x) — posicion del oscilador</h3>
          <canvas id="duffing-canvas" width={440} height={300} style={{ maxWidth: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
        </div>
        <div className="viz-panel">
          <h3>x(t)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tData.slice(-500)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't', position: 'bottom' }} />
              <YAxis /><Tooltip />
              <Line type="monotone" dataKey="x" stroke="#975a16" name="x(t)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="editable-section" style={{ marginTop: 16 }}>
        <h3>Ecuacion de Duffing</h3>
        <div className="equation">ẍ + δẋ + αx + βx³ = γcos(ωt)</div>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Para α = −1, β = 1: potencial de doble pozo con equilibrios en x = ±1.
          Aumentar γ puede inducir saltos entre pozos y eventualmente caos.
        </p>
      </div>
    </div>
  )
}

function DuffingPhase() {
  const [delta, setDelta] = useState(0.15)
  const [gamma, setGamma] = useState(0.3)
  const [omega, setOmega] = useState(1.2)

  const phaseData = useMemo(() => {
    const pts = []
    let x = 1, v = 0, t = 0
    const dt = 0.005
    for (let i = 0; i < 20000; i++) {
      const s = rk4Duffing(x, v, t, dt, delta, -1, 1, gamma, omega)
      x = s.x; v = s.v; t += dt
      if (i > 2000 && i % 3 === 0) pts.push({ x: +x.toFixed(3), y: +v.toFixed(3) })
    }
    return pts
  }, [delta, gamma, omega])

  return (
    <div>
      <h2 className="section-title">Diagrama de Fase — Atractor de Duffing</h2>
      <div className="controls-panel"><h3>Parametros (α=−1, β=1 fijos)</h3><div className="controls-row">
        {[['δ', delta, setDelta, 0, 0.5, 0.01], ['γ', gamma, setGamma, 0, 0.8, 0.01], ['ω', omega, setOmega, 0.5, 2.5, 0.05]].map(([l, v, s, mn, mx, step]) => (
          <div className="slider-group" key={l}><label>{l}: {v.toFixed(2)}</label><input type="range" min={mn} max={mx} step={step} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div></div>
      <div className="profile-chart">
        <h4>Atractor en el espacio de fase (x, ẋ) — estado estacionario</h4>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" name="x" label={{ value: 'x', position: 'bottom' }} domain={['auto', 'auto']} />
            <YAxis dataKey="y" type="number" name="ẋ" label={{ value: 'ẋ', angle: -90, position: 'left' }} domain={['auto', 'auto']} />
            <Tooltip />
            <Scatter data={phaseData} fill="#975a16" opacity={0.5} name="(x, ẋ)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="info-box" style={{ marginTop: 12 }}>
        Aumenta γ para observar la transicion de orbita periodica → cuasi-periodica → caotica (atractor extrano).
      </div>
    </div>
  )
}

function DuffingFreq() {
  const [delta, setDelta] = useState(0.1)
  const [beta, setBeta] = useState(0.04)

  const freqData = useMemo(() => {
    const data = []
    for (let r = 0.3; r <= 2.5; r += 0.02) {
      // Approximate amplitude via harmonic balance for soft Duffing
      // a² * [(1 - r² + 3β/4 * a²)² + (δr)²] = γ²  (implicit, solve for a)
      const gamma = 0.3
      // Newton iteration for steady-state amplitude
      let a = 0.5
      for (let iter = 0; iter < 50; iter++) {
        const F = a * a * ((1 - r * r + 3 * beta / 4 * a * a) ** 2 + (delta * r) ** 2) - gamma * gamma
        const dF = 2 * a * ((1 - r * r + 3 * beta / 4 * a * a) ** 2 + (delta * r) ** 2) + a * a * 2 * (1 - r * r + 3 * beta / 4 * a * a) * (3 * beta / 2 * a)
        if (Math.abs(dF) < 1e-12) break
        a -= F / dF
        if (a < 0) a = 0.01
      }
      data.push({ r: +r.toFixed(2), a: +Math.abs(a).toFixed(4), linear: +(1 / Math.sqrt((1 - r * r) ** 2 + (delta * r) ** 2)).toFixed(4) })
    }
    return data
  }, [delta, beta])

  return (
    <div>
      <h2 className="section-title">Curva de Respuesta en Frecuencia — Salto de Duffing</h2>
      <div className="controls-panel"><h3>Parametros</h3><div className="controls-row">
        {[['δ', delta, setDelta, 0.01, 0.5, 0.01], ['β (no linealidad)', beta, setBeta, -0.1, 0.2, 0.005]].map(([l, v, s, mn, mx, step]) => (
          <div className="slider-group" key={l}><label>{l}: {v.toFixed(3)}</label><input type="range" min={mn} max={mx} step={step} value={v} onChange={e => s(+e.target.value)} /></div>
        ))}
      </div></div>
      <div className="profile-chart">
        <h4>Amplitud A vs r = ω/ωn (Balance Armonico)</h4>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={freqData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="r" label={{ value: 'r = ω/ωn', position: 'bottom' }} />
            <YAxis label={{ value: 'Amplitud A', angle: -90, position: 'left' }} domain={[0, 'auto']} />
            <Tooltip /><Legend />
            <Line type="monotone" dataKey="a" stroke="#975a16" name="Duffing (no lineal)" dot={false} strokeWidth={2.5} />
            <Line type="monotone" dataKey="linear" stroke="#2b6cb0" name="Lineal" dot={false} strokeWidth={1.5} strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="info-box" style={{ marginTop: 12 }}>
        <strong>Fenomeno de salto:</strong> Para β {'>'} 0 (hard spring) la resonancia se dobla hacia la derecha.
        El sistema puede saltar abruptamente entre dos amplitudes al barrer la frecuencia.
        Este es el sello del oscilador de Duffing.
      </div>
    </div>
  )
}
