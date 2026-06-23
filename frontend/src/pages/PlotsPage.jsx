import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, Sprout, AlertCircle, RefreshCw } from 'lucide-react';
import { getPlots } from '../services/apiService';

export const PlotsPage = () => {
  const [plots, setPlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlots = async () => {
    setIsLoading(true);
    setError('');
    const res = await getPlots();
    if (res.success && res.data) {
      setPlots(res.data);
    } else {
      setError(res.error || 'Error al obtener los lotes');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-green-600" />
            Mis Lotes
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Gestión de parcelas y áreas de cultivo
          </p>
        </div>
        <button
          onClick={fetchPlots}
          disabled={isLoading}
          className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Plots List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Cargando lotes...</p>
        </div>
      ) : plots.length === 0 ? (
        <div className="bg-green-50/50 border border-green-100 rounded-3xl p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="text-gray-900 font-bold mb-1">Aún no hay lotes</h3>
          <p className="text-gray-500 text-xs font-medium mb-6">
            Agrega tu primer lote para comenzar a registrar inspecciones.
          </p>
          <button
            onClick={() => alert('Endpoint POST /api/Plots no disponible en la API actual. Esta función se habilitará próximamente.')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-green-600/20"
          >
            <Plus className="w-4 h-4" />
            Crear Nuevo Lote
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plots.map((plot) => (
            <motion.div
              key={plot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{plot.name || 'Lote sin nombre'}</h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5" />
                  ID: {plot.id.substring(0, 8)}...
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Sprout className="w-5 h-5 text-green-600" />
              </div>
            </motion.div>
          ))}
          <div className="pt-4">
             <button
              onClick={() => alert('Endpoint POST /api/Plots no disponible en la API actual. Esta función se habilitará próximamente.')}
              className="w-full bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4.5 h-4.5" />
              Agregar Otro Lote
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
