import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, AlertCircle, RefreshCw, Calendar, MapPin, ChevronDown, Activity } from 'lucide-react';
import { createInspection, getObservationsByInspectionId } from '../services/apiService';
import { getAllInspectionsWithDetails, db } from '../services/db';
import { generateUUID } from '../utils/uuid';

export const InspectionsPage = () => {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [observations, setObservations] = useState({});
  const [loadingObs, setLoadingObs] = useState(false);

  const fetchInspections = async () => {
    setIsLoading(true);
    setError('');
    try {
      const localInspections = await db.inspections.orderBy('inspection_date').reverse().toArray();
      setInspections(localInspections || []);
    } catch (e) {
      setError('Error al leer inspecciones locales: ' + e.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleExpand = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!observations[id]) {
      setLoadingObs(true);
      try {
        const localObs = await db.observations.where('inspection_id').equals(id).toArray();
        setObservations(prev => ({ ...prev, [id]: localObs || [] }));
      } catch (err) {
        console.error('Error cargando observaciones locales:', err);
        setObservations(prev => ({ ...prev, [id]: [] }));
      }
      setLoadingObs(false);
    }
  };

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
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col"
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleExpand(insp.id)}
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(insp.inspection_date || insp.inspectionDate).toLocaleDateString()} - {new Date(insp.inspection_date || insp.inspectionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    ID: {insp.id.substring(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded === insp.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Seccion de observaciones expansible */}
              <AnimatePresence>
                {expanded === insp.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 mb-3">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Observaciones
                      </h5>
                      {loadingObs ? (
                        <p className="text-xs text-gray-400 italic">Cargando observaciones...</p>
                      ) : !observations[insp.id] || observations[insp.id].length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No hay observaciones registradas para esta inspección.</p>
                      ) : (
                        <div className="space-y-2">
                          {observations[insp.id].map(obs => (
                            <div key={obs.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-gray-800">Enfermedad ID: {obs.diseaseId?.substring(0,8) || 'Desconocida'}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Severidad: {obs.severityLevel} • Incidencia: {obs.incidencePercent}%</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-bold uppercase">{obs.sourceType || 'Manual'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
