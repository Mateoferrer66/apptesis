import React, { useState } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { InferenceResult } from '../components/InferenceResult';
import { predictPest } from '../services/aiModelService';
import { saveInference } from '../services/db';
import { Activity, ScanLine, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScanPage = ({ modelReady }) => {
  const [isInferring, setIsInferring] = useState(false);
  const [result, setResult] = useState(null);

  const handleCapture = async (imageElement, dataUrl) => {
    if (!modelReady) return;
    setIsInferring(true);
    setResult(null);

    try {
      const prediction = await predictPest(imageElement);
      setResult(prediction);
      await saveInference(prediction, dataUrl);
    } catch (error) {
      console.error('Error en inferencia:', error);
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
          Captura una imagen de la hoja o fruto de tu cafetal para analizar posibles plagas con IA.
        </p>
      </div>

      {/* AI Status Cards */}
      <div className="flex gap-3 mb-6">
        <div className={`flex-1 flex items-center gap-2.5 p-3 rounded-2xl ${modelReady ? 'bg-green-50 ring-1 ring-green-100' : 'bg-amber-50 ring-1 ring-amber-100'}`}>
          <div className={`p-1.5 rounded-lg ${modelReady ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}`}>
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Motor IA</p>
            <p className={`text-xs font-extrabold ${modelReady ? 'text-green-700' : 'text-amber-700'}`}>
              {modelReady ? 'WebAssembly Activo' : 'Cargando...'}
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
          <div className="p-1.5 rounded-lg bg-indigo-200 text-indigo-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Proceso</p>
            <p className="text-xs font-extrabold text-indigo-700">100% Offline</p>
          </div>
        </div>
      </div>

      {/* Camera */}
      <CameraCapture onCapture={handleCapture} disabled={!modelReady || isInferring} />

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
              Inferencia WebAssembly en curso
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
