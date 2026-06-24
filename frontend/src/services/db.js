import Dexie from 'dexie';

/**
 * Base de datos IndexedDB para AgroVision PWA.
 * Modelo de datos alineado con el esquema relacional del backend:
 *
 * Entidades principales:
 *  - organizations:      Organizaciones/cooperativas cafeteras
 *  - farms:              Fincas pertenecientes a una organización
 *  - plots:              Lotes dentro de una finca
 *  - profiles:           Perfiles de usuario (inspectores, admins)
 *  - user_organizations: Relación muchos-a-muchos usuarios ↔ organizaciones
 *  - inspections:        Inspecciones realizadas en un lote por un inspector
 *  - disease_catalog:    Catálogo de enfermedades/plagas conocidas
 *  - images:             Imágenes capturadas durante una inspección
 *  - observations:       Observaciones manuales con severidad
 *  - inference_results:  Resultados de inferencia sobre imágenes
 *  - devices:            Dispositivos registrados para sincronización
 *  - sync_events:        Eventos de sincronización por dispositivo
 *  - conflict_logs:      Registro de conflictos de sincronización
 */
export const db = new Dexie('AgroVisionDB');

db.version(3).stores({
  // === Almacén para blobs de imágenes pesadas ===
  imagesStore: 'id',
  
  // === Entidades del modelo de datos ===

  // Organizaciones cafeteras
  organizations: 'id, name, type, created_at',

  // Fincas
  farms: 'id, organization_id, name, municipality, area_ha',

  // Lotes dentro de fincas
  plots: 'id, farm_id, code, variety',

  // Perfiles de usuario
  profiles: 'id, full_name, role, created_at',

  // Relación usuario ↔ organización
  user_organizations: 'id, user_id, organization_id, role, joined_at',

  // Inspecciones
  inspections: 'id, plot_id, inspector_id, inspection_date, sync_status',

  // Catálogo de enfermedades / plagas
  disease_catalog: 'id, common_name, scientific_name, category',

  // Imágenes capturadas
  images: 'id, inspection_id, file_uri, mime_type, width, height, device_id',

  // Observaciones del inspector
  observations: 'id, inspection_id, disease_id, severity_level, incidence_percent, source_type',

  // Resultados de inferencia
  inference_results: 'id, image_id, model_name, model_version, predicted_disease_id, confidence, top_k_json',

  // Dispositivos registrados
  devices: 'id, user_id, device_name, platform',

  // Eventos de sincronización
  sync_events: 'id, device_id, entity_name, entity_id, sync_status',

  // Conflictos de sincronización
  conflict_logs: 'id, entity_name, entity_id, resolution_strategy',

  // === Tabla legacy de inferencias rápidas (compatibilidad) ===
  inferences: '++id, timestamp, pestType, pestId, confidence, risk, synced',

  // Configuración local
  settings: 'key',
});

// =========================================================================
// Helpers CRUD — compatibles con el modelo anterior
// =========================================================================

/**
 * Guardar una inferencia rápida (flujo de escaneo offline).
 */
export const saveInference = async (prediction, imageDataUrl = null) => {
  return db.inferences.add({
    timestamp: new Date().toISOString(),
    pestType: prediction.pestType,
    pestId: prediction.pestId,
    scientific: prediction.scientific,
    risk: prediction.risk,
    confidence: prediction.confidence,
    inferenceTimeMs: prediction.inferenceTimeMs,
    imagePreview: imageDataUrl,
    synced: false,
  });
};

/**
 * Obtener todas las inferencias, más recientes primero.
 */
export const getInferences = async (limit = 50) => {
  return db.inferences.orderBy('id').reverse().limit(limit).toArray();
};

/**
 * Obtener estadísticas de las detecciones.
 */
export const getStats = async () => {
  const all = await db.inferences.toArray();
  const total = all.length;
  const synced = all.filter(i => i.synced).length;
  const pending = total - synced;

  // Conteo por tipo de plaga
  const byPest = {};
  const byRisk = { critical: 0, high: 0, medium: 0, none: 0 };
  const last7Days = [];

  all.forEach(item => {
    // Por plaga
    byPest[item.pestType] = (byPest[item.pestType] || 0) + 1;
    // Por riesgo
    if (byRisk[item.risk] !== undefined) byRisk[item.risk]++;
  });

  // Últimos 7 días
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    const count = all.filter(item => item.timestamp.startsWith(dayStr)).length;
    last7Days.push({ date: dayStr, count });
  }

  return { total, synced, pending, byPest, byRisk, last7Days };
};

/**
 * Eliminar todos los datos locales.
 */
export const clearAllData = async () => {
  await db.inferences.clear();
};

