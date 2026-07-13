import React, { useState, useEffect } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { InferenceResult } from '../components/InferenceResult';
import { predictPest } from '../services/ModelService';
import { saveInference, saveImageBlob, saveInferenceResult, db } from '../services/db';
import { getPlots, createInspection, createInspectionImage, createInferenceResult, createObservation, syncBulkTelemetry } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ScanLine, Shield, MapPin, CheckCircle, PlusCircle } from 'lucide-react';
import { generateUUID } from '../utils/uuid';
import { motion, AnimatePresence } from 'framer-motion';

export const ScanPage = ({ modelReady }) => {
  const { user } = useAuth();
  const [isInferring, setIsInferring] = useState(false);
  const [result, setResult] = useState(null);
  
  // Inspection Flow States
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState('');
  const [activeInspection, setActiveInspection] = useState(null);
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);

  useEffect(() => {
    const fetchPlots = async () => {
      const res = await getPlots();
      if (res.success && res.data) {
        const dataArr = Array.isArray(res.data) ? res.data : (res.data.$values || (res.data.data ? (Array.isArray(res.data.data) ? res.data.data : res.data.data.$values) : []));
        setPlots(dataArr || []);
      } else {
        // Fallback for offline/demo if not found
        setPlots([
          { id: '11111111-2222-3333-4444-555555555555', name: 'Lote 001', farmName: 'Finca Demo' },
          { id: '22222222-3333-4444-5555-666666666666', name: 'Lote 002', farmName: 'Finca Demo' }
        ]);
      }
    };
    fetchPlots();
  }, []);

  const handleCreateInspection = async () => {
    if (!selectedPlot) return;
    setIsCreatingInspection(true);
    
    const inspectionId = generateUUID();
    const inspectionDate = new Date().toISOString();
    const inspectorId = user?.id || '00000000-0000-0000-0000-000000000000';

    // Build the local object first — this always works
    const localInspection = {
      id: inspectionId,
      plotId: selectedPlot,
      inspectorId: inspectorId,
      inspectionDate: inspectionDate,
      inspection_date: inspectionDate,
      sync_status: 'pending'
    };

    try {
      const userStr = localStorage.getItem('agrovision_user');
      let isOfflineMode = false;
      if (userStr) {
        try { isOfflineMode = JSON.parse(userStr).isOffline; } catch(e) {}
      }
      
      // Only call API if online and not explicitly set to offline
      if (navigator.onLine && !isOfflineMode) {
        const res = await createInspection({
          inspectionDate: inspectionDate
        });

        if (res.success && res.data && res.data.id) {
          // Backend returned a valid inspection — use its id
          localInspection.id = res.data.id;
          localInspection.sync_status = 'synced';
        }
      }
    } catch (error) {
      console.warn('[ScanPage] No se pudo crear inspección en el servidor, se guardará localmente:', error.message);
    }

    // Always save to IndexedDB (id is guaranteed to be a valid UUID)
    try {
      await db.inspections.put(localInspection);
    } catch (dbErr) {
      console.error('[ScanPage] Error guardando inspección en IndexedDB:', dbErr);
    }

    setActiveInspection(localInspection);
    setIsCreatingInspection(false);
  };

  const handleCapture = async (imageElement, dataUrl, blob) => {
    if (!modelReady || !activeInspection) return;
    setIsInferring(true);
    setResult(null);

    try {
      // 1. Run inference (TensorFlow.js — works fully offline)
      const prediction = await predictPest(imageElement);
      
      // 2. Local quick history (optional but useful for stats)
      const telemetryLocalId = await saveInference(prediction, dataUrl);

      // 3. Save blob locally and insert metadata to IndexedDB
      const imageId = generateUUID();
      if (blob) {
        await saveImageBlob(imageId, blob);
        
        await db.images.put({
          id: imageId,
          inspection_id: activeInspection.id,
          file_uri: imageId,
          mime_type: blob.type || 'image/jpeg',
          width: imageElement?.width || 1,
          height: imageElement?.height || 1,
          device_id: 'local-browser',
          sync_status: 'pending'
        });
      }

      // 4. Save inference result to IndexedDB
      const inferencePayload = {
        id: generateUUID(),
        imageId: imageId,
        modelName: 'broca_detect_v1',
        modelVersion: 'v1.0.0',
        predictedDiseaseId: prediction.pestId,
        confidence: prediction.confidence,
        topKJson: JSON.stringify(prediction.allPredictions),
        inferenceTimeMs: prediction.inferenceTimeMs,
        tfBackend: 'wasm',
        deviceMemoryGb: navigator.deviceMemory || 0
      };
      await saveInferenceResult(inferencePayload);
      
      // 5. Save observation to IndexedDB
      const obsPayload = {
        id: generateUUID(),
        inspectionId: activeInspection.id,
        diseaseId: prediction.pestId,
        severityLevel: prediction.risk === 'critical' ? 5 : (prediction.risk === 'high' ? 4 : (prediction.risk === 'medium' ? 3 : 1)),
        incidencePercent: prediction.confidence * 100,
        sourceType: 'AI'
      };
      await db.observations.put({
        id: obsPayload.id,
        inspection_id: obsPayload.inspectionId,
        disease_id: obsPayload.diseaseId,
        severity_level: obsPayload.severityLevel,
        incidence_percent: obsPayload.incidencePercent,
        source_type: obsPayload.sourceType,
        sync_status: 'pending'
      });

      const telemetryPayload = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        pestType: prediction.pestType,
        confidence: prediction.confidence,
        inferenceTimeMs: prediction.inferenceTimeMs || 0,
        inspectionCount: 1,
        deviceHash: 'local-browser'
      };

      const userStr = localStorage.getItem('agrovision_user');
      let isOfflineMode = false;
      if (userStr) {
        try { isOfflineMode = JSON.parse(userStr).isOffline; } catch(e) {}
      }

      // 6. Si hay internet y la inspección se sincronizó correctamente
      // Intentamos sincronizar secuencialmente. Si falla uno, se detiene
      // y se dejan en pendiente. Aquí no llamaría nunca al SyncBulk.
      if (navigator.onLine && !isOfflineMode && activeInspection.sync_status === 'synced') {
        let hasError = false;

        // 6.1 Subir imagen
        try {
          const imgRes = await createInspectionImage(activeInspection.id, {
            inspectionId: activeInspection.id,
            fileUri: imageId,
            mimeType: blob?.type || 'image/jpeg',
            width: imageElement?.width || 1,
            height: imageElement?.height || 1,
            deviceId: 'local-browser'
          });
          if (imgRes.success) {
            await db.images.update(imageId, { sync_status: 'synced' });
          } else {
            hasError = true;
          }
        } catch (e) {
          console.warn('[ScanPage] No se pudo enviar metadata de imagen al servidor:', e.message);
          hasError = true;
        }

        // 6.2 Guardar observación
        if (!hasError) {
          try {
            const validDisease = prediction.pestId;
            if (validDisease && validDisease.length === 36 && validDisease.includes('-')) {
              const obsRes = await createObservation(obsPayload);
              if (obsRes.success) {
                await db.observations.update(obsPayload.id, { sync_status: 'synced' });
              } else {
                hasError = true;
              }
            } else {
              hasError = true;
            }
          } catch (e) {
            console.warn('[ScanPage] No se pudo enviar observacion al servidor:', e.message);
            hasError = true;
          }
        }

        // 6.3 Guardar inferencia
        if (!hasError) {
          try {
            const infRes = await createInferenceResult(inferencePayload);
            if (infRes.success) {
              await db.inference_results.update(inferencePayload.id, { sync_status: 'synced' });
            } else {
              hasError = true;
            }
          } catch (e) {
            console.warn('[ScanPage] No se pudo enviar inferencia al servidor:', e.message);
            hasError = true;
          }
        }
        
        // 6.4 Guardar telemetría
        if (!hasError) {
          try {
            // El backend espera un solo objeto CreateTelemetryRequestDto
            const telRes = await syncBulkTelemetry(telemetryPayload);
            if (telRes.success) {
              await db.inferences.update(telemetryLocalId, { synced: true });
            } else {
              hasError = true;
            }
          } catch (e) {
            console.warn('[ScanPage] No se pudo enviar telemetria al servidor:', e.message);
            hasError = true;
          }
        }

        // Si falló alguno, lo dejamos pendiente para SyncBulk manual posterior.
        // Aquí no llamamos NUNCA al SyncBulk automáticamente.
        if (hasError) {
          console.warn('[ScanPage] Hubo errores en el envío individual. Los datos quedaron pendientes en la cola local.');
        }
      }

      // 7. Build result for UI display (always from local prediction)
      setResult({
        pestType: prediction.pestType,
        scientific: prediction.scientific,
        risk: prediction.risk,
        color: prediction.color,
        confidence: prediction.confidence,
        inferenceTimeMs: prediction.inferenceTimeMs,
        allPredictions: prediction.allPredictions,
        recommendation: navigator.onLine 
          ? (prediction.risk === 'none' ? 'Planta sana detectada.' : 'Resultado enviado al servidor.')
          : (prediction.risk === 'none' ? 'Planta Sana (Evaluado Offline)' : 'Guardado localmente. Sincroniza al tener conexión.')
      });

    } catch (error) {
      console.error('Error en captura e inferencia:', error);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="px-5 py-8 max-w-lg mx-auto w-full">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-50 px-4 py-2 rounded-full mb-4 ring-1 ring-green-100">
          <ScanLine className="w-3.5 h-3.5" />
          Análisis en Tiempo Real
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
          Escáner de <span className="text-gradient">Cultivos</span>
        </h2>
        <p className="text-gray-500 text-sm font-medium leading-relaxed mt-3 max-w-xs mx-auto">
          Crea una inspección y captura imágenes para analizar plagas.
        </p>
      </div>

      {/* AI Status Cards */}
      <div className="flex gap-3 mb-6">
        <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-2xl ${modelReady ? 'bg-green-50 ring-1 ring-green-100' : 'bg-amber-50 ring-1 ring-amber-100'}`}>
          <div className={`p-1.5 rounded-lg ${modelReady ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}`}>
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Motor</p>
            <p className={`text-xs font-extrabold ${modelReady ? 'text-green-700' : 'text-amber-700'}`}>
              {modelReady ? 'WebAssembly' : 'Cargando...'}
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
          <div className="p-1.5 rounded-lg bg-indigo-200 text-indigo-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Proceso</p>
            <p className="text-xs font-extrabold text-indigo-700">Offline</p>
          </div>
        </div>
      </div>

      {/* Inspection Creation Flow */}
      {!activeInspection ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Configurar Inspección
          </h3>
          
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Selecciona el Lote (Plot)</label>
            <select
              value={selectedPlot}
              onChange={(e) => setSelectedPlot(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-green-500 focus:border-green-500 block p-3 transition-colors"
            >
              <option value="">Seleccione un lote...</option>
              {plots?.map?.(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.name} - {plot.farmName || 'Sin Finca'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateInspection}
            disabled={!selectedPlot || isCreatingInspection}
            className="w-full text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:ring-4 focus:ring-green-300 font-bold rounded-xl text-sm px-5 py-3.5 text-center flex items-center justify-center gap-2 transition-all"
          >
            {isCreatingInspection ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            Empezar Nueva Inspección
          </button>
        </div>
      ) : (
        <div className="mb-6 flex justify-between items-center bg-green-50 px-4 py-3 rounded-2xl ring-1 ring-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-[10px] font-bold text-green-600 uppercase">Inspección Activa</p>
              <p className="text-sm font-bold text-gray-800">Lote: {plots.find(p => p.id === activeInspection.plotId)?.name || activeInspection.plotId}</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveInspection(null)}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 underline"
          >
            Finalizar
          </button>
        </div>
      )}

      {/* Camera */}
      {activeInspection && (
        <CameraCapture onCapture={handleCapture} disabled={!modelReady || isInferring} />
      )}

      {/* Inferring State */}
      <AnimatePresence>
        {isInferring && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 p-6 glass rounded-[24px] text-center flex flex-col items-center shadow-xl"
          >
            <div className="relative mb-4">
              <Activity className="w-10 h-10 text-green-500 animate-pulse relative z-10" />
              <div className="absolute inset-0 bg-green-400 blur-2xl opacity-25 animate-pulse rounded-full scale-150" />
            </div>
            <p className="font-extrabold text-lg text-gray-800 tracking-tight">Analizando muestra...</p>
            <p className="text-[11px] mt-2 font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full ring-1 ring-green-100">
              Guardando imagen e inferencia...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !isInferring && (
          <InferenceResult result={result} onClose={() => setResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
