import React, { useState, useEffect } from 'react';
import { getStats } from '../services/db';
import { motion } from 'framer-motion';
import { BarChart3, ShieldAlert, AlertTriangle, Bug, CheckCircle, TrendingUp, Database, CloudUpload, Activity } from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    const data = await getStats();
    setStats(data);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <Activity className="w-8 h-8 text-green-400 animate-pulse" />
      </div>
    );
  }

  const riskCards = [
    { key: 'critical', label: 'Crítico', icon: ShieldAlert, count: stats.byRisk.critical, gradient: 'stat-gradient-red', text: 'text-red-700', iconBg: 'bg-red-200 text-red-600' },
    { key: 'high', label: 'Alto', icon: AlertTriangle, count: stats.byRisk.high, gradient: 'stat-gradient-amber', text: 'text-orange-700', iconBg: 'bg-orange-200 text-orange-600' },
    { key: 'medium', label: 'Medio', icon: Bug, count: stats.byRisk.medium, gradient: 'stat-gradient-amber', text: 'text-amber-700', iconBg: 'bg-amber-200 text-amber-600' },
    { key: 'none', label: 'Sanos', icon: CheckCircle, count: stats.byRisk.none, gradient: 'stat-gradient-green', text: 'text-green-700', iconBg: 'bg-green-200 text-green-600' },
  ];

  const maxDayCount = Math.max(...stats.last7Days.map(d => d.count), 1);

  return (
    <div className="px-5 py-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 bg-purple-50 px-4 py-2 rounded-full mb-4 ring-1 ring-purple-100">
          <BarChart3 className="w-3.5 h-3.5" />
          Estadísticas
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Panel de <span className="text-gradient">Control</span>
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl stat-gradient-green shadow-sm ring-1 ring-green-200/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-800">{stats.total}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-green-600/70 mt-0.5">Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl stat-gradient-blue shadow-sm ring-1 ring-blue-200/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <CloudUpload className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-800">{stats.synced}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 mt-0.5">Sincronizados</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl stat-gradient-amber shadow-sm ring-1 ring-amber-200/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800">{stats.pending}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70 mt-0.5">Pendientes</p>
        </motion.div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-6">
        <h3 className="text-sm font-extrabold text-gray-700 mb-3 tracking-tight">Distribución por Riesgo</h3>
        <div className="grid grid-cols-2 gap-3">
          {riskCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-2xl ${card.gradient} shadow-sm ring-1 ring-black/5 flex items-center gap-3`}
              >
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xl font-black ${card.text}`}>{card.count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{card.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Chart */}
      <div className="glass rounded-[24px] p-5 shadow-lg">
        <h3 className="text-sm font-extrabold text-gray-700 mb-1 tracking-tight">Últimos 7 Días</h3>
        <p className="text-[11px] font-medium text-gray-400 mb-5">Análisis realizados por día</p>
        
        <div className="flex items-end gap-2 h-36">
          {stats.last7Days.map((day, index) => {
            const heightPercent = (day.count / maxDayCount) * 100;
            const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' });
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                {/* Count label */}
                <span className="text-[10px] font-bold text-gray-400">{day.count > 0 ? day.count : ''}</span>
                
                {/* Bar */}
                <div className="w-full h-24 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, day.count > 0 ? 8 : 3)}%` }}
                    transition={{ duration: 0.6, delay: index * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`w-full rounded-t-lg chart-bar ${
                      day.count > 0 
                        ? 'bg-gradient-to-t from-green-600 to-green-400' 
                        : 'bg-gray-200/50'
                    }`}
                  />
                </div>

                {/* Day label */}
                <span className="text-[10px] font-bold text-gray-400 capitalize">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pest Breakdown */}
      {Object.keys(stats.byPest).length > 0 && (
        <div className="mt-6 glass rounded-[24px] p-5 shadow-lg">
          <h3 className="text-sm font-extrabold text-gray-700 mb-4 tracking-tight">Detecciones por Tipo</h3>
          <div className="space-y-3">
            {Object.entries(stats.byPest)
              .sort(([,a], [,b]) => b - a)
              .map(([pest, count]) => {
                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={pest}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{pest}</span>
                      <span className="text-xs font-extrabold text-gray-500">{count} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
