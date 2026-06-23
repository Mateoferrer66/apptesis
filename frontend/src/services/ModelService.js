import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';

setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/');

let model = null;

// Labels de clasificación de plagas del café
export const PEST_LABELS = [
  { id: 'broca', name: 'Broca del Café', scientific: 'Hypothenemus hampei', risk: 'critical', color: '#dc2626' },
  { id: 'roya', name: 'Roya del Cafeto', scientific: 'Hemileia vastatrix', risk: 'high', color: '#ea580c' },
  { id: 'minador', name: 'Minador de la Hoja', scientific: 'Leucoptera coffeella', risk: 'medium', color: '#d97706' },
  { id: 'antracnosis', name: 'Antracnosis', scientific: 'Colletotrichum spp.', risk: 'medium', color: '#ca8a04' },
  { id: 'healthy', name: 'Planta Sana', scientific: 'Sin plagas detectadas', risk: 'none', color: '#16a34a' },
];

/**
 * Crea un modelo ligero de clasificación directamente en el navegador.
 * Este modelo sirve como placeholder funcional. Cuando se entrene el modelo real
 * con datos de cafetales colombianos, simplemente se reemplaza la carga aquí.
 */
const createLocalModel = () => {
  const localModel = tf.sequential();

  // Bloque convolucional 1
  localModel.add(tf.layers.conv2d({
    inputShape: [96, 96, 3],
    filters: 16,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  localModel.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Bloque convolucional 2
  localModel.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  localModel.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Bloque convolucional 3
  localModel.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  localModel.add(tf.layers.globalAveragePooling2d({}));

  // Clasificador
  localModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  localModel.add(tf.layers.dropout({ rate: 0.3 }));
  localModel.add(tf.layers.dense({ units: PEST_LABELS.length, activation: 'softmax' }));

  localModel.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  return localModel;
};

/**
 * Inicializa el motor de análisis: configura el backend WebAssembly y carga el modelo.
 */
export const initModel = async (onProgress) => {
  if (model) return true;
  try {
    onProgress?.('Configurando WebAssembly...');
    await tf.setBackend('wasm');
    await tf.ready();
    console.log('[AgroVision PWA] Backend activo:', tf.getBackend());

    onProgress?.('Construyendo modelo de clasificación...');
    model = createLocalModel();

    // Warm-up run para pre-compilar los kernels WASM
    onProgress?.('Optimizando rendimiento...');
    const warmup = tf.zeros([1, 96, 96, 3]);
    const warmupResult = model.predict(warmup);
    warmupResult.dispose();
    warmup.dispose();

    console.log('[AgroVision PWA] Modelo listo. Parámetros:', model.countParams());
    onProgress?.('¡Motor de análisis listo!');
    return true;
  } catch (error) {
    console.error('[AgroVision PWA] Error al inicializar:', error);
    onProgress?.('Error al cargar el modelo.');
    return false;
  }
};

/**
 * Ejecuta la inferencia sobre una imagen capturada.
 * Retorna el tipo de plaga detectado y la confianza.
 */
export const predictPest = async (imageElement) => {
  if (!model) throw new Error('Modelo no inicializado');

  const startTime = performance.now();

  const tensor = tf.tidy(() => {
    const img = tf.browser.fromPixels(imageElement);
    const resized = tf.image.resizeBilinear(img, [96, 96]);
    const normalized = resized.div(255.0);
    return normalized.expandDims(0);
  });

  try {
    const output = model.predict(tensor);
    const probabilities = await output.data();
    output.dispose();

    const inferenceTime = Math.round(performance.now() - startTime);

    // Encontrar las top-3 predicciones
    const indexed = Array.from(probabilities).map((p, i) => ({ index: i, probability: p }));
    indexed.sort((a, b) => b.probability - a.probability);
    const top3 = indexed.slice(0, 3);

    const primary = top3[0];
    const pestInfo = PEST_LABELS[primary.index];

    return {
      pestType: pestInfo.name,
      pestId: pestInfo.id,
      scientific: pestInfo.scientific,
      risk: pestInfo.risk,
      color: pestInfo.color,
      confidence: primary.probability,
      inferenceTimeMs: inferenceTime,
      allPredictions: top3.map(p => ({
        ...PEST_LABELS[p.index],
        probability: p.probability
      }))
    };
  } finally {
    tensor.dispose();
  }
};

/**
 * Retorna métricas del motor de análisis.
 */
export const getModelInfo = () => {
  return {
    backend: tf.getBackend() || 'no iniciado',
    params: model ? model.countParams() : 0,
    inputShape: '96x96x3 RGB',
    classes: PEST_LABELS.length,
    labels: PEST_LABELS.map(l => l.name)
  };
};
