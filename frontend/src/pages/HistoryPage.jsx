import React, { useState, useEffect } from 'react';
import { getInspections, getInspectionImages } from '../services/apiService';
import { getImageBlob } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Camera, CheckCircle, ChevronDown, Clock, Image as ImageIcon } from 'lucide-react';

export const HistoryPage = () => {
  const [inspections, setInspections] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [inspectionImages, setInspectionImages] = useState({});
  const [blobUrls, setBlobUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setIsLoading(true);
    const res = await getInspections();
    if (res.success && res.data) {
      setInspections(res.data);
    }
    setIsLoading(false);
  };

  const handleExpand = async (inspectionId) => {
    if (expanded === inspectionId) {
      setExpanded(null);
      return;
    }
    setExpanded(inspectionId);

    // If we haven't loaded images for this inspection yet
    if (!inspectionImages[inspectionId]) {
      const res = await getInspectionImages(inspectionId);
      if (res.success && res.data) {
        const images = res.data;
        setInspectionImages(prev => ({ ...prev, [inspectionId]: images }));

        // For each image, fetch the local Blob from IndexedDB
        for (const img of images) {
          const blob = await getImageBlob(img.fileUri);
          if (blob) {
            const url = URL.createObjectURL(blob);
            setBlobUrls(prev => ({ ...prev, [img.fileUri]: url }));
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
          Registro Sincronizado
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Historial de <span className="text-gradient">Inspecciones</span>
        </h2>
        <p className="text-gray-500 text-sm font-medium mt-2">
          Recuperando datos desde el servidor central.
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
            const images = inspectionImages[inspection.id] || [];

            return (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => handleExpand(inspection.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-indigo-600 bg-indigo-50">
                    <CheckCircle className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-800 truncate">Inspección en Lote {inspection.plotId?.split('-')[0] || 'Desconocido'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(inspection.inspectionDate)} · {formatTime(inspection.inspectionDate)}
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
                          <div className="grid grid-cols-2 gap-3">
                            {images.map(img => (
                              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 ring-1 ring-black/5 shadow-sm">
                                {blobUrls[img.fileUri] ? (
                                  <img 
                                    src={blobUrls[img.fileUri]} 
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
                            ))}
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
