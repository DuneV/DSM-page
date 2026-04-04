import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

/* ================================================================
   ECUACIONES DEL MODELO RR
   ================================================================
   Este componente documenta todas las ecuaciones usadas.
   EDITABLE: Modifica las ecuaciones LaTeX directamente.
================================================================ */

export default function KinematicsEquations() {
  return (
    <div>
      <h2 className="section-title">Modelo Matematico del Robot RR</h2>

      {/* ===== CINEMATICA DIRECTA ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="subsection-title">1. Cinematica Directa (FK)</h3>
        <p>Dado los angulos articulares <InlineMath math="\theta_1, \theta_2" />, se obtienen las posiciones:</p>

        <div className="editable-section">
          <p><strong>Posicion del Marcador A (codo):</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{r}_A = \\begin{pmatrix} L_1 \\cos\\theta_1 \\\\ L_1 \\sin\\theta_1 \\end{pmatrix}
            `} />
          </div>

          <p><strong>Posicion del Marcador B (efector final):</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{r}_B = \\begin{pmatrix} L_1 \\cos\\theta_1 + L_2 \\cos(\\theta_1 + \\theta_2) \\\\ L_1 \\sin\\theta_1 + L_2 \\sin(\\theta_1 + \\theta_2) \\end{pmatrix}
            `} />
          </div>
        </div>

        <p style={{ marginTop: 12 }}>
          En la simulacion, esto se implementa en la funcion <code>forwardKinematics(theta1, theta2)</code> del archivo <code>RRSimulation.jsx</code>.
        </p>
      </div>

      {/* ===== CINEMATICA INVERSA ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="subsection-title">2. Cinematica Inversa (IK)</h3>
        <p>Dado un punto objetivo <InlineMath math="(x, y)" />, se calculan los angulos:</p>

        <div className="editable-section">
          <p><strong>Angulo del segundo eslabon:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\cos\\theta_2 = \\frac{x^2 + y^2 - L_1^2 - L_2^2}{2 L_1 L_2}
            `} />
          </div>
          <div className="equation">
            <BlockMath math={`
              \\theta_2 = \\text{atan2}\\left(\\pm\\sqrt{1 - \\cos^2\\theta_2},\\; \\cos\\theta_2\\right)
            `} />
          </div>
          <p style={{ fontSize: 13, color: '#718096' }}>
            (+) para configuracion "codo arriba", (-) para "codo abajo"
          </p>

          <p><strong>Angulo del primer eslabon:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\theta_1 = \\text{atan2}(y, x) - \\text{atan2}\\left(L_2 \\sin\\theta_2,\\; L_1 + L_2 \\cos\\theta_2\\right)
            `} />
          </div>
        </div>

        <div className="info-box" style={{ marginTop: 12 }}>
          <strong>Condicion de alcanzabilidad:</strong> El punto (x, y) es alcanzable si{' '}
          <InlineMath math="|L_1 - L_2| \leq \sqrt{x^2 + y^2} \leq L_1 + L_2" />
        </div>
      </div>

      {/* ===== JACOBIANO ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="subsection-title">3. Jacobiano</h3>
        <p>Relaciona velocidades articulares con velocidades cartesianas del efector:</p>

        <div className="editable-section">
          <div className="equation">
            <BlockMath math={`
              \\mathbf{J} = \\begin{pmatrix}
                -L_1 \\sin\\theta_1 - L_2 \\sin(\\theta_1+\\theta_2) & -L_2 \\sin(\\theta_1+\\theta_2) \\\\
                L_1 \\cos\\theta_1 + L_2 \\cos(\\theta_1+\\theta_2) & L_2 \\cos(\\theta_1+\\theta_2)
              \\end{pmatrix}
            `} />
          </div>

          <p><strong>Relacion de velocidades:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\begin{pmatrix} \\dot{x} \\\\ \\dot{y} \\end{pmatrix} = \\mathbf{J} \\begin{pmatrix} \\dot{\\theta}_1 \\\\ \\dot{\\theta}_2 \\end{pmatrix}
            `} />
          </div>

          <p><strong>Determinante (singularidades):</strong></p>
          <div className="equation">
            <BlockMath math={`\\det(\\mathbf{J}) = L_1 L_2 \\sin\\theta_2`} />
          </div>
          <p style={{ fontSize: 13, color: '#718096' }}>
            Singularidad cuando <InlineMath math="\theta_2 = 0" /> o <InlineMath math="\theta_2 = \pi" /> (brazo completamente extendido o plegado)
          </p>
        </div>
      </div>

      {/* ===== VELOCIDADES ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="subsection-title">4. Perfiles de Velocidad</h3>

        <div className="editable-section">
          <p><strong>Velocidad del Marcador A:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{v}_A = \\begin{pmatrix} -L_1 \\dot{\\theta}_1 \\sin\\theta_1 \\\\ L_1 \\dot{\\theta}_1 \\cos\\theta_1 \\end{pmatrix}
            `} />
          </div>

          <p><strong>Velocidad del Marcador B:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{v}_B = \\vec{v}_A + \\begin{pmatrix} -L_2 (\\dot{\\theta}_1 + \\dot{\\theta}_2) \\sin(\\theta_1 + \\theta_2) \\\\ L_2 (\\dot{\\theta}_1 + \\dot{\\theta}_2) \\cos(\\theta_1 + \\theta_2) \\end{pmatrix}
            `} />
          </div>

          <p style={{ fontSize: 13 }}>
            En la simulacion, las velocidades se calculan por <strong>derivada numerica</strong> (diferencias centrales) en el archivo <code>RRSimulation.jsx</code>, seccion "PERFILES DE VELOCIDAD".
          </p>
        </div>
      </div>

      {/* ===== ACELERACIONES ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="subsection-title">5. Perfiles de Aceleracion</h3>

        <div className="editable-section">
          <p><strong>Aceleracion del Marcador A:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{a}_A = \\begin{pmatrix}
                -L_1 \\ddot{\\theta}_1 \\sin\\theta_1 - L_1 \\dot{\\theta}_1^2 \\cos\\theta_1 \\\\
                L_1 \\ddot{\\theta}_1 \\cos\\theta_1 - L_1 \\dot{\\theta}_1^2 \\sin\\theta_1
              \\end{pmatrix}
            `} />
          </div>

          <p><strong>Aceleracion del Marcador B:</strong></p>
          <div className="equation">
            <BlockMath math={`
              \\vec{a}_B = \\vec{a}_A + \\begin{pmatrix}
                -L_2 (\\ddot{\\theta}_1 + \\ddot{\\theta}_2) \\sin(\\theta_1+\\theta_2) - L_2 (\\dot{\\theta}_1 + \\dot{\\theta}_2)^2 \\cos(\\theta_1+\\theta_2) \\\\
                L_2 (\\ddot{\\theta}_1 + \\ddot{\\theta}_2) \\cos(\\theta_1+\\theta_2) - L_2 (\\dot{\\theta}_1 + \\dot{\\theta}_2)^2 \\sin(\\theta_1+\\theta_2)
              \\end{pmatrix}
            `} />
          </div>

          <p style={{ fontSize: 13 }}>
            Nota: Los terminos <InlineMath math="\dot{\theta}^2" /> representan la aceleracion centripeta.
            Los terminos <InlineMath math="\ddot{\theta}" /> representan la aceleracion tangencial.
          </p>
        </div>
      </div>

      {/* ===== MAPA DE ARCHIVOS ===== */}
      <div className="card">
        <h3 className="subsection-title">Guia de Archivos para Edicion</h3>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Archivo</th>
              <th>Linea aprox.</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Parametros L1, L2</td><td><code>RRSimulation.jsx</code></td><td>~30</td></tr>
            <tr><td>Cinematica Directa (FK)</td><td><code>RRSimulation.jsx</code></td><td>~70</td></tr>
            <tr><td>Cinematica Inversa (IK)</td><td><code>RRSimulation.jsx</code></td><td>~90</td></tr>
            <tr><td>Jacobiano</td><td><code>RRSimulation.jsx</code></td><td>~120</td></tr>
            <tr><td>Generacion de trayectoria</td><td><code>RRSimulation.jsx</code></td><td>~150</td></tr>
            <tr><td>Perfiles de velocidad</td><td><code>RRSimulation.jsx</code></td><td>~200</td></tr>
            <tr><td>Perfiles de aceleracion</td><td><code>RRSimulation.jsx</code></td><td>~220</td></tr>
            <tr><td>Graficas (charts)</td><td><code>ProfileCharts.jsx</code></td><td>Todo el archivo</td></tr>
            <tr><td>Ecuaciones LaTeX</td><td><code>KinematicsEquations.jsx</code></td><td>Este archivo</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
