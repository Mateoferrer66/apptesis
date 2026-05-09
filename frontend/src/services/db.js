import Dexie from 'dexie';

export const db = new Dexie('PlagasCafeDB');

db.version(1).stores({
  inferences: '++id, timestamp, pestType, pestId, confidence, risk, synced',
  settings: 'key'
});

/**
 * Guardar una inferencia en IndexedDB.
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
    synced: false
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
