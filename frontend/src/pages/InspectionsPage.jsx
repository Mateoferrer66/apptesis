import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, AlertCircle, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { getInspections, createInspection } from '../services/apiService';

export const InspectionsPage = () => {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchInspections = async () => {
    setIsLoading(true);
    setError('');
    const res = await getInspections();
    if (res.success && res.data) {
      setInspections(res.data);
    } else {
      setError(res.error || 'Error al obtener inspecciones');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleCreateInspection = async () => {
    setIsCreating(true);
    setError('');
    const res = await createInspection({
      inspectionDate: new Date().toISOString()
    });

    if (res.success) {
      fetchInspections();
    } else {
      setError(res.error || 'Error al crear inspección');
    }
    setIsCreating(false);
  };

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Inspecciones
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Registro de evaluaciones de cultivos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInspections}
            disabled={isLoading || isCreating}
            className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 flex items-center gap-2 bg-red-50 text-red-600 text-xs font-bold py-3 px-4 rounded-xl border border-red-100"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleCreateInspection}
        disabled={isCreating || isLoading}
        className="w-full mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-60"
      >
        {isCreating ? (
           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Nueva Inspección Rápida
          </>
        )}
      </button>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Cargando inspecciones...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-gray-900 font-bold mb-1">Sin inspecciones</h3>
          <p className="text-gray-500 text-xs font-medium">
            Aún no hay inspecciones registradas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <motion.div
              key={insp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(insp.inspectionDate).toLocaleDateString()} - {new Date(insp.inspectionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </h4>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  ID: {insp.id.substring(0, 8)}...
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
