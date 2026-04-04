import { useState, useRef, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/* ================================================================
   LABORATORIO 3: PATA DE ROBOT - FUERZAS EN NODOS
   ================================================================
   Objetivo: Analizar una pata de robot con diferentes drivers
   que tienen diferentes centros de inercia. Calcular las fuerzas
   en cada nodo del mecanismo.

   ESTRUCTURA:
   - La pata tiene N eslabones conectados por nodos (joints)
   - El "driver" es una pieza intercambiable con diferente
     centro de masa / inercia
   - Los estudiantes cambian el driver y recalculan fuerzas

   SECCIONES EDITABLES:
   1. GEOMETRIA DE LA PATA .................. linea ~50
   2. PROPIEDADES DEL DRIVER ................ linea ~80
   3. CALCULO DE FUERZAS EN NODOS ........... linea ~120
   4. VISOR CAD (STL upload) ................ linea ~200
================================================================ */

export default function Lab3() {
  const [activeTab, setActiveTab] = useState('analysis')

  return (
    <div className="lab-page">
      <div className="container">
        <div className="lab-header">
          <h1>Lab 3: Pata de Robot - Fuerzas en Nodos</h1>
          <p className="lab-subtitle">
            Analisis de fuerzas con diferentes drivers (centros de inercia variables)
          </p>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}>Analisis de Fuerzas</div>
          <div className={`tab ${activeTab === 'driver' ? 'active' : ''}`}
            onClick={() => setActiveTab('driver')}>Configuracion del Driver</div>
          <div className={`tab ${activeTab === 'cad' ? 'active' : ''}`}
            onClick={() => setActiveTab('cad')}>Visor CAD</div>
        </div>

        {activeTab === 'analysis' && <ForceAnalysis />}
        {activeTab === 'driver' && <DriverConfig />}
        {activeTab === 'cad' && <CADViewer />}
      </div>
    </div>
  )
}

