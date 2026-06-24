import React, { useState, useEffect } from 'react';
import { getAllInspectionsWithDetails, getImageBlob } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Camera, CheckCircle, ChevronDown, Clock, Image as ImageIcon, Cloud, CloudOff, AlertTriangle } from 'lucide-react';

export const HistoryPage = () => {
  const [inspections, setInspections] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [blobUrls, setBlobUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setIsLoading(true);
    try {
      const data = await getAllInspectionsWithDetails();
      setInspections(data);
    } catch (error) {
      console.error('Error cargando historial local:', error);
    }
    setIsLoading(false);
  };

  const handleExpand = async (inspection) => {
    if (expanded === inspection.id) {
      setExpanded(null);
      return;
    }
    setExpanded(inspection.id);

    // Pre-load all blobs for this inspection's images
    if (inspection.images && inspection.images.length > 0) {
      for (const img of inspection.images) {
        if (!blobUrls[img.file_uri]) {
          const blob = await getImageBlob(img.file_uri);
          if (blob) {
            const url = URL.createObjectURL(blob);
            setBlobUrls(prev => ({ ...prev, [img.file_uri]: url }));
          }
        }
      }
    }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-5 py-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full mb-4 ring-1 ring-indigo-100">
          <History className="w-3.5 h-3.5" />
          Registro Local-First
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Historial de <span className="text-gradient">Inspecciones</span>
        </h2>
        <p className="text-gray-500 text-sm font-medium mt-2">
          Inspecciones guardadas en tu dispositivo (disponible offline).
        </p>
      </div>

      {/* Inspections List */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500">Cargando inspecciones...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <History className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold">Sin inspecciones</p>
          <p className="text-gray-300 text-sm mt-1">Realiza una inspección en el escáner.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection, index) => {
            const isExpanded = expanded === inspection.id;
            const images = inspection.images || [];
            const isSynced = inspection.sync_status === 'synced';

            return (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => handleExpand(inspection)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSynced ? 'text-indigo-600 bg-indigo-50' : 'text-amber-600 bg-amber-50'}`}>
                    {isSynced ? <CheckCircle className="w-6 h-6" /> : <CloudOff className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-800 truncate flex items-center gap-2">
                      Lote {inspection.plot_id?.split('-')[0] || inspection.plotId?.split('-')[0] || 'Desconocido'}
                      {!isSynced && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] uppercase tracking-wider font-bold">Offline</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(inspection.inspection_date || inspection.inspectionDate)} · {formatTime(inspection.inspection_date || inspection.inspectionDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Imágenes Capturadas ({images.length})
                        </h4>
                        
                        {images.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No hay imágenes asociadas.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {images.map(img => {
                               const inference = img.inference;
                               let riskColor = 'text-green-600 bg-green-50 ring-green-200';
                               let pestName = 'Planta Sana';
                               
                               if (inference) {
                                 if (inference.predicted_disease_id === 'broca') riskColor = 'text-red-600 bg-red-50 ring-red-200';
                                 else if (inference.predicted_disease_id === 'roya') riskColor = 'text-orange-600 bg-orange-50 ring-orange-200';
                                 else if (inference.predicted_disease_id !== 'healthy') riskColor = 'text-amber-600 bg-amber-50 ring-amber-200';
                                 
                                 pestName = inference.predicted_disease_id; // Idealmente mapear al common_name si lo tuvieramos
                               }

                               return (
                                <div key={img.id} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl ring-1 ring-gray-100 shadow-sm">
                                  <div className="relative w-full sm:w-28 aspect-square rounded-xl overflow-hidden bg-gray-200 shrink-0">
                                    {blobUrls[img.file_uri] ? (
                                      <img 
                                        src={blobUrls[img.file_uri]} 
                                        alt="Captura" 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <Camera className="w-6 h-6 mb-1 opacity-50" />
                                        <span className="text-[10px] font-medium">Sin Blob Local</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {inference ? (
                                    <div className="flex-1 flex flex-col justify-center">
                                      <p className={`inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ring-1 ${riskColor} mb-2`}>
                                        <AlertTriangle className="w-3 h-3" />
                                        Plaga: {pestName}
                                      </p>
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Confianza:</span> {(inference.confidence * 100).toFixed(1)}%</p>
                                        <p className="text-xs text-gray-500 leading-snug"><span className="font-bold text-gray-700">Rec:</span> {inference.predicted_disease_id === 'healthy' ? 'Ninguna acción requerida.' : 'Aplicar control orgánico. Guardado localmente.'}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex-1 flex items-center text-gray-400 text-xs italic">
                                      Sin resultado de inferencia local.
                                    </div>
                                  )}
                                </div>
                               );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
