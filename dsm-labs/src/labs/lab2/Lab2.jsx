import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

/* ================================================================
   LABORATORIO 2: CLASIFICACION DE MOVIMIENTOS
   ================================================================
   Acelerometro -> Filtrado -> Integracion -> ML (MLPClassifier)
================================================================ */

export default function Lab2() {
  const [activeTab, setActiveTab] = useState('intro')

  return (
    <div className="lab-page">
      <div className="container">
        <div className="lab-header">
          <h1>Lab 2: Clasificacion de Movimientos</h1>
          <p className="lab-subtitle">
            Datos de acelerometro, filtrado, integracion numerica y clasificacion con redes neuronales (MLPClassifier)
          </p>
        </div>

        {/* Introduccion */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Introduccion</h3>
          <p style={{ fontSize: 14 }}>
            El estudio de datos provenientes de sensores como <strong>acelerometros</strong> es fundamental para
            comprender el movimiento y caracterizar patrones en tres dimensiones. Un acelerometro entrega
            informacion de aceleraciones en los ejes x, y, z, y mediante tecnicas de procesamiento es posible
            identificar tipos de movimientos (caminar, correr, saltar, etc.). Sin embargo, la presencia de
            <strong> ruido</strong> y la variabilidad individual hacen que los resultados directos no siempre sean confiables.
          </p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            Este laboratorio integra <strong>dos enfoques</strong>: el analisis clasico de datos fisicos
            (a traves de metodos de integracion numerica o vectorizacion) y la <strong>clasificacion automatica
            de movimientos mediante machine learning</strong> (MLPClassifier de scikit-learn), con el fin de
            analizar ventajas, limitaciones y complementariedad de ambas metodologias.
          </p>
        </div>

        {/* Objetivos */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Objetivos</h3>
          <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li>Implementar un proceso de preprocesamiento y filtrado de senales de aceleracion.</li>
            <li>Analizar la influencia del ruido en los datos y discutir sus causas.</li>
            <li>Preparar y entrenar un modelo de aprendizaje supervisado usando <strong>MLPClassifier</strong> para clasificar distintos tipos de movimiento.</li>
            <li>Evaluar el rendimiento del modelo con metricas de clasificacion (accuracy, matriz de confusion, F1-score).</li>
            <li>Desarrollar criterios para comparar el desempeno de diferentes configuraciones de red y parametros de entrenamiento.</li>
            <li>Lograr una secuencia de movimientos que sea reconocida en al menos el <strong>80%</strong> de forma correcta.</li>
          </ul>
        </div>

        {/* Criterios */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Criterios de Calificacion</h3>
          <table>
            <thead><tr><th>Entregable</th><th>Peso</th></tr></thead>
            <tbody>
              <tr><td>Quiz de verificacion de lectura</td><td>10%</td></tr>
              <tr><td>Entregable en PDF</td><td>60%</td></tr>
              <tr><td>Videos</td><td>5%</td></tr>
              <tr><td>Codigo de Python</td><td>25%</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 13, color: '#718096', marginTop: 8 }}>
            Informe max 5 paginas sin anexos. Bono: +0.5 por completar el curso "AI for Design and Optimization" (Coursera - credenciales Uniandes).
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'intro' ? 'active' : ''}`}
            onClick={() => setActiveTab('intro')}>Procedimiento Paso a Paso</div>
          <div className={`tab ${activeTab === 'filtering' ? 'active' : ''}`}
            onClick={() => setActiveTab('filtering')}>Filtrado + Integracion</div>
          <div className={`tab ${activeTab === 'nn' ? 'active' : ''}`}
            onClick={() => setActiveTab('nn')}>Red Neuronal (Marco Teorico)</div>
          <div className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}>Metricas y Entregables</div>
        </div>

        {activeTab === 'intro' && <ProcedureSection />}
        {activeTab === 'filtering' && <FilteringSection />}
        {activeTab === 'nn' && <NeuralNetworkSection />}
        {activeTab === 'metrics' && <MetricsSection />}
      </div>
    </div>
  )
}

/* ===== PROCEDIMIENTO PASO A PASO ===== */
function ProcedureSection() {
  return (
    <div>
      <h2 className="section-title">Procedimiento Completo</h2>

      {/* Paso 1: App */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 1: Descargar Aplicacion de Captura</h3>
        <p style={{ fontSize: 14 }}>
          Elija una de las siguientes apps para capturar datos del acelerometro del celular:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
          {['Arduino Science Journal', 'PhyPhox', 'Lab4U (Lab4Physics)', 'Physics Toolbox Sensor Suite'].map(app => (
            <div key={app} className="card" style={{ padding: 12, textAlign: 'center', fontSize: 14 }}>
              <strong>{app}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Paso 2: Ubicacion */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 2: Seleccionar Punto de Colocacion del Sensor</h3>
        <p style={{ fontSize: 14 }}>
          Elija un punto del cuerpo para fijar el celular (muneca, tobillo, cintura, pecho, etc.).
          Tenga en cuenta la orientacion de los ejes de la IMU (Unidad de Medicion Inercial):
        </p>
        <div className="info-box" style={{ marginTop: 12 }}>
          <strong>Orientacion IMU:</strong> <strong>Pitch</strong> = eje Y (inclinacion adelante/atras) |
          <strong> Roll</strong> = eje X (inclinacion lateral) |
          <strong> Yaw</strong> = eje Z (rotacion horizontal).
          La notacion depende de la ubicacion del dispositivo en el cuerpo.
        </div>
      </div>

      {/* Paso 3: Calibracion y captura */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 3: Calibracion y Captura de Datos</h3>
        <ol style={{ marginLeft: 20, fontSize: 14, lineHeight: 2 }}>
          <li>Calibrar el dispositivo definiendo espacialmente los angulos de interes.</li>
          <li>Definir <strong>al menos 4 movimientos</strong> (ej: saltar, quieto, correr, sentarse, caminar, etc.).</li>
          <li>Capturar <strong>minimo 50 series</strong> (mayor a 30) de cada movimiento, cada una con el mismo (o similar) tiempo de ejecucion.</li>
          <li>Exportar los datos en formato <strong>CSV</strong> con columnas: timestamp, ax, ay, az, label.</li>
        </ol>
        <div className="warning-box" style={{ marginTop: 12 }}>
          <strong>Importante:</strong> 50 series minimo por movimiento garantiza que al hacer el split (80/20)
          se tengan suficientes datos de entrenamiento y prueba por clase. Si hay desbalance entre clases,
          usar <code>stratify=y</code> en el split.
        </div>
      </div>

      {/* Paso 4: Preprocesamiento */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 4: Carga y Preprocesamiento</h3>
        <ol style={{ marginLeft: 20, fontSize: 14, lineHeight: 2 }}>
          <li><strong>Importar los datos</strong> del acelerometro (CSV).</li>
          <li><strong>Filtro paso bajo</strong> (corte ~3-5 Hz) para eliminar altas frecuencias (sus movimientos son lentos, no deben existir altas frecuencias).</li>
          <li><strong>Promedio movil</strong> por ejes para suavizar la curva.</li>
          <li><strong>Normalizar o escalar</strong> los valores de entrada (z-score recomendado) para mejorar la estabilidad del modelo.</li>
          <li><strong>Dividir en train/test</strong> (80%/20%) con <code>stratify=y</code>.</li>
          <li><strong>Etiquetar</strong> los datos segun el tipo de movimiento.</li>
        </ol>
      </div>

      {/* Paso 5: Modelo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 5: Definir y Entrenar el Modelo</h3>
        <p style={{ fontSize: 14 }}>
          Se usa <code>MLPClassifier</code> de <code>sklearn.neural_network</code>.
          Configuracion inicial recomendada: 2 capas ocultas (100, 50 neuronas), activacion <code>relu</code>,
          optimizador <code>adam</code>, 300 iteraciones.
        </p>
        <div className="code-block" style={{ marginTop: 12 }}>
{`import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

# 1. Cargar datos
df = pd.read_csv("datos_acelerometro.csv")

# 2. Features (entrada) y labels (salida)
X = df[["ax", "ay", "az"]].values   # <-- EDITABLE: agregar mas features si quieres
y = df["label"].astype(str).values

# 3. Split estratificado (80% train, 20% test)
Xtr, Xte, ytr, yte = train_test_split(
    X, y, test_size=0.2, random_state=0, stratify=y
)

# 4. Definir modelo MLP
clf = MLPClassifier(
    hidden_layer_sizes=(100, 50),  # EDITABLE: cambiar arquitectura
    activation="relu",              # EDITABLE: "relu", "tanh", "logistic"
    solver="adam",                   # EDITABLE: "adam", "sgd", "lbfgs"
    max_iter=300,                    # EDITABLE: numero de epocas
    random_state=0
)

# 5. Entrenar
clf.fit(Xtr, ytr)

# 6. Evaluar
yp = clf.predict(Xte)
print("Accuracy:", accuracy_score(yte, yp))
print(classification_report(yte, yp))

# 7. Matriz de confusion
cm = confusion_matrix(yte, yp, labels=clf.classes_)
disp = ConfusionMatrixDisplay(cm, display_labels=clf.classes_)
disp.plot(cmap="Blues")
plt.title("Matriz de Confusion - Metodo A")
plt.show()`}
        </div>
      </div>

      {/* Paso 6: Validacion */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Paso 6: Validacion con Secuencia en Vivo</h3>
        <p style={{ fontSize: 14 }}>
          Grabar un <strong>video</strong> de un integrante con el sensor en la posicion donde se entreno el modelo.
          Ejecutar una rutina de <strong>minimo 3 movimientos distintos con 2 repeticiones</strong> cada uno.
          El modelo debe acertar <strong>≥ 80%</strong> de las categorias.
        </p>
        <div className="warning-box" style={{ marginTop: 12 }}>
          <strong>Regla:</strong> Si el modelo produce una etiqueta diferente a la accion que se esta realizando,
          se clasifica inmediatamente como negativa la inferencia. Datos atipicos = error.
        </div>
      </div>

      {/* Pipeline visual */}
      <h2 className="section-title" style={{ marginTop: 32 }}>Pipeline Visual</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {[
          { step: 1, title: 'App Movil', desc: 'Capturar ax, ay, az con PhyPhox u otra app' },
          { step: 2, title: 'CSV con Labels', desc: 'Exportar datos etiquetados por movimiento' },
          { step: 3, title: 'Filtro Paso Bajo', desc: 'Eliminar ruido de alta frecuencia (~3-5Hz)' },
          { step: 4, title: 'Promedio Movil', desc: 'Suavizar senal por ejes' },
          { step: 5, title: 'z-score', desc: 'Normalizar para estabilidad del modelo' },
          { step: 6, title: 'Train/Test Split', desc: '80/20 con stratify=y' },
          { step: 7, title: 'MLPClassifier', desc: '(100,50), relu, adam, 300 iter' },
          { step: 8, title: 'Evaluar ≥80%', desc: 'Accuracy, F1, confusion matrix' },
        ].map(s => (
          <div key={s.step} className="card" style={{ flex: '1 1 130px', textAlign: 'center', minWidth: 120, padding: 12 }}>
            <div style={{ background: '#2b6cb0', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontWeight: 700, fontSize: 14 }}>
              {s.step}
            </div>
            <strong style={{ fontSize: 13 }}>{s.title}</strong>
            <p style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===== FILTRADO E INTEGRACION ===== */
function FilteringSection() {
  const [windowSize, setWindowSize] = useState(5)

  const demoData = Array.from({ length: 200 }, (_, i) => {
    const t = i * 0.01
    const clean = Math.sin(2 * Math.PI * 1 * t) + 0.5 * Math.sin(2 * Math.PI * 0.3 * t)
    const noise = (Math.random() - 0.5) * 0.8
    const raw = clean + noise
    return { t: +t.toFixed(3), raw: +raw.toFixed(4), clean: +clean.toFixed(4) }
  })

  const filtered = demoData.map((d, i) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(demoData.length, i + Math.ceil(windowSize / 2))
    const slice = demoData.slice(start, end)
    const avg = slice.reduce((s, p) => s + p.raw, 0) / slice.length
    return { ...d, filtered: +avg.toFixed(4) }
  })

  let vel = 0
  const integrated = filtered.map((d, i) => {
    if (i > 0) {
      const dt = d.t - filtered[i - 1].t
      vel += 0.5 * (d.filtered + filtered[i - 1].filtered) * dt
    }
    return { ...d, velocity: +vel.toFixed(4) }
  })

  let pos = 0
  const fullData = integrated.map((d, i) => {
    if (i > 0) {
      const dt = d.t - integrated[i - 1].t
      pos += 0.5 * (d.velocity + integrated[i - 1].velocity) * dt
    }
    return { ...d, position: +pos.toFixed(4) }
  })

  return (
    <div>
      <h2 className="section-title">Filtrado de Senales e Integracion Numerica</h2>

      {/* Marco teorico: Filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Marco Teorico: Filtros</h3>
        <p style={{ fontSize: 14 }}>
          En procesamiento de senales, los filtros permiten modificar una senal para reducir ruido y resaltar patrones relevantes:
        </p>
        <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8, marginTop: 8 }}>
          <li><strong>Filtro paso bajo:</strong> atenua frecuencias altas no deseadas. Recomendado: corte a 3-5 Hz para movimientos corporales lentos.</li>
          <li><strong>Filtro paso alto:</strong> resalta cambios bruscos en la senal.</li>
          <li><strong>Filtro Kalman:</strong> permite estimaciones robustas combinando multiples fuentes de informacion.</li>
          <li><strong>Promedio movil:</strong> suaviza la senal usando la media de una ventana de N muestras.</li>
        </ul>
      </div>

      {/* Marco teorico: Integracion */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Marco Teorico: Integracion Numerica</h3>
        <p style={{ fontSize: 14 }}>
          La integracion numerica permite calcular aproximaciones de integrales definidas con datos discretos:
        </p>
        <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8, marginTop: 8 }}>
          <li><strong>Aceleracion → Velocidad:</strong> v(t) = ∫ a(t) dt</li>
          <li><strong>Velocidad → Posicion:</strong> x(t) = ∫ v(t) dt</li>
          <li><strong>Metodo trapezoidal:</strong> v(t+Δt) ≈ v(t) + 0.5·(a(t) + a(t+Δt))·Δt</li>
          <li><strong>Metodo de Simpson:</strong> mayor precision para datos equiespaciados.</li>
        </ul>
        <div className="warning-box" style={{ marginTop: 12 }}>
          <strong>Drift acumulativo:</strong> Pequenas desviaciones o ruidos generan errores acumulativos
          al integrar. Por eso se complementa con ML, que clasifica directamente desde aceleracion sin necesidad de integrar.
        </div>
      </div>

      {/* Demo interactivo */}
      <div className="controls-panel">
        <h3>Demo Interactivo: Filtrado y Doble Integracion</h3>
        <div className="controls-row">
          <div className="slider-group">
            <label>Ventana promedio movil: {windowSize} muestras</label>
            <input type="range" min="1" max="21" step="2" value={windowSize}
              onChange={e => setWindowSize(+e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="profile-chart">
          <h4>Senal cruda vs filtrada (aceleracion)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fullData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis label={{ value: 'a (m/s²)', angle: -90, position: 'left' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="raw" stroke="#e53e3e" name="Cruda (con ruido)" dot={false} strokeWidth={1} opacity={0.5} />
              <Line type="monotone" dataKey="filtered" stroke="#2b6cb0" name="Filtrada (promedio movil)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="clean" stroke="#38a169" name="Senal original (referencia)" dot={false} strokeWidth={1} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="profile-chart">
          <h4>Doble integracion: Velocidad y Posicion</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fullData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" label={{ value: 't (s)', position: 'bottom' }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="velocity" stroke="#ed8936" name="Velocidad ∫a·dt (m/s)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="position" stroke="#805ad5" name="Posicion ∫∫a·dt² (m)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
            Observe como el drift acumulativo afecta la posicion — por eso la clasificacion directa con ML es mas robusta.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ===== RED NEURONAL - MARCO TEORICO ===== */
function NeuralNetworkSection() {
  return (
    <div>
      <h2 className="section-title">Marco Teorico: Redes Neuronales</h2>

      {/* Neurona */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>La Neurona Artificial</h3>
        <p style={{ fontSize: 14 }}>
          Una neurona artificial es una unidad de calculo que recibe valores de entrada, los pondera (promedia
          con pesos especificos), les suma un sesgo y aplica una funcion no lineal para producir una salida.
        </p>
        <div className="editable-section" style={{ marginTop: 12 }}>
          <p><strong>Partes:</strong></p>
          <ul style={{ marginLeft: 20, fontSize: 14, lineHeight: 1.8 }}>
            <li><strong>Entradas:</strong> caracteristicas del dato (aceleraciones ax, ay, az o velocidades/posiciones).</li>
            <li><strong>Pesos (w):</strong> que tan importante es cada entrada (ponderado).</li>
            <li><strong>Sesgo (bias b):</strong> desplaza el umbral de activacion.</li>
            <li><strong>Funcion de activacion f:</strong> introduce no linealidad.</li>
          </ul>
          <p style={{ marginTop: 8 }}><strong>Calculo:</strong></p>
          <div className="equation">
            Suma ponderada: z = Σ(wi · xi) + b &nbsp;&nbsp;→&nbsp;&nbsp; Salida: y = f(z)
          </div>
          <p style={{ marginTop: 8 }}><strong>Como "aprende"?</strong> Ajusta pesos w y bias b para reducir
            un error (funcion de perdida), usando <strong>gradiente descendente</strong> y <strong>backpropagation</strong>.</p>
        </div>
      </div>

      {/* Funciones de activacion */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Funciones de Activacion</h3>
        <table>
          <thead>
            <tr><th>Funcion</th><th>Formula</th><th>Rango</th><th>Uso</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>ReLU</strong></td><td>f(x) = max(0, x)</td><td>[0, ∞)</td><td>Capas ocultas (defecto)</td></tr>
            <tr><td><strong>Sigmoide</strong></td><td>f(x) = 1 / (1 + e⁻ˣ)</td><td>(0, 1)</td><td>Clasificacion binaria</td></tr>
            <tr><td><strong>Tanh</strong></td><td>f(x) = (eˣ - e⁻ˣ) / (eˣ + e⁻ˣ)</td><td>(-1, 1)</td><td>Datos centrados en 0</td></tr>
            <tr><td><strong>Softmax</strong></td><td>P(i) = eᶻⁱ / Σ eᶻʲ</td><td>(0, 1), suma = 1</td><td>Capa de salida multiclase</td></tr>
          </tbody>
        </table>
      </div>

      {/* Redes neuronales */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Perceptron Multicapa (MLP)</h3>
        <p style={{ fontSize: 14 }}>
          Las redes neuronales artificiales son modelos capaces de aprender representaciones complejas a
          partir de datos. En este laboratorio se usa una red <strong>feedforward</strong> donde la informacion
          fluye de las entradas (aceleraciones) hasta las salidas (clases de movimiento).
        </p>

        {/* Arquitectura visual */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, padding: 32, flexWrap: 'wrap' }}>
          <LayerViz label="Entrada (3)" neurons={3} names={['ax', 'ay', 'az']} color="#2b6cb0" />
          <Arrow />
          <LayerViz label="Oculta 1 (100)" neurons={5} names={['ReLU', '100 neuronas']} color="#38a169" />
          <Arrow />
          <LayerViz label="Oculta 2 (50)" neurons={4} names={['ReLU', '50 neuronas']} color="#38a169" />
          <Arrow />
          <LayerViz label="Salida (Softmax)" neurons={4} names={['caminar', 'correr', 'saltar', 'quieto']} color="#e53e3e" />
        </div>

        <div className="info-box" style={{ marginTop: 12 }}>
          <strong>Softmax en la salida:</strong> El MLPClassifier tiene automaticamente una neurona de salida tipo
          softmax (<code>clf.out_activation_ = "softmax"</code>) que da una probabilidad por clase.
          La clase predicha es la de mayor probabilidad.
        </div>
      </div>

      {/* Hiperparametros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Hiperparametros del MLPClassifier</h3>
        <table>
          <thead>
            <tr><th>Parametro</th><th>Valor inicial</th><th>Que hace</th><th>Alternativas</th></tr>
          </thead>
          <tbody>
            <tr><td><code>hidden_layer_sizes</code></td><td>(100, 50)</td><td>2 capas ocultas con 100 y 50 neuronas</td><td>(64, 32), (128, 64, 32), etc.</td></tr>
            <tr><td><code>activation</code></td><td>"relu"</td><td>Funcion de activacion en capas ocultas</td><td>"tanh", "logistic"</td></tr>
            <tr><td><code>solver</code></td><td>"adam"</td><td>Optimizador para ajustar pesos</td><td>"sgd", "lbfgs"</td></tr>
            <tr><td><code>max_iter</code></td><td>300</td><td>Numero maximo de epocas de entrenamiento</td><td>100, 500, 1000</td></tr>
            <tr><td><code>test_size</code></td><td>0.2</td><td>20% de datos para prueba</td><td>0.15, 0.25, 0.3</td></tr>
            <tr><td><code>stratify</code></td><td>y</td><td>Mantener proporcion de clases en train/test</td><td>Siempre recomendado</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 8 }}>
          Para el informe: comparar al menos 2 metodos (ej. MLP vs MLP con diferente arquitectura, o MLP vs sin filtrado).
        </p>
      </div>
    </div>
  )
}

function LayerViz({ label, neurons, names, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <strong style={{ fontSize: 12, color: '#718096' }}>{label}</strong>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {Array.from({ length: Math.min(neurons, 6) }, (_, i) => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: '50%', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10, fontWeight: 700, margin: '0 auto'
          }}>
            {i + 1}
          </div>
        ))}
        {neurons > 6 && <div style={{ fontSize: 12, color: '#718096' }}>...</div>}
      </div>
      {names && (
        <div style={{ fontSize: 10, color: '#718096', marginTop: 6 }}>
          {names.map((n, i) => <div key={i}>{n}</div>)}
        </div>
      )}
    </div>
  )
}

function Arrow() {
  return <div style={{ fontSize: 24, color: '#a0aec0' }}>→</div>
}

/* ===== METRICAS Y ENTREGABLES ===== */
function MetricsSection() {
  const movements = ['Caminar', 'Correr', 'Saltar', 'Quieto']
  const confMatrix = [
    [45, 3, 1, 1],
    [2, 42, 4, 2],
    [0, 5, 43, 2],
    [1, 0, 2, 47],
  ]

  const metricsData = [
    { name: 'Accuracy', metodoA: 0.89, metodoB: 0.82 },
    { name: 'F1-macro', metodoA: 0.88, metodoB: 0.81 },
    { name: 'Precision', metodoA: 0.90, metodoB: 0.83 },
    { name: 'Recall', metodoA: 0.87, metodoB: 0.80 },
  ]

  return (
    <div>
      <h2 className="section-title">Metricas de Evaluacion y Formato de Entrega</h2>

      {/* Que reportar */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Resultados a Reportar (segun la guia)</h3>
        <ol style={{ marginLeft: 20, fontSize: 14, lineHeight: 2 }} type="a">
          <li>
            <strong>Descripcion breve de los metodos comparados:</strong>
            <br/>Metodo A: [ej. MLPClassifier (100,50), ReLU, Adam, filtrado pasa-bajas a 5Hz + z-score]
            <br/>Metodo B: [ej. MLP con diferente arquitectura / otro clasificador / misma red sin filtrado]
          </li>
          <li>
            <strong>Tabla de metricas cuantitativas</strong> (conjunto de prueba): accuracy, F1-macro, precision, recall, tiempo de entrenamiento, tiempo de inferencia.
          </li>
          <li><strong>Matrices de confusion</strong> por metodo — indicar clases mas confundidas.</li>
          <li>
            <strong>Graficas teoricas y experimentales unificadas:</strong>
            <ul style={{ marginLeft: 20, marginTop: 4 }}>
              <li>Senales ax, ay, az antes/despues del filtrado (zoom a 2-3 ventanas).</li>
              <li>Ejemplo de ventaneo (si se uso) con su vector de features (media, std, RMS, etc.).</li>
              <li>Curva de perdida del metodo A (opcional) para evidenciar convergencia.</li>
            </ul>
          </li>
          <li><strong>Resumen ejecutivo (3-4 lineas):</strong> conclusion cuantitativa con F1, accuracy y resultado de la secuencia.</li>
        </ol>
      </div>

      {/* Aspectos del analisis */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Aspectos para Incluir en el Analisis de Resultados</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="editable-section">
            <strong>Calidad de datos y ruido</strong>
            <ul style={{ marginLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
              <li>Evidencia del efecto del filtrado: reduccion de varianza en ejes.</li>
              <li>Fuentes de ruido: vibracion del dispositivo, aliasing por fs, cambios de sujecion.</li>
            </ul>
          </div>
          <div className="editable-section">
            <strong>Diseno del preprocesamiento</strong>
            <ul style={{ marginLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
              <li>Justificar corte de pasa-bajas (3-5 Hz).</li>
              <li>Ventana de promedio movil (5 muestras).</li>
              <li>Normalizacion z-score y si combinaste magnitud u otros features.</li>
            </ul>
          </div>
          <div className="editable-section">
            <strong>Comparacion objetiva entre metodos</strong>
            <ul style={{ marginLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
              <li>Interpretar accuracy vs F1-macro (si hay desbalance, priorizar F1-macro).</li>
              <li>Trade-offs: desempeno vs coste computacional.</li>
              <li>Si hiciste ablation (quitar filtrado, cambiar ventana), resume el impacto.</li>
            </ul>
          </div>
          <div className="editable-section">
            <strong>Error analysis</strong>
            <ul style={{ marginLeft: 16, fontSize: 13, lineHeight: 1.8 }}>
              <li>Patrones de confusion (ej. "sentado" vs "quieto").</li>
              <li>Ejemplos de fallos con hipotesis de causa.</li>
              <li>Mejoras: mas datos, mejor fijacion del sensor, ajustar filtro, features frecuenciales.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Graficas de ejemplo */}
      <div className="grid-2">
        <div className="card">
          <h3>Comparacion de Metodos (ejemplo)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="metodoA" fill="#2b6cb0" name="Metodo A (MLP 100,50)" />
              <Bar dataKey="metodoB" fill="#ed8936" name="Metodo B (alternativo)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Matriz de Confusion (ejemplo)</h3>
          <table>
            <thead>
              <tr>
                <th>Pred \ Real</th>
                {movements.map(m => <th key={m}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={m}>
                  <td><strong>{m}</strong></td>
                  {confMatrix[i].map((v, j) => (
                    <td key={j} style={{
                      background: i === j ? '#c6f6d5' : v > 3 ? '#fed7d7' : 'transparent',
                      textAlign: 'center', fontWeight: i === j ? 700 : 400
                    }}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plantilla */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Plantilla de Tabla de Resultados</h3>
        <table>
          <thead>
            <tr><th>Metrica</th><th>Metodo A</th><th>Metodo B</th></tr>
          </thead>
          <tbody>
            <tr><td>Accuracy</td><td>[0.XX]</td><td>[0.XX]</td></tr>
            <tr><td>F1-macro</td><td>[0.XX]</td><td>[0.XX]</td></tr>
            <tr><td>Precision (macro)</td><td>[0.XX]</td><td>[0.XX]</td></tr>
            <tr><td>Recall (macro)</td><td>[0.XX]</td><td>[0.XX]</td></tr>
            <tr><td>Tiempo de entrenamiento</td><td>[s]</td><td>[s]</td></tr>
            <tr><td>Tiempo de inferencia</td><td>[ms/serie]</td><td>[ms/serie]</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          <strong>Criterio de exito:</strong> secuencia ≥ 80% de aciertos.
          Resultado: [Cumple/No cumple] con [XX%].
        </p>
      </div>
    </div>
  )
}
