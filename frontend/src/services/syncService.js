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

      inspectionsDto.push({
        id: safeInspId,
        plotId: insp.plot_id || insp.plotId,
        inspectorId: insp.inspector_id || insp.inspectorId,
        inspectionDate: insp.inspection_date || insp.inspectionDate || new Date().toISOString()
      });
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
          width: img.width || 0,
          height: img.height || 0,
          deviceId: deviceId
        });
        
        // Mapear Inferencia de la imagen
        const inference = allInferences.find(inf => inf.image_id === img.file_uri || inf.image_id === img.id);
        if (inference) {
          inferenceResultsDto.push({
            id: inference.id || generateUUID(),
            imageId: img.file_uri,
            modelName: inference.model_name,
            modelVersion: inference.model_version,
            predictedDiseaseId: inference.predicted_disease_id,
            confidence: inference.confidence,
            topKJson: inference.top_k_json,
            inferenceTimeMs: inference.inferenceTimeMs || 0,
            tfBackend: inference.tfBackend || 'wasm',
            deviceMemoryGb: navigator.deviceMemory || 0
          });
        }
      }
      
      // Mapear Observaciones
      const inspObs = allObservations.filter(obs => obs.inspection_id === insp.id);
      for (const obs of inspObs) {
        observationsDto.push({
          id: isUUID(obs.id) ? obs.id : generateUUID(),
          inspectionId: safeInspId,
          diseaseId: obs.disease_id || obs.diseaseId,
          severityLevel: obs.severity_level || obs.severityLevel,
          incidencePercent: obs.incidence_percent || obs.incidencePercent,
          sourceType: obs.source_type || obs.sourceType || 'manual'
        });
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
      throw new Error(bulkRes.error || 'Error en syncBulk');
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

