import React, { useState, useEffect } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { InferenceResult } from '../components/InferenceResult';
import { predictPest } from '../services/ModelService';
import { saveInference, saveImageBlob, saveInferenceResult } from '../services/db';
import { getPlots, createInspection, createInspectionImage, createInferenceResult, getInferenceResultByImageId } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ScanLine, Shield, MapPin, CheckCircle, PlusCircle } from 'lucide-react';
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
        setPlots(res.data);
      } else {
        // Fallback for offline/demo if not found
        setPlots([
          { id: 'plot-001', code: 'L-001', variety: 'Castillo' },
          { id: 'plot-002', code: 'L-002', variety: 'Caturra' }
        ]);
      }
    };
    fetchPlots();
  }, []);

  const handleCreateInspection = async () => {
    if (!selectedPlot) return;
    setIsCreatingInspection(true);
    
    // Default inspection date
    const reqData = {
      plotId: selectedPlot,
      inspectorId: user?.id || 'offline-demo-user',
      inspectionDate: new Date().toISOString()
    };

    const res = await createInspection(reqData);
    if (res.success && res.data) {
      setActiveInspection(res.data);
    } else {
      // Offline fallback: create local inspection
      const fallbackId = 'insp-' + crypto.randomUUID().split('-')[0];
      setActiveInspection({
        id: fallbackId,
        ...reqData
      });
    }
    setIsCreatingInspection(false);
  };

  const handleCapture = async (imageElement, dataUrl, blob) => {
    if (!modelReady || !activeInspection) return;
    setIsInferring(true);
    setResult(null);

    try {
      // 1. Run inference (TensorFlow.js)
      const prediction = await predictPest(imageElement);
      
      // 2. Local quick history (optional but useful for stats)
      await saveInference(prediction, dataUrl);

      // 3. Save blob locally
      const imageIdStr = crypto.randomUUID().split('-')[0];
      const fileUri = `${activeInspection.id}-image-${imageIdStr}`;
      if (blob) {
        await saveImageBlob(fileUri, blob);
      }

      // 4. Send image to API via FormData (if online this will succeed, offline will fail)
      if (blob) {
        const formData = new FormData();
        formData.append('File', blob, `image_${imageIdStr}.jpg`);
        await createInspectionImage(activeInspection.id, formData);
      }

      // 5. Build Inference Result Record and save locally (IndexedDB)
      const inferencePayload = {
        imageId: fileUri,
        modelName: 'broca_detect_v1',
        modelVersion: 'v1.0.0',
        predictedDiseaseId: prediction.pestId,
        confidence: prediction.confidence,
        topKJson: JSON.stringify(prediction.allPredictions)
      };
      await saveInferenceResult(inferencePayload);

      // 6. POST to backend (SQL Server)
      const postRes = await createInferenceResult(inferencePayload);

      // 7. GET from backend
      let finalResult = null;
      if (postRes.success) {
        const getRes = await getInferenceResultByImageId(fileUri);
        if (getRes.success && getRes.data) {
          finalResult = getRes.data;
        }
      }

      // 8. If backend failed (offline), use local data to simulate response
      if (!finalResult) {
        finalResult = {
          pestType: prediction.pestType,
          scientific: prediction.scientific,
          risk: prediction.risk,
          color: prediction.color,
          confidence: prediction.confidence,
          inferenceTimeMs: prediction.inferenceTimeMs,
          recommendation: prediction.risk === 'none' ? 'Planta Sana (Evaluado Offline)' : 'Guardado localmente. Sincroniza al tener conexión.',
          allPredictions: prediction.allPredictions
        };
      } else {
        // Carry over inference time and all predictions from local execution to display
        finalResult.inferenceTimeMs = prediction.inferenceTimeMs;
        finalResult.allPredictions = prediction.allPredictions;
      }

      setResult(finalResult);

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
              {plots.map(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.code} - {plot.variety}
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
              <p className="text-sm font-bold text-gray-800">Lote: {plots.find(p => p.id === activeInspection.plotId)?.code || activeInspection.plotId}</p>
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
