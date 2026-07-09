import { db, getPendingInspections, getImageBlob, logConflict } from './db';
import { syncBulk, getCurrentModel } from './apiService';

const API_URL = 'https://tfe-agrovisionpwa.onrender.com/api';

/**
 * Genera o recupera un ID de dispositivo para la sincronización.
 */
import { generateUUID } from '../utils/uuid';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('agrovision_device_id');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('agrovision_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Sincroniza todas las inspecciones, imágenes e inferencias pendientes usando SyncBulk.
 * CA01, CA02, CA03, CA04, CA05 (Sincronización Automática Robusta y Manejo de Errores)
 */
export const syncAllPendingData = async () => {
  if (!navigator.onLine) return { success: false, error: 'Offline' };
  
  try {
    const pendingInspections = await getPendingInspections();
    const allImages = await db.images.toArray();
    const allInferences = await db.inference_results.toArray();
    const allObservations = await db.observations.toArray();
    const legacyInferences = await db.inferences.toArray(); // Telemetría
    
    const deviceId = getDeviceId();
    
    // Preparar DTOs
    const inspectionsDto = [];
    const imagesDto = [];
    const observationsDto = [];
    const inferenceResultsDto = [];
    const telemetriesDto = [];
    
    const toUpdateInspections = [];
    const toUpdateTelemetries = [];
    
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    
    const legacyDiseaseMap = {
      'broca': '11111111-1111-1111-1111-111111111111',
      'roya': '22222222-2222-2222-2222-222222222222',
      'minador': '33333333-3333-3333-3333-333333333333',
      'antracnosis': '44444444-4444-4444-4444-444444444444',
      'healthy': '55555555-5555-5555-5555-555555555555'
    };
    const getValidDiseaseId = (id) => isUUID(id) ? id : (legacyDiseaseMap[id] || '00000000-0000-0000-0000-000000000000');
    const getValidUUID = (id) => isUUID(id) ? id : '00000000-0000-0000-0000-000000000000';
    
    // Mapear Inspecciones
    for (const insp of pendingInspections) {
      let safeInspId = insp.id;
      if (!isUUID(safeInspId)) {
        safeInspId = generateUUID();
        // Replace in DB because IndexedDB can't update primary keys
        await db.inspections.delete(insp.id);
        const updatedInsp = { ...insp, id: safeInspId };
        await db.inspections.put(updatedInsp);
      }

      const validPlotId = getValidUUID(insp.plot_id || insp.plotId);
      if (validPlotId === '00000000-0000-0000-0000-000000000000') {
        console.warn(`[Sync] Skipping inspection ${insp.id} because it uses an offline/fallback plot ID that doesn't exist on the server. Marking as synced to prevent infinite retry.`);
        toUpdateInspections.push({ old: insp.id, new: safeInspId });
        continue; // Skip this inspection and its children from being sent to server
      }

      const validInspectorId = getValidUUID(insp.inspector_id || insp.inspectorId);
      
      if (validInspectorId === '00000000-0000-0000-0000-000000000000') {
        console.warn(`[Sync] Skipping inspection ${insp.id} because it uses an offline/fake inspector ID. Marking as synced.`);
        toUpdateInspections.push({ old: insp.id, new: safeInspId });
        continue; // Skip this inspection and its children from being sent to server
      }

      const inspectionDto = {
        id: safeInspId,
        plotId: validPlotId,
        inspectorId: validInspectorId,
        inspectionDate: insp.inspection_date || insp.inspectionDate || new Date().toISOString()
      };

      inspectionsDto.push(inspectionDto);
      toUpdateInspections.push({ old: insp.id, new: safeInspId });
      
      // Mapear Imágenes relacionadas
      const inspImages = allImages.filter(img => img.inspection_id === insp.id);
      for (const img of inspImages) {
        const safeImgId = isUUID(img.id) ? img.id : generateUUID();
        imagesDto.push({
          id: safeImgId,
          inspectionId: safeInspId,
          fileUri: img.file_uri,
          mimeType: img.mime_type || 'image/jpeg',
          width: img.width || 1,
          height: img.height || 1,
          deviceId: deviceId
        });
        
        // Mapear Inferencia de la imagen
        const inference = allInferences.find(inf => inf.image_id === img.file_uri || inf.image_id === img.id);
        if (inference) {
          const validPredictedDiseaseId = getValidDiseaseId(inference.predicted_disease_id);
          if (validPredictedDiseaseId === '00000000-0000-0000-0000-000000000000' || validPredictedDiseaseId.startsWith('1111') || validPredictedDiseaseId.startsWith('2222') || validPredictedDiseaseId.startsWith('3333') || validPredictedDiseaseId.startsWith('4444') || validPredictedDiseaseId.startsWith('5555')) {
             console.warn('[Sync] Skipping inference result due to fake disease ID:', validPredictedDiseaseId);
          } else {
            const inferenceDto = {
              id: isUUID(inference.id) ? inference.id : generateUUID(),
              imageId: safeImgId,
              modelName: inference.model_name || 'broca_detect_v1',
              modelVersion: inference.model_version || 'v1.0.0',
              predictedDiseaseId: validPredictedDiseaseId,
              confidence: inference.confidence || 0,
              topKJson: inference.top_k_json || '[]',
              inferenceTimeMs: inference.inferenceTimeMs || 0,
              tfBackend: inference.tfBackend || 'wasm',
              deviceMemoryGb: navigator.deviceMemory || 0
            };
            inferenceResultsDto.push(inferenceDto);
          }
        }
      }
      
      // Mapear Observaciones
      const inspObs = allObservations.filter(obs => obs.inspection_id === insp.id);
      for (const obs of inspObs) {
        const validDiseaseId = getValidDiseaseId(obs.disease_id || obs.diseaseId);
        if (validDiseaseId === '00000000-0000-0000-0000-000000000000' || validDiseaseId.startsWith('1111') || validDiseaseId.startsWith('2222') || validDiseaseId.startsWith('3333') || validDiseaseId.startsWith('4444') || validDiseaseId.startsWith('5555')) {
           console.warn('[Sync] Skipping observation due to fake disease ID:', validDiseaseId);
        } else {
          const obsDto = {
            id: isUUID(obs.id) ? obs.id : generateUUID(),
            inspectionId: safeInspId,
            diseaseId: validDiseaseId,
            severityLevel: obs.severity_level || obs.severityLevel || 1,
            incidencePercent: obs.incidence_percent || obs.incidencePercent || 0,
            sourceType: obs.source_type || obs.sourceType || 'Manual'
          };
          observationsDto.push(obsDto);
        }
      }
    }
    
    // Mapear Telemetría Legacy
    const pendingTelemetry = legacyInferences.filter(item => item.synced === false);
    for (const item of pendingTelemetry) {
      telemetriesDto.push({
        id: generateUUID(),
        timestamp: item.timestamp,
        pestType: item.pestType,
        confidence: item.confidence,
        inferenceTimeMs: item.inferenceTimeMs || 0,
        inspectionCount: 1,
        deviceHash: deviceId
      });
      toUpdateTelemetries.push(item.id);
    }
    
    // Si no hay nada que sincronizar, retornamos éxito
    if (inspectionsDto.length === 0 && telemetriesDto.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Enviar el SyncBulk
    const bulkPayload = {
      deviceId,
      inspections: inspectionsDto,
      images: imagesDto,
      observations: observationsDto,
      inferenceResults: inferenceResultsDto,
      telemetries: telemetriesDto
    };
    
    const bulkRes = await syncBulk(bulkPayload);
    
    if (bulkRes.success) {
      // Marcar todo como sincronizado en IndexedDB
      for (const idObj of toUpdateInspections) {
        await db.inspections.update(idObj.new, { sync_status: 'synced' });
      }
      for (const id of toUpdateTelemetries) {
        await db.inferences.update(id, { synced: true });
      }
      
      return { success: true, count: inspectionsDto.length + telemetriesDto.length };
    } else {
      const errorMsg = typeof bulkRes.error === 'string' ? bulkRes.error : JSON.stringify(bulkRes.error || 'Error desconocido en syncBulk');
      console.error('[Sync] syncBulk falló:', errorMsg);
      return { success: false, error: errorMsg };
    }
    
  } catch (error) {
    console.error('[Sync] Error fatal:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene la última versión del modelo desde el backend.
 */
export const fetchLatestModelVersion = async () => {
  try {
    const res = await getCurrentModel();
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
};

