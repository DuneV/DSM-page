import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

/* ================================================================
   GRAFICAS DE PERFILES CINEMATICOS
   ================================================================
   Este componente muestra todas las graficas de:
   1. Trayectoria X vs Y (efector B)
   2. Posicion vs tiempo (marcadores A y B)
   3. Angulos vs tiempo (theta1, theta2)
   4. Velocidades vs tiempo (omega1, omega2, vA, vB)
   5. Aceleraciones vs tiempo (alpha1, alpha2, aA, aB)
   6. Determinante del Jacobiano vs tiempo

   EDITABLE: Para cambiar colores, ejes, o agregar graficas,
   modifica los componentes <LineChart> individuales abajo.
================================================================ */

export default function ProfileCharts({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div>
      {/* ============================================
          SECCION 1: TRAYECTORIA EN EL ESPACIO X-Y
          ============================================ */}
      <h2 className="section-title">Trayectoria X vs Y</h2>
      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Trayectoria del efector B */}
        <div className="profile-chart">
          <h4>Trayectoria del Efector (Marcador B)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Bx" name="X" type="number" domain={['auto', 'auto']}
                label={{ value: 'X (m)', position: 'bottom' }} />
              <YAxis dataKey="By" name="Y" type="number" domain={['auto', 'auto']}
                label={{ value: 'Y (m)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v.toFixed(4)} />
              <Scatter data={data} fill="#e53e3e" line={{ stroke: '#e53e3e' }} lineType="joint" r={1} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Trayectoria del codo A */}
        <div className="profile-chart">
          <h4>Trayectoria del Codo (Marcador A)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Ax" name="X" type="number" domain={['auto', 'auto']}
                label={{ value: 'X (m)', position: 'bottom' }} />
              <YAxis dataKey="Ay" name="Y" type="number" domain={['auto', 'auto']}
                label={{ value: 'Y (m)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v.toFixed(4)} />
              <Scatter data={data} fill="#ed8936" line={{ stroke: '#ed8936' }} lineType="joint" r={1} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================
          SECCION 2: POSICION vs TIEMPO
          ============================================
          EDITABLE: Estas son las ecuaciones generales de
          posicion para los marcadores A y B en el marco
          de referencia global (x, y):

          Marcador A: Ax(t) = L1*cos(θ1(t))
                      Ay(t) = L1*sin(θ1(t))

          Marcador B: Bx(t) = L1*cos(θ1(t)) + L2*cos(θ1(t)+θ2(t))
                      By(t) = L1*sin(θ1(t)) + L2*sin(θ1(t)+θ2(t))
      */}
      <h2 className="section-title">Perfiles de Posicion</h2>
      <div className="profiles-grid">
        <div className="profile-chart">
          <h4>Posicion X vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'X (m)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="Ax" stroke="#ed8936" name="A_x" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="Bx" stroke="#e53e3e" name="B_x" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Posicion Y vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'Y (m)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="Ay" stroke="#ed8936" name="A_y" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="By" stroke="#e53e3e" name="B_y" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Angulos θ vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'θ (°)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v.toFixed(2)} />
              <Legend />
              <Line type="monotone" dataKey="theta1Deg" stroke="#2b6cb0" name="θ₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="theta2Deg" stroke="#38a169" name="θ₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================
          SECCION 3: VELOCIDAD vs TIEMPO
          ============================================
          EDITABLE: Perfiles de velocidad.
          Se calculan por derivada numerica (diferencias centrales).

          Velocidades angulares:
            ω₁ = dθ₁/dt, ω₂ = dθ₂/dt

          Velocidades cartesianas (via Jacobiano):
            [vx_B, vy_B]^T = J * [ω₁, ω₂]^T
      */}
      <h2 className="section-title">Perfiles de Velocidad</h2>
      <div className="profiles-grid">
        <div className="profile-chart">
          <h4>Velocidad Angular ω vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'ω (rad/s)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="omega1" stroke="#2b6cb0" name="ω₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="omega2" stroke="#38a169" name="ω₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>|Velocidad| del Efector B vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: '|v| (m/s)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="vA" stroke="#ed8936" name="|v_A|" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="vB" stroke="#e53e3e" name="|v_B|" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Componentes vx, vy del Efector B</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'v (m/s)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="vxB" stroke="#e53e3e" name="vx_B" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="vyB" stroke="#9b2c2c" name="vy_B" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================
          SECCION 4: ACELERACION vs TIEMPO
          ============================================
          EDITABLE: Perfiles de aceleracion.
          Se calculan por segunda derivada numerica.

          Aceleraciones angulares:
            α₁ = dω₁/dt, α₂ = dω₂/dt

          Aceleraciones cartesianas:
            a_B = d/dt(J * ω) = J_dot * ω + J * α
      */}
      <h2 className="section-title">Perfiles de Aceleracion</h2>
      <div className="profiles-grid">
        <div className="profile-chart">
          <h4>Aceleracion Angular α vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'α (rad/s²)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="alpha1" stroke="#2b6cb0" name="α₁" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="alpha2" stroke="#38a169" name="α₂" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>|Aceleracion| vs Tiempo</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: '|a| (m/s²)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Legend />
              <Line type="monotone" dataKey="aA" stroke="#ed8936" name="|a_A|" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="aB" stroke="#e53e3e" name="|a_B|" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>det(J) vs Tiempo (Singularidades)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'det(J)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(v) => v?.toFixed(4)} />
              <Line type="monotone" dataKey="detJ" stroke="#805ad5" name="det(J)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
