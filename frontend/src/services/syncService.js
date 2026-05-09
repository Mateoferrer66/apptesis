import { db } from './db';

const API_URL = 'http://localhost:5089/api';

/**
 * Sincroniza las inferencias pendientes con el backend .NET.
 * Se ejecuta automáticamente al detectar conexión, o manualmente por el usuario.
 */
export const syncTelemetry = async () => {
  try {
    const all = await db.inferences.toArray();
    const toSync = all.filter(item => item.synced === false);

    if (toSync.length === 0) return { success: true, count: 0 };

    const payload = {
      inferences: toSync.map(item => ({
        timestamp: item.timestamp,
        pestType: item.pestType,
        confidence: item.confidence
      }))
    };

    const response = await fetch(`${API_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const ids = toSync.map(item => item.id);
      await db.transaction('rw', db.inferences, async () => {
        for (const id of ids) {
          await db.inferences.update(id, { synced: true });
        }
      });
      return { success: true, count: ids.length };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.warn('[Sync] Sin conexión al backend:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene la última versión del modelo desde el backend.
 */
export const fetchLatestModelVersion = async () => {
  try {
    const res = await fetch(`${API_URL}/models/latest`);
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
};