// =========================================================================
// Helpers para el modelo de datos completo
// =========================================================================

/**
 * Guardar una inspección completa con sus imágenes y observaciones.
 */
export const saveInspection = async (inspection, images = [], observations = []) => {
  return db.transaction('rw', [db.inspections, db.images, db.observations], async () => {
    const inspectionId = inspection.id || crypto.randomUUID();
    await db.inspections.put({
      ...inspection,
      id: inspectionId,
      sync_status: 'pending',
      inspection_date: inspection.inspection_date || new Date().toISOString(),
    });

    for (const img of images) {
      await db.images.put({
        ...img,
        id: img.id || crypto.randomUUID(),
        inspection_id: inspectionId,
      });
    }

    for (const obs of observations) {
      await db.observations.put({
        ...obs,
        id: obs.id || crypto.randomUUID(),
        inspection_id: inspectionId,
      });
    }

    return inspectionId;
  });
};

/**
 * Obtener inspecciones pendientes de sincronización.
 */
export const getPendingInspections = async () => {
  return db.inspections.where('sync_status').equals('pending').toArray();
};

/**
 * Registrar un evento de sincronización.
 */
export const logSyncEvent = async (deviceId, entityName, entityId, status) => {
  return db.sync_events.add({
    id: crypto.randomUUID(),
    device_id: deviceId,
    entity_name: entityName,
    entity_id: entityId,
    sync_status: status,
  });
};

/**
 * Registrar un conflicto de sincronización.
 */
export const logConflict = async (entityName, entityId, strategy) => {
  return db.conflict_logs.add({
    id: crypto.randomUUID(),
    entity_name: entityName,
    entity_id: entityId,
    resolution_strategy: strategy,
  });
};

/**
 * Guardar un resultado de inferencia vinculado a una imagen.
 */
export const saveInferenceResult = async (result) => {
  return db.inference_results.put({
    id: result.id || crypto.randomUUID(),
    image_id: result.image_id || result.imageId,
    model_name: result.model_name || result.modelName,
    model_version: result.model_version || result.modelVersion,
    predicted_disease_id: result.predicted_disease_id || result.predictedDiseaseId,
    confidence: result.confidence,
    top_k_json: result.top_k_json || result.topKJson,
  });
};

/**
 * Obtener todas las inspecciones con sus imágenes y resultados de inferencia.
 * Base para el Historial Local-First.
 */
export const getAllInspectionsWithDetails = async () => {
  const inspections = await db.inspections.orderBy('inspection_date').reverse().toArray();
  const images = await db.images.toArray();
  const inferences = await db.inference_results.toArray();
  
  const imagesByInspection = {};
  images.forEach(img => {
    if (!imagesByInspection[img.inspection_id]) imagesByInspection[img.inspection_id] = [];
    const inference = inferences.find(inf => inf.image_id === img.file_uri || inf.image_id === img.id);
    imagesByInspection[img.inspection_id].push({
      ...img,
      inference: inference || null
    });
  });

  return inspections.map(insp => ({
    ...insp,
    images: imagesByInspection[insp.id] || []
  }));
};

/**
 * Seed del catálogo de enfermedades con las plagas conocidas.
 */
export const seedDiseaseCatalog = async () => {
  const count = await db.disease_catalog.count();
  if (count > 0) return; // Already seeded

  const diseases = [
    { id: 'broca', common_name: 'Broca del Café', scientific_name: 'Hypothenemus hampei', category: 'insecto' },
    { id: 'roya', common_name: 'Roya del Cafeto', scientific_name: 'Hemileia vastatrix', category: 'hongo' },
    { id: 'minador', common_name: 'Minador de la Hoja', scientific_name: 'Leucoptera coffeella', category: 'insecto' },
    { id: 'antracnosis', common_name: 'Antracnosis', scientific_name: 'Colletotrichum spp.', category: 'hongo' },
    { id: 'healthy', common_name: 'Planta Sana', scientific_name: 'Sin plagas detectadas', category: 'ninguna' },
  ];

  await db.disease_catalog.bulkAdd(diseases);
};
// =========================================================================
// Helpers para almacenar y recuperar Blobs de imágenes (Imágenes pesadas)
// =========================================================================

/**
 * Guarda un Blob de imagen en la tabla imagesStore con una clave (id) dada.
 */
export const saveImageBlob = async (id, blob) => {
  return db.imagesStore.put({ id, blob });
};

/**
 * Recupera un Blob de imagen de la tabla imagesStore dado su id.
 */
export const getImageBlob = async (id) => {
  const record = await db.imagesStore.get(id);
  return record ? record.blob : null;
};
