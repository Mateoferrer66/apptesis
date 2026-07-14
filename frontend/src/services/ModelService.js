import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { getCurrentModel, getDiseaseCatalog, getHeaders, API_URL } from './apiService';

setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.22.0/dist/');

let model = null;

// Labels de clasificación de plagas del café (Fallback)
export let PEST_LABELS = [
  { id: '', name: 'Broca del Café', scientific: 'Hypothenemus hampei', risk: 'critical', color: '#dc2626' },
  { id: '', name: 'Roya del Cafeto', scientific: 'Hemileia vastatrix', risk: 'high', color: '#ea580c' },
  { id: '', name: 'Minador de la Hoja', scientific: 'Leucoptera coffeella', risk: 'medium', color: '#d97706' },
  { id: '', name: 'Antracnosis', scientific: 'Colletotrichum spp.', risk: 'medium', color: '#ca8a04' },
  { id: '', name: 'Planta Sana', scientific: 'Sin plagas detectadas', risk: 'none', color: '#16a34a' },
];

try {
  const cachedLabels = localStorage.getItem('agrovision_pest_labels');
  if (cachedLabels) {
    PEST_LABELS = JSON.parse(cachedLabels);
  }
} catch (e) {
  console.warn('No se pudo cargar PEST_LABELS cacheadas', e);
}

/**
 * Intenta actualizar las etiquetas (PEST_LABELS) desde el backend
 */
const updateLabelsFromBackend = async () => {
  try {
    const res = await getDiseaseCatalog();
    if (res.success && res.data) {
      // Extraemos el array si está anidado (formato .NET)
      const dataArr = Array.isArray(res.data) ? res.data : (res.data.$values || (res.data.data ? (Array.isArray(res.data.data) ? res.data.data : res.data.data.$values) : []));
      
      if (dataArr && dataArr.length > 0) {
        // Mapear los datos del backend a nuestro formato interno
        const remoteLabels = dataArr.map(d => ({
          id: d.id || d.Id,
          name: d.name || d.commonName || d.common_name,
          scientific: d.scientificName || d.scientific_name || 'Desconocido'
        }));

        // Reemplazamos los IDs hardcodeados por los IDs reales de la base de datos
        PEST_LABELS = PEST_LABELS.map(localLabel => {
          // Buscamos una coincidencia (ej: "Broca", "Roya", "Minador", "Antracnosis", "Planta")
          const keyword = localLabel.name.split(' ')[0].toLowerCase();
          const match = remoteLabels.find(r => 
            (r.name && r.name.toLowerCase().includes(keyword)) || 
            (r.scientific && r.scientific.toLowerCase().includes(keyword)) ||
            (localLabel.name === 'Planta Sana' && (r.name || '').toLowerCase().includes('sana'))
          );

          if (match) {
            return { ...localLabel, id: match.id };
          }
          return localLabel;
        });

        // Guardar las etiquetas en localStorage por si después estamos offline
        localStorage.setItem('agrovision_pest_labels', JSON.stringify(PEST_LABELS));
      }
    }
  } catch (error) {
    console.warn('[AgroVision PWA] No se pudo obtener el catálogo de plagas remoto:', error);
  }
};

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
 * Verifica si hay una nueva versión del modelo de IA en el servidor,
 * la descarga y la almacena en caché (HU10, HU11).
 */
export const checkForModelUpdates = async (onProgress) => {
  if (!navigator.onLine) return false;
  try {
    const res = await getCurrentModel();
    if (!res.success) return false;
    
    const latestModel = res.data;
    if (!latestModel || !latestModel.version) return false;

    const localVersion = localStorage.getItem('agrovision_model_version');
    
    if (!localVersion || latestModel.version !== localVersion) {
      onProgress?.(`Descargando nuevo modelo v${latestModel.version}...`);
      
      try {
        // Extraemos la URL base o usamos el endpoint de swagger para el JSON
        let MODEL_URL = `${API_URL}/models/current/model-json`;
        if (latestModel.modelJsonPath) {
          const baseUrl = API_URL.replace(/\/api$/, '');
          MODEL_URL = `${baseUrl}${latestModel.modelJsonPath}`;
        }
        
        // TF.js descargará model.json y luego automáticamente weights.bin 
        // basado en las rutas relativas dentro de model.json
        const newModel = await tf.loadLayersModel(MODEL_URL, {
          requestInit: { headers: getHeaders() }
        });
        
        // Guardamos el modelo descargado en IndexedDB
        await newModel.save('indexeddb://agrovision-model');
        model = newModel; // Actualizamos el modelo en memoria
        
        // Guardar la nueva versión en local
        localStorage.setItem('agrovision_model_version', latestModel.version);
        onProgress?.('Modelo actualizado correctamente.');
        return true;
      } catch (err) {
        console.error('Error descargando modelo remoto, usando fallback:', err);
        // Si hay error, intentamos con el modelo local solo si no teníamos modelo previo
        if (!model) {
          model = createLocalModel();
          await model.save('indexeddb://agrovision-model');
        }
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('[AgroVision PWA] Error verificando modelo:', error);
    return false;
  }
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
    
    // Intentar actualizar etiquetas desde backend si hay conexión
    if (navigator.onLine) {
      await updateLabelsFromBackend();
    }

    try {
      model = await tf.loadLayersModel('indexeddb://agrovision-model');
      onProgress?.('Modelo cargado desde caché local.');
    } catch (e) {
      onProgress?.('Construyendo modelo base...');
      model = createLocalModel();
      await model.save('indexeddb://agrovision-model').catch(() => {});
    }

    // Warm-up run para pre-compilar los kernels WASM (Optimización CA01, CA02)
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
