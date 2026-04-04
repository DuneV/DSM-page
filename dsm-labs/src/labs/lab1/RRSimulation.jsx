import { useState, useRef, useEffect, useMemo } from 'react'
import ProfileCharts from './ProfileCharts'

/* ================================================================
   SIMULACION INTERACTIVA DEL ROBOT RR (SCARA 2D)

   ESTRUCTURA DEL MODELO:
   ----------------------
   El robot tiene dos eslabones (links) con longitudes L1 y L2.
   - Origen O en (0, 0) - base del robot
   - Nodo A (codo) = extremo del link 1
   - Nodo B (efector) = extremo del link 2

   SECCIONES EDITABLES (busca "EDITABLE" en este archivo):
   1. PARAMETROS DEL ROBOT (L1, L2) .................. linea ~30
   2. CINEMATICA DIRECTA (FK) ........................ linea ~70
   3. CINEMATICA INVERSA (IK) ........................ linea ~90
   4. JACOBIANO ...................................... linea ~120
   5. GENERACION DE TRAYECTORIA ...................... linea ~150
   6. PERFILES DE VELOCIDAD .......................... linea ~200
   7. PERFILES DE ACELERACION ........................ linea ~220
   ================================================================ */

export default function RRSimulation() {
  /* ===== EDITABLE: PARAMETROS DEL ROBOT =====
     Cambia L1, L2 para modificar las longitudes de los eslabones.
     Estas longitudes determinan el espacio de trabajo del robot.
     Espacio alcanzable: |L1 - L2| <= r <= L1 + L2
  */
  const [L1, setL1] = useState(1.0)   // Longitud del primer eslabon (link OA)
  const [L2, setL2] = useState(0.8)   // Longitud del segundo eslabon (link AB)

  /* ===== EDITABLE: PARAMETROS DE TRAYECTORIA =====
     - shape: tipo de figura ('circle', 'square', 'triangle', 'hexagon')
     - cx, cy: centro de la trayectoria
     - radius: tamaño de la figura
     - numPoints: numero de puntos para discretizar la trayectoria
     - totalTime: tiempo total del recorrido (segundos)
  */
  const [shape, setShape] = useState('circle')
  const [cx, setCx] = useState(1.2)
  const [cy, setCy] = useState(0.0)
  const [radius, setRadius] = useState(0.3)
  const [numPoints, setNumPoints] = useState(100)
  const [totalTime, setTotalTime] = useState(2.0)

  const [animating, setAnimating] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const animRef = useRef(null)
  const canvasRef = useRef(null)

  /* ================================================================
     EDITABLE: CINEMATICA DIRECTA (Forward Kinematics)
     ================================================================
     Dado theta1, theta2, calcula las posiciones de A y B.

     Nodo A (codo):
       Ax = L1 * cos(theta1)
       Ay = L1 * sin(theta1)

     Nodo B (efector final):
       Bx = L1 * cos(theta1) + L2 * cos(theta1 + theta2)
       By = L1 * sin(theta1) + L2 * sin(theta1 + theta2)
  */
  function forwardKinematics(theta1, theta2) {
    const Ax = L1 * Math.cos(theta1)
    const Ay = L1 * Math.sin(theta1)
    const Bx = Ax + L2 * Math.cos(theta1 + theta2)
    const By = Ay + L2 * Math.sin(theta1 + theta2)
    return { Ax, Ay, Bx, By }
  }

  /* ================================================================
     EDITABLE: CINEMATICA INVERSA (Inverse Kinematics)
     ================================================================
     Dado un punto (x, y) objetivo, calcula theta1 y theta2.
     Usa la solucion geometrica cerrada (codo arriba).

     cos(theta2) = (x² + y² - L1² - L2²) / (2 * L1 * L2)
     theta2 = atan2(+sqrt(1 - cos²(theta2)), cos(theta2))  <- codo arriba

     theta1 = atan2(y, x) - atan2(L2*sin(theta2), L1 + L2*cos(theta2))

     Para codo abajo, cambia el signo del sqrt en theta2.
  */
  function inverseKinematics(x, y) {
    const d2 = x * x + y * y
    const cosTheta2 = (d2 - L1 * L1 - L2 * L2) / (2 * L1 * L2)

    // Verificar alcanzabilidad
    if (Math.abs(cosTheta2) > 1) return null

    // Codo arriba (cambiar signo para codo abajo)
    const sinTheta2 = Math.sqrt(1 - cosTheta2 * cosTheta2)
    const theta2 = Math.atan2(sinTheta2, cosTheta2)

    const k1 = L1 + L2 * cosTheta2
    const k2 = L2 * sinTheta2
    const theta1 = Math.atan2(y, x) - Math.atan2(k2, k1)

    return { theta1, theta2 }
  }

  /* ================================================================
     EDITABLE: JACOBIANO DEL ROBOT RR
     ================================================================
     El Jacobiano relaciona velocidades articulares con velocidades
     cartesianas del efector final:

     J = | -L1*sin(θ1) - L2*sin(θ1+θ2)   -L2*sin(θ1+θ2) |
         |  L1*cos(θ1) + L2*cos(θ1+θ2)    L2*cos(θ1+θ2)  |

     [vx]       [dθ1/dt]
     [vy] = J * [dθ2/dt]

     det(J) = L1 * L2 * sin(θ2)  <- singularidad cuando θ2 = 0 o π
  */
  function jacobian(theta1, theta2) {
    const s1 = Math.sin(theta1)
    const c1 = Math.cos(theta1)
    const s12 = Math.sin(theta1 + theta2)
    const c12 = Math.cos(theta1 + theta2)

    return {
      J11: -L1 * s1 - L2 * s12,
      J12: -L2 * s12,
      J21: L1 * c1 + L2 * c12,
      J22: L2 * c12,
      det: L1 * L2 * Math.sin(theta2)
    }
  }

  /* ================================================================
     EDITABLE: GENERACION DE TRAYECTORIA
     ================================================================
     Genera los puntos (x, y) de la trayectoria segun la forma elegida.
     Puedes agregar nuevas formas aqui.

     Cada forma retorna un array de {x, y} con numPoints elementos.
     El parametro t va de 0 a 2π.
  */
  function generateTrajectory() {
    const points = []
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * 2 * Math.PI
      let x, y

      switch (shape) {
        case 'circle':
          // TRAYECTORIA CIRCULAR
          x = cx + radius * Math.cos(t)
          y = cy + radius * Math.sin(t)
          break

        case 'square': {
          // TRAYECTORIA CUADRADA
          const side = radius * 2
          const p = (t / (2 * Math.PI)) * 4 // parametro 0-4
          if (p < 1) {
            x = cx - radius + side * p
            y = cy - radius
          } else if (p < 2) {
            x = cx + radius
            y = cy - radius + side * (p - 1)
          } else if (p < 3) {
            x = cx + radius - side * (p - 2)
            y = cy + radius
          } else {
            x = cx - radius
            y = cy + radius - side * (p - 3)
          }
          break
        }

        case 'triangle': {
          // TRAYECTORIA TRIANGULAR
          const p3 = (t / (2 * Math.PI)) * 3
          const r3 = radius
          // Vertices del triangulo equilatero
          const verts = [
            { x: cx, y: cy + r3 },
            { x: cx - r3 * Math.sin(Math.PI / 3), y: cy - r3 * 0.5 },
            { x: cx + r3 * Math.sin(Math.PI / 3), y: cy - r3 * 0.5 },
          ]
          const seg = Math.floor(p3) % 3
          const frac = p3 - Math.floor(p3)
          const v0 = verts[seg]
          const v1 = verts[(seg + 1) % 3]
          x = v0.x + (v1.x - v0.x) * frac
          y = v0.y + (v1.y - v0.y) * frac
          break
        }

        case 'hexagon': {
          // TRAYECTORIA HEXAGONAL
          const p6 = (t / (2 * Math.PI)) * 6
          const hexVerts = []
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * 2 * Math.PI - Math.PI / 2
            hexVerts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) })
          }
          const seg6 = Math.floor(p6) % 6
          const frac6 = p6 - Math.floor(p6)
          const h0 = hexVerts[seg6]
          const h1 = hexVerts[(seg6 + 1) % 6]
          x = h0.x + (h1.x - h0.x) * frac6
          y = h0.y + (h1.y - h0.y) * frac6
          break
        }

        default:
          x = cx + radius * Math.cos(t)
          y = cy + radius * Math.sin(t)
      }

      points.push({ x, y })
    }
    return points
  }

  /* ================================================================
     CALCULO COMPLETO DE CINEMATICA + PERFILES
     ================================================================
     Para cada punto de la trayectoria, calcula:
     - IK -> theta1(t), theta2(t)
     - FK -> posiciones de A y B (verificacion)
     - Derivadas numericas -> velocidad y aceleracion
  */
  const trajectoryData = useMemo(() => {
    const traj = generateTrajectory()
    const dt = totalTime / numPoints
    const data = []

    for (let i = 0; i < traj.length; i++) {
      const { x, y } = traj[i]
      const ik = inverseKinematics(x, y)
      if (!ik) continue
      const { theta1, theta2 } = ik
      const fk = forwardKinematics(theta1, theta2)
      const J = jacobian(theta1, theta2)
      const time = i * dt

      data.push({
        idx: i,
        time,
        // Trayectoria deseada
        xTarget: x,
        yTarget: y,
        // Angulos articulares (IK)
        theta1,
        theta2,
        theta1Deg: (theta1 * 180) / Math.PI,
        theta2Deg: (theta2 * 180) / Math.PI,
        // Posiciones FK (verificacion)
        Ax: fk.Ax,
        Ay: fk.Ay,
        Bx: fk.Bx,
        By: fk.By,
        // Jacobiano
        detJ: J.det,
      })
    }

    /* ================================================================
       EDITABLE: PERFILES DE VELOCIDAD
       ================================================================
       Derivada numerica de primer orden (diferencias centrales):
       v(i) = (pos(i+1) - pos(i-1)) / (2*dt)

       Para los extremos se usa diferencia hacia adelante/atras.

       Velocidades calculadas:
       - dtheta1/dt, dtheta2/dt (velocidades angulares)
       - vxA, vyA (velocidad del nodo A)
       - vxB, vyB (velocidad del nodo B / efector)
    */
    for (let i = 0; i < data.length; i++) {
      const prev = data[Math.max(0, i - 1)]
      const next = data[Math.min(data.length - 1, i + 1)]
      const dtLocal = next.time - prev.time || dt

      // Velocidades angulares
      data[i].omega1 = (next.theta1 - prev.theta1) / dtLocal
      data[i].omega2 = (next.theta2 - prev.theta2) / dtLocal

      // Velocidades cartesianas del nodo A
      data[i].vxA = (next.Ax - prev.Ax) / dtLocal
      data[i].vyA = (next.Ay - prev.Ay) / dtLocal
      data[i].vA = Math.sqrt(data[i].vxA ** 2 + data[i].vyA ** 2)

      // Velocidades cartesianas del nodo B (efector)
      data[i].vxB = (next.Bx - prev.Bx) / dtLocal
      data[i].vyB = (next.By - prev.By) / dtLocal
      data[i].vB = Math.sqrt(data[i].vxB ** 2 + data[i].vyB ** 2)
    }

    /* ================================================================
       EDITABLE: PERFILES DE ACELERACION
       ================================================================
       Derivada numerica de segundo orden:
       a(i) = (v(i+1) - v(i-1)) / (2*dt)

       Aceleraciones calculadas:
       - alpha1, alpha2 (aceleraciones angulares)
       - axA, ayA (aceleracion del nodo A)
       - axB, ayB (aceleracion del nodo B / efector)
    */
    for (let i = 0; i < data.length; i++) {
      const prev = data[Math.max(0, i - 1)]
      const next = data[Math.min(data.length - 1, i + 1)]
      const dtLocal = next.time - prev.time || dt

      // Aceleraciones angulares
      data[i].alpha1 = (next.omega1 - prev.omega1) / dtLocal
      data[i].alpha2 = (next.omega2 - prev.omega2) / dtLocal

      // Aceleraciones cartesianas del nodo A
      data[i].axA = (next.vxA - prev.vxA) / dtLocal
      data[i].ayA = (next.vyA - prev.vyA) / dtLocal
      data[i].aA = Math.sqrt(data[i].axA ** 2 + data[i].ayA ** 2)

      // Aceleraciones cartesianas del nodo B (efector)
      data[i].axB = (next.vxB - prev.vxB) / dtLocal
      data[i].ayB = (next.vyB - prev.vyB) / dtLocal
      data[i].aB = Math.sqrt(data[i].axB ** 2 + data[i].ayB ** 2)
    }

    return data
  }, [L1, L2, shape, cx, cy, radius, numPoints, totalTime])

  // Current robot state
  const current = trajectoryData[currentIdx] || trajectoryData[0]

  // Animation
  useEffect(() => {
    if (!animating) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }
    let idx = 0
    const step = () => {
      idx = (idx + 1) % trajectoryData.length
      setCurrentIdx(idx)
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating, trajectoryData.length])

  /* ===== DIBUJO DEL ROBOT EN CANVAS ===== */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !current) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const scale = Math.min(W, H) / (2 * (L1 + L2 + 0.5))
    const ox = W / 2
    const oy = H / 2

    const toScreen = (x, y) => [ox + x * scale, oy - y * scale]

    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 0.5
    for (let g = -3; g <= 3; g += 0.5) {
      const [gx] = toScreen(g, 0)
      const [, gy] = toScreen(0, g)
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#a0aec0'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke()

    // Workspace boundary (optional ring)
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.2)'
    ctx.lineWidth = 1
    const rMax = L1 + L2
    const rMin = Math.abs(L1 - L2)
    ctx.beginPath(); ctx.arc(ox, oy, rMax * scale, 0, 2 * Math.PI); ctx.stroke()
    ctx.beginPath(); ctx.arc(ox, oy, rMin * scale, 0, 2 * Math.PI); ctx.stroke()

    // Trajectory trace
    ctx.strokeStyle = 'rgba(66, 153, 225, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    trajectoryData.forEach((d, i) => {
      const [sx, sy] = toScreen(d.Bx, d.By)
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    })
    ctx.closePath()
    ctx.stroke()

    // Path of A (codo)
    ctx.strokeStyle = 'rgba(237, 137, 54, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    trajectoryData.forEach((d, i) => {
      const [sx, sy] = toScreen(d.Ax, d.Ay)
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    })
    ctx.stroke()
    ctx.setLineDash([])

    // Robot links
    const [ox0, oy0] = toScreen(0, 0)
    const [ax, ay] = toScreen(current.Ax, current.Ay)
    const [bx, by] = toScreen(current.Bx, current.By)

    // Link 1 (O -> A)
    ctx.strokeStyle = '#2b6cb0'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(ox0, oy0); ctx.lineTo(ax, ay); ctx.stroke()

    // Link 2 (A -> B)
    ctx.strokeStyle = '#c05621'
    ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke()

    // Joint O (base)
    ctx.fillStyle = '#1a365d'
    ctx.beginPath(); ctx.arc(ox0, oy0, 8, 0, 2 * Math.PI); ctx.fill()

    // Joint A (codo) - marcador A
    ctx.fillStyle = '#ed8936'
    ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('A', ax, ay + 4)

    // Joint B (efector) - marcador B
    ctx.fillStyle = '#e53e3e'
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText('B', bx, by + 4)

    // Labels
    ctx.fillStyle = '#2d3748'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('O', ox0 + 12, oy0 - 5)
    ctx.fillText(`θ₁=${current.theta1Deg.toFixed(1)}°`, ox0 + 12, oy0 + 15)
    ctx.fillText(`θ₂=${current.theta2Deg.toFixed(1)}°`, ax + 12, ay + 15)
  }, [current, trajectoryData, L1, L2])

  if (!current) {
    return <div className="warning-box">No se pudieron calcular posiciones. Verifica que la trayectoria este dentro del espacio de trabajo.</div>
  }

  return (
    <div>
      {/* ===== CONTROLES ===== */}
      <div className="controls-panel">
        <h3>Parametros del Robot RR y Trayectoria</h3>
        <div className="controls-row">
          {/* EDITABLE: Rango de L1. Cambia min/max/step segun tu robot */}
          <div className="slider-group">
            <label>L1 (Link 1): {L1.toFixed(2)} m</label>
            <input type="range" min="0.3" max="2.0" step="0.05" value={L1}
              onChange={e => setL1(+e.target.value)} />
          </div>

          {/* EDITABLE: Rango de L2. Cambia min/max/step segun tu robot */}
          <div className="slider-group">
            <label>L2 (Link 2): {L2.toFixed(2)} m</label>
            <input type="range" min="0.3" max="2.0" step="0.05" value={L2}
              onChange={e => setL2(+e.target.value)} />
          </div>

          <div className="slider-group">
            <label>Forma</label>
            <select value={shape} onChange={e => setShape(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
              <option value="circle">Circulo</option>
              <option value="square">Cuadrado</option>
              <option value="triangle">Triangulo</option>
              <option value="hexagon">Hexagono</option>
            </select>
          </div>

          <div className="slider-group">
            <label>Centro X: {cx.toFixed(2)}</label>
            <input type="range" min="0.2" max="1.8" step="0.05" value={cx}
              onChange={e => setCx(+e.target.value)} />
          </div>

          <div className="slider-group">
            <label>Centro Y: {cy.toFixed(2)}</label>
            <input type="range" min="-1.5" max="1.5" step="0.05" value={cy}
              onChange={e => setCy(+e.target.value)} />
          </div>

          <div className="slider-group">
            <label>Radio: {radius.toFixed(2)}</label>
            <input type="range" min="0.05" max="0.8" step="0.05" value={radius}
              onChange={e => setRadius(+e.target.value)} />
          </div>

          <div className="slider-group">
            <label>Tiempo total: {totalTime.toFixed(1)} s</label>
            <input type="range" min="0.5" max="10" step="0.5" value={totalTime}
              onChange={e => setTotalTime(+e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setAnimating(!animating)}>
            {animating ? 'Pausar' : 'Animar'}
          </button>
          <button className="btn btn-outline" onClick={() => { setAnimating(false); setCurrentIdx(0) }}>
            Reiniciar
          </button>
          <span style={{ alignSelf: 'center', fontFamily: 'var(--mono)', fontSize: 13 }}>
            t = {current.time.toFixed(3)} s | Punto {currentIdx + 1}/{trajectoryData.length}
          </span>
        </div>

        {/* Scrubber */}
        <div className="slider-group" style={{ marginTop: 12 }}>
          <label>Posicion en trayectoria</label>
          <input type="range" min="0" max={trajectoryData.length - 1} value={currentIdx}
            onChange={e => { setAnimating(false); setCurrentIdx(+e.target.value) }} />
        </div>
      </div>

      {/* ===== VISUALIZACION ===== */}
      <div className="viz-container">
        {/* Canvas del robot */}
        <div className="viz-panel">
          <h3>Robot RR - Vista 2D</h3>
          <canvas ref={canvasRef} width={500} height={500} className="robot-canvas"
            style={{ width: '100%', height: 'auto' }} />
          <div style={{ marginTop: 8, fontSize: 13, color: '#718096' }}>
            Azul: Link 1 (OA) | Naranja: marcador A (codo) | Rojo: marcador B (efector)
          </div>
        </div>

        {/* Estado actual */}
        <div className="viz-panel">
          <h3>Estado Actual del Robot</h3>
          <table>
            <tbody>
              <tr><td><strong>θ₁</strong></td><td>{current.theta1Deg.toFixed(2)}°</td><td>{current.theta1.toFixed(4)} rad</td></tr>
              <tr><td><strong>θ₂</strong></td><td>{current.theta2Deg.toFixed(2)}°</td><td>{current.theta2.toFixed(4)} rad</td></tr>
              <tr><td><strong>Pos A (codo)</strong></td><td>x = {current.Ax.toFixed(4)}</td><td>y = {current.Ay.toFixed(4)}</td></tr>
              <tr><td><strong>Pos B (efector)</strong></td><td>x = {current.Bx.toFixed(4)}</td><td>y = {current.By.toFixed(4)}</td></tr>
              <tr><td><strong>ω₁</strong></td><td colSpan={2}>{current.omega1?.toFixed(4)} rad/s</td></tr>
              <tr><td><strong>ω₂</strong></td><td colSpan={2}>{current.omega2?.toFixed(4)} rad/s</td></tr>
              <tr><td><strong>|v_A|</strong></td><td colSpan={2}>{current.vA?.toFixed(4)} m/s</td></tr>
              <tr><td><strong>|v_B|</strong></td><td colSpan={2}>{current.vB?.toFixed(4)} m/s</td></tr>
              <tr><td><strong>α₁</strong></td><td colSpan={2}>{current.alpha1?.toFixed(4)} rad/s²</td></tr>
              <tr><td><strong>α₂</strong></td><td colSpan={2}>{current.alpha2?.toFixed(4)} rad/s²</td></tr>
              <tr><td><strong>|a_B|</strong></td><td colSpan={2}>{current.aB?.toFixed(4)} m/s²</td></tr>
              <tr><td><strong>det(J)</strong></td><td colSpan={2}>{current.detJ?.toFixed(4)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== GRAFICAS DE PERFILES ===== */}
      <ProfileCharts data={trajectoryData} />
    </div>
  )
}
