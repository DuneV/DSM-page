import { useState } from 'react'
import RRSimulation from './RRSimulation'
import ProfileCharts from './ProfileCharts'
import KinematicsEquations from './KinematicsEquations'

export default function Lab1() {
  const [activeTab, setActiveTab] = useState('simulation')

  return (
    <div className="lab-page">
      <div className="container">
        {/* ===== HEADER ===== */}
        <div className="lab-header">
          <h1>Lab 1: Cinematica de Cuerpos Rigidos</h1>
          <p className="lab-subtitle">
            Robot planar tipo RR (SCARA 2D) — FK, IK, Jacobiano, perfiles cinematicos
          </p>
        </div>

        {/* Introduccion segun la guia */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Introduccion</h3>
          <p style={{ fontSize: 14 }}>
            Esta practica consiste en obtener y analizar una trayectoria esperada por medio de la cinematica
            de un robot de dos grados de libertad (tipo <strong>RR / SCARA 2D</strong>), en dos dimensiones.
            Mediante una camara de alta velocidad y un software de analisis de video (<strong>Tracker</strong> o <strong>OpenCV</strong>),
            se podra obtener la posicion y velocidad de cada cuerpo del robot y realizar un analisis cinematico
            al compararlo con la trayectoria esperada.
          </p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            La simulacion usa <strong>SymPy Mechanics</strong> para el modelado simbolico
            (FK con <code>pos_from</code> y <strong>Jacobiano</strong>) y una <strong>IK cerrada</strong> (solucion
            analitica) para calcular configuraciones articulares a partir de trayectorias en el espacio cartesiano.
            La visualizacion se realiza con <strong>Open3D</strong> mediante mallas artificiales (o basadas en STL)
            que representan los eslabones.
          </p>
        </div>

        {/* Objetivos */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Objetivos</h3>
          <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li>Aprender a medir fenomenos fisicos por medio de herramientas como una camara de video y software.</li>
            <li>Desarrollar habilidades de analisis de datos y presentacion de informacion experimental.</li>
            <li>Aprender a comparar diferentes metodos de analisis de resultados (teorico vs experimental).</li>
          </ul>
        </div>

        {/* Procedimiento resumido */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Procedimiento de la Practica</h3>
          <div className="grid-2">
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8 }}>Preparativos</h4>
              <ol style={{ marginLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                <li>Montaje del robot ROBIX (marca RASCAL, KIT NO.1).</li>
                <li>Medir la longitud de los segmentos OA y AB.</li>
                <li>El AG asigna centro y radio de circulo por grupo.</li>
                <li>Encontrar coordenadas de <strong>2 figuras</strong> asignadas.</li>
                <li>Hallar los angulos de los segmentos A y B (IK).</li>
                <li>Traducir los angulos al software del Robix.</li>
              </ol>
            </div>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8 }}>Ejecucion y Toma de Datos</h4>
              <ol style={{ marginLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                <li>Colocar elemento de referencia y medirlo.</li>
                <li>Actuar el robot (Robix).</li>
                <li>Grabar el movimiento en camara lenta.</li>
                <li>Analizar video con <strong>Tracker</strong> o <strong>OpenCV</strong> (<code>cv2.findContours</code> con mascara HSV).</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Resultados esperados */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Resultados a Reportar (segun guia)</h3>
          <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li><strong>Grafica X vs Y</strong> de los puntos (coordenadas) a seguir por el robot para lograr las figuras.</li>
            <li><strong>Ecuaciones generales de posicion vs tiempo</strong> para los marcadores A y B con marco de referencia global (x, y) — 2 ecuaciones.</li>
            <li><strong>Angulos por cinematica directa (FK)</strong> para cada actuador respecto a la union de cada cuerpo rigido (marcadores A y B).</li>
            <li><strong>Angulos por cinematica inversa (IK)</strong> para cada actuador respecto a la union de cada cuerpo rigido (marcadores A y B).</li>
            <li><strong>Graficas de los actuadores</strong> con los angulos encontrados para cada punto del circulo (n puntos = n graficas con marcadores A, B y angulos).</li>
            <li><strong>Con Tracker:</strong> X vs Y del movimiento completo del circulo (marcador B), angulos vs tiempo para marcadores A y B (2 graficas).</li>
            <li><strong>Comparar</strong> los resultados obtenidos por los dos metodos (teorico vs Tracker). Unir graficas teoricas y experimentales.</li>
          </ul>
        </div>

        {/* Criterios */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Criterios de Calificacion</h3>
          <table>
            <thead>
              <tr><th>Entregable</th><th>Peso</th></tr>
            </thead>
            <tbody>
              <tr><td>Simulacion</td><td>10%</td></tr>
              <tr><td>Quiz de verificacion de lectura</td><td>10%</td></tr>
              <tr><td>Entregable en PDF</td><td>59%</td></tr>
              <tr><td>Asistencia completa</td><td>5%</td></tr>
              <tr><td>Tracker y videos</td><td>8%</td></tr>
              <tr><td>Codigo de Python</td><td>8%</td></tr>
              <tr><td>Bono (Robot Polar JACK)</td><td>+30% (hasta 130/100)</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: '#718096', marginTop: 8 }}>
            Nota sobre 130/100. El bono es aplicable en 1 nota (este lab u otro). Informes max 5 paginas sin anexos. Formato IEEE/APA/ICONTEC.
          </p>
        </div>

        {/* ===== TABS ===== */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulation')}>
            Simulacion Interactiva RR
          </div>
          <div className={`tab ${activeTab === 'equations' ? 'active' : ''}`}
            onClick={() => setActiveTab('equations')}>
            Ecuaciones del Modelo RR
          </div>
          <div className={`tab ${activeTab === 'bonus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus')}>
            Bono: Robot Polar JACK (+1.5)
          </div>
        </div>

        {activeTab === 'simulation' && <RRSimulation />}
        {activeTab === 'equations' && <KinematicsEquations />}
        {activeTab === 'bonus' && <BonusSection />}
      </div>
    </div>
  )
}

/* ======================================================
   SECCION BONO - Robot Polar tipo JACK (+1.5)
   ====================================================== */
function BonusSection() {
  const [selectedStl, setSelectedStl] = useState(null)

  const stlFiles = [
    { name: 'LH_ARM v1.stl', desc: 'Brazo izquierdo del JACK', role: 'Eslabon' },
    { name: 'RH_ARM v1.stl', desc: 'Brazo derecho del JACK', role: 'Eslabon' },
    { name: 'UPPER v0.stl', desc: 'Parte superior (efector)', role: 'Estructura' },
    { name: 'Lower_part v1.stl', desc: 'Base inferior del robot', role: 'Base' },
    { name: 'PartMIXBottom.stl', desc: 'Pieza de acople inferior - Config. 1', role: 'Acople' },
    { name: 'PartMIXBottom2.stl', desc: 'Pieza de acople inferior - Config. 2', role: 'Acople' },
  ]

  return (
    <div>
      <h2 className="section-title">Bono: Robot Polar tipo JACK (+1.5 aplicable en cualquier informe)</h2>

      <div className="info-box">
        <strong>Descripcion:</strong> El bono consiste en la construccion, modelado y manipulacion de un
        robot polar desarrollado por el equipo de DSM. El ejercicio plantea como objetivo principal
        <strong> replicar y analizar las trayectorias propuestas para un robot tipo JACK</strong>,
        implementando de manera explicita tanto la cinematica directa como la cinematica inversa.
      </div>

      {/* Que se debe hacer */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Requisitos del Bono</h3>
        <ol style={{ marginLeft: 20, fontSize: 14, lineHeight: 2 }}>
          <li>
            <strong>Definir y formalizar las funciones cinematicas</strong> que gobiernan el comportamiento del mecanismo,
            garantizando que la relacion entre las variables articulares y la posicion del efector final este
            correctamente planteada.
          </li>
          <li>
            <strong>Simular el movimiento</strong> del robot polar y comprender los limites operativos y los posibles
            espacios de trabajo alcanzables bajo diferentes configuraciones articulares.
          </li>
          <li>
            <strong>Cuadro comparativo</strong> de mecanismos alternativos (RR vs Polar) considerando:
            <ul style={{ marginLeft: 20, marginTop: 4 }}>
              <li><strong>Flexibilidad de movimiento:</strong> rango operativo, numero de trayectorias posibles, facilidad para alcanzar puntos en el espacio de trabajo.</li>
              <li><strong>Gasto de potencia / eficiencia energetica:</strong> analisis de como varia el consumo de energia o esfuerzo requerido para desplazar el efector de un punto A a un punto B.</li>
              <li>Ventajas y limitaciones de cada configuracion, ofreciendo criterios tecnicos para la seleccion de un diseno en funcion de las necesidades del sistema.</li>
            </ul>
          </li>
          <li>
            <strong>Simulacion plana en 2D</strong> representada a traves de graficas matematicas (sin recurrir a 3D).
            Debe describir de manera clara el <strong>espacio de trabajo completo</strong> del robot polar,
            identificando todos los puntos posibles que el mecanismo puede alcanzar dentro de un dominio
            equivalente al del robot ROBIX.
          </li>
          <li>
            <strong>Analisis critico</strong> a partir de los resultados obtenidos: viabilidad del diseno, eficiencia
            y capacidad para replicar trayectorias dentro del dominio planteado. Anexar graficas generadas
            y observaciones de las simulaciones.
          </li>
        </ol>
      </div>

      {/* Piezas STL del JACK */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Piezas CAD del Robot JACK (STL disponibles)</h3>
        <p style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
          Los archivos STL estan en <code>public/stl/</code>. Puedes cargarlos con Open3D (Python)
          o con Three.js (web). Ruta: <code>/stl/[nombre_archivo]</code>
        </p>
        <table>
          <thead>
            <tr><th>Archivo STL</th><th>Descripcion</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {stlFiles.map((stl, i) => (
              <tr key={i} style={{ background: selectedStl === stl.name ? '#ebf8ff' : 'transparent' }}>
                <td><code>{stl.name}</code></td>
                <td>{stl.desc}</td>
                <td>
                  <span style={{
                    background: stl.role === 'Eslabon' ? '#bee3f8' : stl.role === 'Base' ? '#c6f6d5' : '#fefcbf',
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                  }}>
                    {stl.role}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => setSelectedStl(stl.name)}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedStl && (
          <div className="info-box" style={{ marginTop: 12 }}>
            Seleccionado: <strong>{selectedStl}</strong> — URL: <code>{`/stl/${selectedStl}`}</code>
          </div>
        )}
      </div>

      {/* Modelo cinematico del robot polar */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Modelo Cinematico del Robot Polar</h3>
        <div className="editable-section">
          <p>
            Un robot polar tiene una articulacion rotativa (θ) y una prismatica (d).
            El efector se posiciona en coordenadas polares.
          </p>
          <p style={{ marginTop: 8 }}><strong>Cinematica Directa (FK):</strong></p>
          <div className="equation">
            x = d · cos(θ) &nbsp;&nbsp;&nbsp; y = d · sin(θ)
          </div>
          <p style={{ marginTop: 8 }}><strong>Cinematica Inversa (IK):</strong></p>
          <div className="equation">
            d = √(x² + y²) &nbsp;&nbsp;&nbsp; θ = atan2(y, x)
          </div>
          <p style={{ marginTop: 8 }}><strong>Jacobiano del robot polar:</strong></p>
          <div className="equation">
            J = | cos(θ)  -d·sin(θ) | &nbsp;&nbsp; det(J) = d
            <br/>
            &nbsp;&nbsp;&nbsp;&nbsp;| sin(θ)   d·cos(θ) |
          </div>
          <p style={{ marginTop: 8 }}><strong>Espacio de trabajo:</strong> Sector anular entre d_min y d_max, con rango angular [θ_min, θ_max].</p>
        </div>
      </div>

      {/* Tabla comparativa */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Cuadro Comparativo de Mecanismos</h3>
        <table>
          <thead>
            <tr>
              <th>Criterio</th>
              <th>Robot RR (SCARA)</th>
              <th>Robot Polar (JACK)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Tipo de articulaciones</strong></td>
              <td>2 rotativas (θ₁, θ₂)</td>
              <td>1 rotativa (θ) + 1 prismatica (d)</td>
            </tr>
            <tr>
              <td><strong>Espacio de trabajo</strong></td>
              <td>Anillo 2D: |L₁-L₂| ≤ r ≤ L₁+L₂</td>
              <td>Sector anular: d_min ≤ r ≤ d_max</td>
            </tr>
            <tr>
              <td><strong>Trayectorias rectilineas</strong></td>
              <td>Requiere IK continua (ambos angulos varian)</td>
              <td>Naturales en la direccion radial</td>
            </tr>
            <tr>
              <td><strong>Trayectorias circulares</strong></td>
              <td>Naturales (un angulo constante)</td>
              <td>Requiere coordinacion d y θ simultanea</td>
            </tr>
            <tr>
              <td><strong>Singularidades</strong></td>
              <td>θ₂ = 0 o π (brazo extendido/plegado)</td>
              <td>d = 0 (efector en el origen)</td>
            </tr>
            <tr>
              <td><strong>Eficiencia energetica</strong></td>
              <td>2 motores rotativos (torques variables)</td>
              <td>1 motor rotativo + 1 actuador lineal</td>
            </tr>
            <tr>
              <td><strong>Complejidad mecanica</strong></td>
              <td>Media (dos ejes de rotacion)</td>
              <td>Requiere guia lineal precisa</td>
            </tr>
            <tr>
              <td><strong>Precision en la periferia</strong></td>
              <td>Disminuye cerca de singularidades</td>
              <td>Uniforme en direccion radial</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="warning-box" style={{ marginTop: 24 }}>
        <strong>Nota:</strong> El bono solo es aplicable en 1 nota. Debe enviar correo en nombre del grupo
        expresando si van a realizar el bono y si quiere que aplique para este laboratorio o para el siguiente.
        Calificacion sobre 130/100.
      </div>
    </div>
  )
}