/* ================================================================
   ANALISIS DE FUERZAS EN NODOS
================================================================ */
function ForceAnalysis() {
  /* ===== EDITABLE: GEOMETRIA DE LA PATA =====
     Define los eslabones de la pata del robot.
     Cada link tiene: longitud, masa, angulo inicial, centro de masa relativo.
     Los nodos son las conexiones entre eslabones.

     Configuracion por defecto: 3 eslabones (femur, tibia, pie)
     con 4 nodos (cadera, rodilla, tobillo, punta)
  */
  const [links, setLinks] = useState([
    { name: 'Femur', length: 0.15, mass: 0.3, cmRatio: 0.5, inertia: 0.0006 },
    { name: 'Tibia', length: 0.15, mass: 0.25, cmRatio: 0.5, inertia: 0.0005 },
    { name: 'Pie', length: 0.08, mass: 0.1, cmRatio: 0.5, inertia: 0.0001 },
  ])

  /* ===== EDITABLE: ANGULOS DE LA PATA =====
     theta[i] es el angulo absoluto del eslabon i respecto al eje X.
     Cambia estos para simular diferentes poses de la pata.
  */
  const [angles, setAngles] = useState([-60, -120, -150])  // grados

  /* ===== EDITABLE: PROPIEDADES DEL DRIVER =====
     El driver es la pieza que conecta el actuador al eslabon.
     Tiene diferente centro de inercia segun su geometria.

     driverCmOffset: distancia del eje al centro de masa del driver (m)
     driverMass: masa del driver (kg)
     driverInertia: momento de inercia del driver (kg*m²)
  */
  const [driverCmOffset, setDriverCmOffset] = useState(0.02)
  const [driverMass, setDriverMass] = useState(0.05)
  const [driverInertia, setDriverInertia] = useState(0.00005)

  // Aceleracion angular aplicada (rad/s²) y gravedad
  const [alphaInput, setAlphaInput] = useState(10)
  const g = 9.81

  /* ===== CALCULO DE FUERZAS EN CADA NODO =====
     Metodo: Newton-Euler iterativo (de la punta hacia la base).
     Para cada eslabon i:
       ΣF = m_i * a_cm_i
       ΣM_nodo = I_i * α_i

     Las fuerzas en el nodo se propagan desde el ultimo eslabon
     hacia el primero (la cadera).
  */
  const nodesData = useMemo(() => {
    const nodes = []
    const anglesRad = angles.map(a => (a * Math.PI) / 180)
    const numLinks = links.length

    // Calculate node positions
    let xPos = 0, yPos = 0
    const nodePositions = [{ x: 0, y: 0, name: 'Cadera (Base)' }]

    for (let i = 0; i < numLinks; i++) {
      xPos += links[i].length * Math.cos(anglesRad[i])
      yPos += links[i].length * Math.sin(anglesRad[i])
      const nodeNames = ['Rodilla', 'Tobillo', 'Punta']
      nodePositions.push({ x: xPos, y: yPos, name: nodeNames[i] || `Nodo ${i + 2}` })
    }

    // Newton-Euler: backward recursion (from tip to base)
    // Simplified 2D static + inertial forces
    let Fx_next = 0  // reaction force at the distal end
    let Fy_next = 0
    let M_next = 0   // reaction moment

    const nodeForces = []

    for (let i = numLinks - 1; i >= 0; i--) {
      const L = links[i].length
      const m = links[i].mass + (i === 0 ? driverMass : 0)  // driver on first link
      const cm = links[i].cmRatio * L
      const I = links[i].inertia + (i === 0 ? driverInertia + driverMass * driverCmOffset * driverCmOffset : 0)
      const theta = anglesRad[i]
      const alpha = alphaInput  // same angular acceleration for simplicity

      // Center of mass position relative to proximal joint
      const xCm = cm * Math.cos(theta)
      const yCm = cm * Math.sin(theta)

      // Weight of link
      const Wg = m * g

      // Inertial forces (F = m * a_cm)
      // Tangential acceleration of CM: a_t = alpha * cm
      // Centripetal acceleration: (omega^2) * cm - set omega = 0 for static-ish
      const Fx_inertia = m * alpha * cm * (-Math.sin(theta))
      const Fy_inertia = m * alpha * cm * Math.cos(theta)

      // Equilibrium: F_proximal + F_distal + W + F_inertia = 0
      const Fx_prox = -(Fx_next + Fx_inertia)
      const Fy_prox = -(Fy_next - Wg + Fy_inertia)

      // Moment about proximal joint
      const M_prox = -(M_next
        + Fx_next * L * Math.sin(theta) - Fy_next * L * Math.cos(theta)  // distal force moment
        + Wg * xCm  // gravity moment
        + I * alpha  // inertial moment
      )

      nodeForces.unshift({
        node: nodePositions[i].name,
        x: nodePositions[i].x,
        y: nodePositions[i].y,
        Fx: Fx_prox,
        Fy: Fy_prox,
        Fmag: Math.sqrt(Fx_prox ** 2 + Fy_prox ** 2),
        M: M_prox,
        link: links[i].name,
      })

      // Propagate to next iteration
      Fx_next = Fx_prox
      Fy_next = Fy_prox
      M_next = M_prox
    }

    // Add tip node
    nodeForces.push({
      node: nodePositions[numLinks].name,
      x: nodePositions[numLinks].x,
      y: nodePositions[numLinks].y,
      Fx: 0, Fy: 0, Fmag: 0, M: 0,
      link: '-',
    })

    return { nodeForces, nodePositions }
  }, [links, angles, driverCmOffset, driverMass, driverInertia, alphaInput])

  const canvasRef = useRef(null)

  // Draw the leg
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const scale = Math.min(W, H) / 0.6
    const ox = W * 0.3
    const oy = H * 0.2

    const toScreen = (x, y) => [ox + x * scale, oy - y * scale]

    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 0.5
    for (let g = -0.5; g <= 0.5; g += 0.05) {
      const [gx] = toScreen(g, 0)
      const [, gy] = toScreen(0, g)
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    }

    const { nodePositions } = nodesData
    const colors = ['#2b6cb0', '#38a169', '#c05621']

    // Draw links
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const [x1, y1] = toScreen(nodePositions[i].x, nodePositions[i].y)
      const [x2, y2] = toScreen(nodePositions[i + 1].x, nodePositions[i + 1].y)

      ctx.strokeStyle = colors[i % colors.length]
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

      // Link label
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      ctx.fillStyle = colors[i % colors.length]
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(links[i]?.name || '', mx + 10, my)
    }

    // Draw nodes
    for (let i = 0; i < nodePositions.length; i++) {
      const [nx, ny] = toScreen(nodePositions[i].x, nodePositions[i].y)

      ctx.fillStyle = '#1a365d'
      ctx.beginPath(); ctx.arc(nx, ny, 8, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(i, nx, ny + 3)

      // Node name
      ctx.fillStyle = '#2d3748'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(nodePositions[i].name, nx + 12, ny - 5)

      // Force arrow (simplified)
      const force = nodesData.nodeForces[i]
      if (force && force.Fmag > 0.1) {
        const fScale = 30 / Math.max(...nodesData.nodeForces.map(f => f.Fmag || 1))
        const fx = force.Fx * fScale
        const fy = -force.Fy * fScale  // flip Y for screen

        ctx.strokeStyle = '#e53e3e'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(nx, ny)
        ctx.lineTo(nx + fx, ny + fy)
        ctx.stroke()

        // Arrowhead
        ctx.fillStyle = '#e53e3e'
        ctx.beginPath()
        ctx.arc(nx + fx, ny + fy, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // Driver indicator on first link
    if (links[0]) {
      const angRad = (angles[0] * Math.PI) / 180
      const driverX = nodePositions[0].x + driverCmOffset * Math.cos(angRad)
      const driverY = nodePositions[0].y + driverCmOffset * Math.sin(angRad)
      const [dx, dy] = toScreen(driverX, driverY)
      ctx.fillStyle = '#805ad5'
      ctx.beginPath(); ctx.arc(dx, dy, 6, 0, 2 * Math.PI); ctx.fill()
      ctx.fillStyle = '#805ad5'
      ctx.font = '10px sans-serif'
      ctx.fillText('Driver CM', dx + 10, dy)
    }
  }, [nodesData, links, angles, driverCmOffset])

  return (
    <div>
      <h2 className="section-title">Analisis de Fuerzas Newton-Euler</h2>

      <div className="controls-panel">
        <h3>Angulos de la Pata y Aceleracion</h3>
        <div className="controls-row">
          {angles.map((a, i) => (
            <div className="slider-group" key={i}>
              <label>{links[i]?.name || `Link ${i + 1}`}: {a}°</label>
              <input type="range" min="-180" max="0" step="5" value={a}
                onChange={e => {
                  const newAngles = [...angles]
                  newAngles[i] = +e.target.value
                  setAngles(newAngles)
                }} />
            </div>
          ))}
          <div className="slider-group">
            <label>Acel. angular α: {alphaInput} rad/s²</label>
            <input type="range" min="0" max="50" step="1" value={alphaInput}
              onChange={e => setAlphaInput(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="viz-container">
        <div className="viz-panel">
          <h3>Pata de Robot - Vista 2D</h3>
          <canvas ref={canvasRef} width={500} height={500} className="robot-canvas"
            style={{ width: '100%', height: 'auto' }} />
          <div style={{ fontSize: 12, marginTop: 8, color: '#718096' }}>
            Azul: Femur | Verde: Tibia | Naranja: Pie | Morado: Centro de masa del driver | Rojo: Fuerzas
          </div>
        </div>

        <div className="viz-panel">
          <h3>Fuerzas en Cada Nodo</h3>
          <table>
            <thead>
              <tr>
                <th>Nodo</th>
                <th>Fx (N)</th>
                <th>Fy (N)</th>
                <th>|F| (N)</th>
                <th>M (N·m)</th>
              </tr>
            </thead>
            <tbody>
              {nodesData.nodeForces.map((f, i) => (
                <tr key={i}>
                  <td><strong>{f.node}</strong></td>
                  <td>{f.Fx.toFixed(3)}</td>
                  <td>{f.Fy.toFixed(3)}</td>
                  <td style={{ fontWeight: 700, color: f.Fmag > 5 ? '#e53e3e' : '#2d3748' }}>
                    {f.Fmag.toFixed(3)}
                  </td>
                  <td>{f.M.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Force magnitude chart */}
      <div className="profile-chart" style={{ marginTop: 24 }}>
        <h4>Magnitud de Fuerzas por Nodo</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={nodesData.nodeForces}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="node" />
            <YAxis label={{ value: 'F (N)', angle: -90, position: 'left' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Fmag" stroke="#e53e3e" name="|F|" strokeWidth={2} />
            <Line type="monotone" dataKey="Fx" stroke="#2b6cb0" name="Fx" strokeWidth={1} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="Fy" stroke="#38a169" name="Fy" strokeWidth={1} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ================================================================
   CONFIGURACION DEL DRIVER
   Aqui los estudiantes cambian las propiedades del driver
   (diferente geometria -> diferente centro de inercia)
================================================================ */
function DriverConfig() {
  const [selectedDriver, setSelectedDriver] = useState(0)

  /* ===== EDITABLE: OPCIONES DE DRIVERS =====
     Define aqui las diferentes configuraciones de driver.
     Cada driver tiene diferente geometria, masa y centro de inercia.
  */
  const driverOptions = [
    {
      name: 'Driver A - Simetrico',
      mass: 0.05, cmOffset: 0.015, inertia: 0.00003,
      desc: 'Geometria simetrica, centro de masa centrado.'
    },
    {
      name: 'Driver B - Offset Superior',
      mass: 0.06, cmOffset: 0.025, inertia: 0.00008,
      desc: 'Centro de masa desplazado hacia arriba. Mayor momento.'
    },
    {
      name: 'Driver C - Compacto',
      mass: 0.04, cmOffset: 0.010, inertia: 0.00002,
      desc: 'Geometria compacta, menor inercia.'
    },
    {
      name: 'Driver D - Pesado',
      mass: 0.08, cmOffset: 0.030, inertia: 0.00012,
      desc: 'Mayor masa y offset. Simula actuador mas grande.'
    },
  ]

  const driver = driverOptions[selectedDriver]

  return (
    <div>
      <h2 className="section-title">Configuracion del Driver</h2>

      <div className="info-box">
        <strong>Instrucciones:</strong> Los estudiantes seleccionan un driver diferente para ver como
        cambian las fuerzas en cada nodo. El driver se monta en el primer eslabon (femur)
        y su centro de inercia afecta el torque requerido.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 24 }}>
        {driverOptions.map((d, i) => (
          <div key={i}
            className="card"
            style={{
              cursor: 'pointer',
              border: selectedDriver === i ? '2px solid #2b6cb0' : '1px solid #e2e8f0',
              background: selectedDriver === i ? '#ebf8ff' : 'white'
            }}
            onClick={() => setSelectedDriver(i)}
          >
            <h4 style={{ color: '#2b6cb0' }}>{d.name}</h4>
            <p style={{ fontSize: 13, marginBottom: 12 }}>{d.desc}</p>
            <table style={{ fontSize: 13 }}>
              <tbody>
                <tr><td>Masa</td><td><strong>{d.mass} kg</strong></td></tr>
                <tr><td>CM offset</td><td><strong>{d.cmOffset} m</strong></td></tr>
                <tr><td>Inercia</td><td><strong>{d.inertia} kg·m²</strong></td></tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Comparativa de Drivers</h3>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Masa (kg)</th>
              <th>CM Offset (m)</th>
              <th>Inercia (kg·m²)</th>
              <th>Torque relativo</th>
            </tr>
          </thead>
          <tbody>
            {driverOptions.map((d, i) => (
              <tr key={i} style={{ background: selectedDriver === i ? '#ebf8ff' : 'transparent' }}>
                <td><strong>{d.name}</strong></td>
                <td>{d.mass}</td>
                <td>{d.cmOffset}</td>
                <td>{d.inertia}</td>
                <td>{((d.mass * d.cmOffset + d.inertia * 10) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="editable-section" style={{ marginTop: 24 }}>
        <h3>Calculo del efecto del driver</h3>
        <p><strong>Momento adicional por el driver:</strong></p>
        <p>M_driver = I_driver * α + m_driver * g * d_cm * cos(θ)</p>
        <p style={{ marginTop: 8 }}>Donde:</p>
        <ul style={{ marginLeft: 20, fontSize: 14 }}>
          <li>I_driver = inercia del driver respecto al eje de rotacion</li>
          <li>α = aceleracion angular del eslabon</li>
          <li>m_driver = masa del driver</li>
          <li>d_cm = distancia del eje al centro de masa del driver</li>
          <li>θ = angulo del eslabon</li>
        </ul>
      </div>
    </div>
  )
}

/* ================================================================
   VISOR CAD (STL Upload)
   Los estudiantes suben el archivo STL del CAD de la pata
================================================================ */
function CADViewer() {
  const [cadFile, setCadFile] = useState(null)
  const [selectedStl, setSelectedStl] = useState(null)

  /* ===== EDITABLE: ARCHIVOS STL DISPONIBLES =====
     Estos archivos estan en public/stl/ (copiados de scissor_jack/)
     Agrega o quita piezas segun tu ensamble.
  */
  const availableStls = [
    { name: 'LH_ARM v1.stl', desc: 'Brazo izquierdo', role: 'Eslabon' },
    { name: 'RH_ARM v1.stl', desc: 'Brazo derecho', role: 'Eslabon' },
    { name: 'UPPER v0.stl', desc: 'Parte superior', role: 'Estructura' },
    { name: 'Lower_part v1.stl', desc: 'Parte inferior (base)', role: 'Estructura' },
    { name: 'PartMIXBottom.stl', desc: 'Driver - Configuracion 1', role: 'Driver (intercambiable)' },
    { name: 'PartMIXBottom2.stl', desc: 'Driver - Configuracion 2', role: 'Driver (intercambiable)' },
  ]

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) setCadFile(file)
  }

  return (
    <div>
      <h2 className="section-title">Visor CAD - Scissor Jack</h2>

      {/* Piezas disponibles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Piezas del Ensamble (STL en /public/stl/)</h3>
        <table>
          <thead>
            <tr><th>Archivo</th><th>Descripcion</th><th>Rol</th><th>Accion</th></tr>
          </thead>
          <tbody>
            {availableStls.map((stl, i) => (
              <tr key={i} style={{ background: selectedStl === stl.name ? '#ebf8ff' : 'transparent' }}>
                <td><code>{stl.name}</code></td>
                <td>{stl.desc}</td>
                <td>
                  <span style={{
                    background: stl.role.includes('Driver') ? '#fed7d7' : '#e2e8f0',
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    color: stl.role.includes('Driver') ? '#c53030' : '#4a5568'
                  }}>
                    {stl.role}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => setSelectedStl(stl.name)}>
                    Seleccionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STL info */}
      {selectedStl && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Pieza seleccionada: {selectedStl}</h3>
          <p style={{ fontSize: 14, color: '#718096' }}>
            Ruta: <code>/stl/{selectedStl}</code>
          </p>
          <div className="info-box" style={{ marginTop: 12 }}>
            <strong>Para visor 3D:</strong> Las dependencias Three.js ya estan instaladas.
            Usa <code>STLLoader</code> de <code>three/examples/jsm/loaders/STLLoader</code> con
            <code>@react-three/fiber</code> para renderizar el STL seleccionado.
            La URL del archivo es: <code>{`/stl/${selectedStl}`}</code>
          </div>
        </div>
      )}

      {/* Highlight drivers */}
      <div className="card" style={{ marginBottom: 24, border: '2px solid #e53e3e' }}>
        <h3 style={{ color: '#e53e3e' }}>Piezas Intercambiables (Drivers)</h3>
        <p style={{ fontSize: 14, marginBottom: 12 }}>
          Los estudiantes cambian entre estas piezas. Cada driver tiene un centro de inercia diferente,
          lo que afecta las fuerzas en cada nodo del mecanismo.
        </p>
        <div className="grid-2">
          <div className="card" style={{ background: '#fff5f5' }}>
            <h4>PartMIXBottom.stl</h4>
            <p style={{ fontSize: 13 }}>Driver configuracion 1 - Centro de masa mas centrado</p>
          </div>
          <div className="card" style={{ background: '#fff5f5' }}>
            <h4>PartMIXBottom2.stl</h4>
            <p style={{ fontSize: 13 }}>Driver configuracion 2 - Centro de masa desplazado</p>
          </div>
        </div>
      </div>

      {/* Upload custom */}
      <div className="card">
        <h3>Subir pieza personalizada</h3>
        <input type="file" accept=".stl,.STL" onChange={handleFileUpload} style={{ fontSize: 14 }} />
        {cadFile && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fff4', borderRadius: 8, border: '1px solid #c6f6d5' }}>
            <strong>Archivo cargado:</strong> {cadFile.name} ({(cadFile.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>
    </div>
  )
}
