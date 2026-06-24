import { db, getPendingInspections, getImageBlob, logConflict } from './db';
import { createInspection, createInspectionImage, createInferenceResult } from './apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5089/api';

/**
 * Sincroniza todas las inspecciones, imágenes e inferencias pendientes.
 * CA01, CA02, CA03, CA04, CA05 (Sincronización Automática Robusta y Manejo de Errores)
 */
export const syncAllPendingData = async () => {
  if (!navigator.onLine) return { success: false, error: 'Offline' };
  
  try {
    const pendingInspections = await getPendingInspections();
    let syncedCount = 0;
    
    const allImages = await db.images.toArray();
    const allInferences = await db.inference_results.toArray();

    for (const insp of pendingInspections) {
      try {
        // 1. Crear la inspección en el backend
        const reqData = {
          plotId: insp.plot_id || insp.plotId,
          inspectorId: insp.inspector_id || insp.inspectorId,
          inspectionDate: insp.inspection_date || insp.inspectionDate || new Date().toISOString()
        };
        
        const inspRes = await createInspection(reqData);
        if (!inspRes.success) throw new Error(inspRes.error || 'Failed to sync inspection');
        
        const realInspectionId = inspRes.data.id;
        
        // 2. Enviar sus imágenes asociadas
        const inspImages = allImages.filter(img => img.inspection_id === insp.id);
        for (const img of inspImages) {
          const blob = await getImageBlob(img.file_uri);
          if (blob) {
            const formData = new FormData();
            formData.append('File', blob, `image_sync.jpg`);
            await createInspectionImage(realInspectionId, formData);
            
            // 3. Enviar inferencia
            const inference = allInferences.find(inf => inf.image_id === img.file_uri);
            if (inference) {
              await createInferenceResult({
                imageId: img.file_uri,
                modelName: inference.model_name,
                modelVersion: inference.model_version,
                predictedDiseaseId: inference.predicted_disease_id,
                confidence: inference.confidence,
                topKJson: inference.top_k_json
              });
            }
          }
        }
        
        // 4. Marcar como sincronizado
        await db.inspections.update(insp.id, { sync_status: 'synced' });
        syncedCount++;
      } catch (err) {
        console.error(`[Sync] Error sincronizando inspección ${insp.id}:`, err);
        await logConflict('inspection', insp.id, 'retry_later');
      }
    }
    
    // Además, sincronizar la telemetría legacy
    await syncTelemetry();
    
    return { success: true, count: syncedCount };
  } catch (error) {
    console.error('[Sync] Error fatal:', error);
    return { success: false, error: error.message };
  }
};

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
