import React, { useState, useEffect } from 'react';
import { getInferences } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { History, AlertTriangle, CheckCircle, ShieldAlert, Bug, Trash2, ChevronDown, Clock, Zap } from 'lucide-react';

const riskIcons = {
  critical: ShieldAlert,
  high: AlertTriangle,
  medium: Bug,
  none: CheckCircle,
};

const riskColors = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  none: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
};

export const HistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getInferences(100);
    setRecords(data);
  };

  const filtered = filter === 'all'
    ? records
    : records.filter(r => r.risk === filter);

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
          Registro Local
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Historial de <span className="text-gradient">Análisis</span>
        </h2>
        <p className="text-gray-500 text-sm font-medium mt-2">
          {records.length} análisis guardados en tu dispositivo
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todos', count: records.length },
          { key: 'critical', label: 'Crítico', count: records.filter(r => r.risk === 'critical').length },
          { key: 'high', label: 'Alto', count: records.filter(r => r.risk === 'high').length },
          { key: 'medium', label: 'Medio', count: records.filter(r => r.risk === 'medium').length },
          { key: 'none', label: 'Sano', count: records.filter(r => r.risk === 'none').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === f.key
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white/70 text-gray-500 hover:bg-white ring-1 ring-gray-200/50'
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filter === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <History className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 font-bold">Sin registros</p>
          <p className="text-gray-300 text-sm mt-1">Los análisis aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record, index) => {
            const colors = riskColors[record.risk] || riskColors.none;
            const Icon = riskIcons[record.risk] || CheckCircle;
            const isExpanded = expanded === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden shadow-sm`}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : record.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {/* Thumbnail or Icon */}
                  {record.imagePreview ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-black/5">
                      <img src={record.imagePreview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.text} bg-white/50`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-extrabold ${colors.text} truncate`}>{record.pestType}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(record.timestamp)} · {formatTime(record.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-black ${colors.text}`}>
                      {(record.confidence * 100).toFixed(0)}%
                    </span>
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-black/5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 bg-white/60 rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nombre Científico</p>
                            <p className="text-xs font-bold mt-0.5 italic">{record.scientific || 'N/A'}</p>
                          </div>
                          <div className="p-2.5 bg-white/60 rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Tiempo Inferencia</p>
                            <p className="text-xs font-bold mt-0.5 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {record.inferenceTimeMs || '—'}ms
                            </p>
                          </div>
                          <div className="p-2.5 bg-white/60 rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Estado Sync</p>
                            <p className={`text-xs font-bold mt-0.5 ${record.synced ? 'text-green-600' : 'text-amber-600'}`}>
                              {record.synced ? '✓ Sincronizado' : '○ Pendiente'}
                            </p>
                          </div>
                          <div className="p-2.5 bg-white/60 rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nivel de Riesgo</p>
                            <p className={`text-xs font-bold mt-0.5 ${colors.text} uppercase`}>{record.risk || 'N/A'}</p>
                          </div>
                        </div>
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
