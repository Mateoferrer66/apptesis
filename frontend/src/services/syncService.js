import { db, getPendingInspections, getPendingImages, getPendingObservations, getPendingInferences, getImageBlob, logConflict } from './db';
import { syncBulk, getCurrentModel, getPlots, getDiseaseCatalog, getMe } from './apiService';
import { generateUUID } from '../utils/uuid';
import { PEST_LABELS } from './ModelService';

const API_URL = 'https://tfe-agrovisionpwa.onrender.com/api';

/**
 * Genera o recupera un ID de dispositivo para la sincronización.
 */
const getDeviceId = () => {
  let deviceId = localStorage.getItem('agrovision_device_id');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('agrovision_device_id', deviceId);
  }
  return deviceId;
};

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

/**
 * Sincroniza todas las inspecciones, imágenes e inferencias pendientes usando SyncBulk.
 * CA01, CA02, CA03, CA04, CA05 (Sincronización Automática Robusta y Manejo de Errores)
 */
export const syncAllPendingData = async () => {
  if (!navigator.onLine) return { success: false, error: 'Offline' };
  
  try {
    const pendingInspections = await getPendingInspections();
    const pendingImages = await getPendingImages();
    const pendingInferences = await getPendingInferences();
    const pendingObservations = await getPendingObservations();
    const legacyInferences = await db.inferences.toArray(); // Telemetría
    const diseaseCatalog = await db.disease_catalog.toArray();
    
    const deviceId = getDeviceId();
    
    // Preparar DTOs
    const inspectionsDto = [];
    const imagesDto = [];
    const observationsDto = [];
    const inferenceResultsDto = [];
    const telemetriesDto = [];
    
    const toUpdateInspections = [];
    const toUpdateImages = [];
    const toUpdateObservations = [];
    const toUpdateInferences = [];
    const toUpdateTelemetries = [];
    
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    const getValidUUID = (id) => isUUID(id) ? id : EMPTY_GUID;

    const getRealDiseaseId = (fakeIdOrName) => {
      if (!fakeIdOrName) return EMPTY_GUID;
      
      let nameToSearch = fakeIdOrName;
      // Buscar si es un ID falso mapeado en PEST_LABELS
      const pestLabel = PEST_LABELS.find(p => p.id === fakeIdOrName || p.name === fakeIdOrName || p.pestType === fakeIdOrName);
      if (pestLabel) {
        nameToSearch = pestLabel.name;
      }

      // Buscar en el catálogo de la DB local usando el nombre
      const catalogEntry = diseaseCatalog.find(c => 
        (c.common_name && c.common_name.toLowerCase() === nameToSearch.toLowerCase()) || 
        (c.commonName && c.commonName.toLowerCase() === nameToSearch.toLowerCase()) ||
        (c.id === fakeIdOrName && isUUID(c.id)) // Por si ya era un ID real del catálogo
      );

      if (catalogEntry && isUUID(catalogEntry.id)) {
        return catalogEntry.id;
      }
      
      // Si fakeIdOrName ya es un UUID válido, lo devolvemos en lugar de descartarlo
      if (isUUID(fakeIdOrName)) {
        return fakeIdOrName;
      }
      
      return EMPTY_GUID;
    };

    // Resolve fallback Plot
    const allPlots = await db.plots.toArray();
    let fallbackPlotId = EMPTY_GUID;
    if (allPlots.length > 0 && isUUID(allPlots[0].id) && allPlots[0].id !== EMPTY_GUID) {
        fallbackPlotId = allPlots[0].id;
    }
    if (fallbackPlotId === EMPTY_GUID && navigator.onLine) {
      try {
        const pRes = await getPlots();
        if (pRes.success && pRes.data && pRes.data.length > 0) {
          const validPlots = pRes.data.filter(p => isUUID(p.id) && p.id !== EMPTY_GUID);
          if (validPlots.length > 0) fallbackPlotId = validPlots[0].id;
        }
      } catch(e) {}
    }

    let currentUser = null;
    try {
      const userStr = localStorage.getItem('agrovision_user');
      if (userStr) currentUser = JSON.parse(userStr);
    } catch (e) { }

    // Resolve fallback Inspector
    let fallbackInspectorId = EMPTY_GUID;
    if (currentUser) {
       const possibleIds = [
         currentUser.profileId, currentUser.id, 
         currentUser.rawResponse?.profileId, currentUser.rawResponse?.data?.profileId,
         currentUser.rawResponse?.id, currentUser.rawResponse?.data?.id
       ];
       for (const pid of possibleIds) {
           if (isUUID(pid) && pid !== EMPTY_GUID) {
               fallbackInspectorId = pid;
               break;
           }
       }
    }
    if (fallbackInspectorId === EMPTY_GUID) {
        const allProfiles = await db.profiles.toArray();
        if (allProfiles.length > 0 && isUUID(allProfiles[0].id) && allProfiles[0].id !== EMPTY_GUID) {
            fallbackInspectorId = allProfiles[0].id;
        }
    }
    if (fallbackInspectorId === EMPTY_GUID && navigator.onLine) {
        try {
            const meRes = await getMe();
            if (meRes.success && meRes.data) {
                const possibleIds = [meRes.data.profileId, meRes.data.id, meRes.data.userId];
                for (const pid of possibleIds) {
                    if (isUUID(pid) && pid !== EMPTY_GUID) {
                        fallbackInspectorId = pid;
                        break;
                    }
                }
            }
        } catch(e) {}
    }

    // Resolve fallback Disease
    let fallbackDiseaseId = EMPTY_GUID;
    if (diseaseCatalog.length > 0 && isUUID(diseaseCatalog[0].id) && diseaseCatalog[0].id !== EMPTY_GUID) {
        fallbackDiseaseId = diseaseCatalog[0].id;
    }
    if (fallbackDiseaseId === EMPTY_GUID && navigator.onLine) {
      try {
        const dRes = await getDiseaseCatalog();
        if (dRes.success && dRes.data && dRes.data.length > 0) {
          const validDiseases = dRes.data.filter(d => isUUID(d.id) && d.id !== EMPTY_GUID);
          if (validDiseases.length > 0) fallbackDiseaseId = validDiseases[0].id;
        }
      } catch(e) {}
    }

    let hasIncompleteData = false;

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

      let validPlotId = getValidUUID(insp.plot_id || insp.plotId);
      if (validPlotId === EMPTY_GUID) {
        validPlotId = fallbackPlotId;
      }

      let validInspectorId = getValidUUID(insp.inspector_id || insp.inspectorId);
      
      // Intentar obtener del usuario logueado si está vacío
      if (validInspectorId === EMPTY_GUID && currentUser && isUUID(currentUser.id) && currentUser.id !== EMPTY_GUID) {
        validInspectorId = currentUser.id;
      }
      
      if (validInspectorId === EMPTY_GUID) {
        validInspectorId = fallbackInspectorId;
      }

      // Si después de todos los fallbacks aún no hay ID válido, ignorar silenciosamente y dejar en pendiente
      if (validPlotId === EMPTY_GUID || validInspectorId === EMPTY_GUID) {
         hasIncompleteData = true;
         continue; 
      }

      const inspectionDto = {
        id: safeInspId,
        plotId: validPlotId,
        inspectorId: validInspectorId,
        inspectionDate: insp.inspection_date || insp.inspectionDate || new Date().toISOString()
      };

      inspectionsDto.push(inspectionDto);
      toUpdateInspections.push({ old: insp.id, new: safeInspId });
    }
    
    // Mapear Imágenes Pendientes
    for (const img of pendingImages) {
      const safeImgId = isUUID(img.id) ? img.id : generateUUID();
      imagesDto.push({
        id: safeImgId,
        inspectionId: img.inspection_id,
        fileUri: img.file_uri,
        mimeType: img.mime_type || 'image/jpeg',
        width: img.width || 1,
        height: img.height || 1,
        deviceId: deviceId
      });
      toUpdateImages.push({ old: img.id, new: safeImgId });
    }

    // Mapear Resultados de Inferencia Pendientes
    for (const inference of pendingInferences) {
      let realPredictedDiseaseId = getRealDiseaseId(inference.predicted_disease_id || inference.predictedDiseaseId);
      if (realPredictedDiseaseId === EMPTY_GUID) {
          realPredictedDiseaseId = fallbackDiseaseId;
      }
      
      if (realPredictedDiseaseId === EMPTY_GUID) {
          hasIncompleteData = true;
          continue;
      }

      const inferenceDto = {
        id: isUUID(inference.id) ? inference.id : generateUUID(),
        imageId: inference.image_id || inference.imageId,
        modelName: inference.model_name || 'broca_detect_v1',
        modelVersion: inference.model_version || 'v1.0.0',
        predictedDiseaseId: realPredictedDiseaseId,
        confidence: inference.confidence || 0,
        topKJson: inference.top_k_json || '[]',
        inferenceTimeMs: inference.inferenceTimeMs || 0,
        tfBackend: inference.tfBackend || 'wasm',
        deviceMemoryGb: navigator.deviceMemory || 0,
        browser: inference.browser || 'Unknown',
        browser_version: inference.browser_version || inference.browserVersion || 'Unknown',
        browserVersion: inference.browserVersion || inference.browser_version || 'Unknown',
        platform: inference.platform || 'Unknown',
        operatingSystem: inference.operatingSystem || 'Unknown',
        userAgent: inference.userAgent || 'Unknown',
        tensorflowVersion: inference.tensorflowVersion || 'Unknown'
      };
      inferenceResultsDto.push(inferenceDto);
      toUpdateInferences.push({ old: inference.id, new: inferenceDto.id });
    }

    // Mapear Observaciones Pendientes
    for (const obs of pendingObservations) {
      let realDiseaseId = getRealDiseaseId(obs.disease_id || obs.diseaseId);
      if (realDiseaseId === EMPTY_GUID) {
          realDiseaseId = fallbackDiseaseId;
      }

      if (realDiseaseId === EMPTY_GUID) {
          hasIncompleteData = true;
          continue;
      }

      const obsDto = {
        id: isUUID(obs.id) ? obs.id : generateUUID(),
        inspectionId: obs.inspection_id || obs.inspectionId,
        diseaseId: realDiseaseId,
        severityLevel: obs.severity_level || obs.severityLevel || 1,
        incidencePercent: obs.incidence_percent || obs.incidencePercent || 0,
        sourceType: obs.source_type || obs.sourceType || 'Manual'
      };
      observationsDto.push(obsDto);
      toUpdateObservations.push({ old: obs.id, new: obsDto.id });
    }
    
    // Mapear Telemetría Legacy
    // NOTA: Las telemetrías legacy no tienen inspectionId. 
    // Como el backend ahora exige inspectionId, enviarlas causará un error 500 de llave foránea.
    // Por tanto, solo las marcamos como sincronizadas localmente para vaciar la cola estancada.
    const pendingTelemetry = legacyInferences.filter(item => item.synced === false);
    for (const item of pendingTelemetry) {
      toUpdateTelemetries.push(item.id);
    }
    
    // Si no hay nada que sincronizar, retornamos éxito
    if (inspectionsDto.length === 0 && imagesDto.length === 0 && observationsDto.length === 0 && inferenceResultsDto.length === 0 && telemetriesDto.length === 0) {
      if (hasIncompleteData) {
        return { success: false, error: 'Existen datos incompletos (IDs faltantes). Inicie sesión y asegúrese de tener los catálogos descargados.' };
      }
      
      // Aún si todo estaba vacío, podríamos haber limpiado legacy telemetry, así que procesamos updates
      for (const id of toUpdateTelemetries) {
        await db.inferences.update(id, { synced: true });
      }
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
      for (const idObj of toUpdateImages) {
        await db.images.update(idObj.old, { sync_status: 'synced', id: idObj.new }); // Update ID in case it changed
      }
      for (const idObj of toUpdateObservations) {
        await db.observations.update(idObj.old, { sync_status: 'synced', id: idObj.new });
      }
      for (const idObj of toUpdateInferences) {
        await db.inference_results.update(idObj.old, { sync_status: 'synced', id: idObj.new });
      }
      for (const id of toUpdateTelemetries) {
        await db.inferences.update(id, { synced: true });
      }
      
      return { success: true, count: inspectionsDto.length + imagesDto.length + observationsDto.length + inferenceResultsDto.length + telemetriesDto.length };
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

