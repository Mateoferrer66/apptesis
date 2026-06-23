import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getModelInfo } from '../services/ModelService';
import { getDiseaseCatalog } from '../services/apiService';
import { getStats, clearAllData } from '../services/db';
import { fetchLatestModelVersion } from '../services/syncService';
import { motion } from 'framer-motion';
import {
  Settings, Cpu, HardDrive, Wifi, Server, Trash2, Shield,
  ExternalLink, Coffee, BookOpen, Bug, Leaf, Globe, Smartphone
} from 'lucide-react';

export const InfoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modelInfo, setModelInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [serverVersion, setServerVersion] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [diseases, setDiseases] = useState([]);

  useEffect(() => {
    const info = getModelInfo();
    setModelInfo(info);
    getStats().then(setStats);
    fetchLatestModelVersion().then(setServerVersion);
    
    getDiseaseCatalog().then(res => {
      if (res.success && res.data) {
        let diseasesArray = [];
        if (Array.isArray(res.data)) diseasesArray = res.data;
        else if (res.data.$values) diseasesArray = res.data.$values;
        else if (res.data.data && Array.isArray(res.data.data)) diseasesArray = res.data.data;
        else if (res.data.data && res.data.data.$values) diseasesArray = res.data.data.$values;
        setDiseases(diseasesArray);
      }
    });
  }, []);

  const handleClearData = async () => {
    if (!window.confirm('¿Estás seguro de eliminar todos los registros locales? Esta acción no se puede deshacer.')) return;
    setClearing(true);
    await clearAllData();
    const s = await getStats();
    setStats(s);
    setClearing(false);
  };

  return (
    <div className="px-5 py-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 bg-teal-50 px-4 py-2 rounded-full mb-4 ring-1 ring-teal-100">
          <Settings className="w-3.5 h-3.5" />
          Información del Sistema
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Acerca de <span className="text-gradient">AgroVision</span>
        </h2>
      </div>

      {/* Admin Module */}
      {user?.role === 'Admin' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[24px] p-5 shadow-lg mb-5 border border-indigo-100/50"
        >
          <h3 className="text-sm font-extrabold text-indigo-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            Panel de Administración
          </h3>
          <p className="text-xs text-gray-600 mb-4 font-medium leading-relaxed">
            Gestión centralizada de catálogos y configuraciones del sistema.
          </p>
          <button
            onClick={() => navigate('/enfermedades')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all ring-1 ring-indigo-200/60"
          >
            <Bug className="w-4 h-4" />
            Catálogo de Enfermedades
          </button>
        </motion.div>
      )}

      {/* About Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[24px] p-6 shadow-lg mb-5"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-3 rounded-2xl text-white shadow-lg shadow-green-600/25 shrink-0">
            <Leaf className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">AgroVision PWA</h3>
            <p className="text-xs font-bold text-green-700/70 uppercase tracking-wider mt-0.5">
              Detección de Plagas en Cafetales
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          Sistema de detección temprana de plagas en cafetales colombianos mediante visión por computadora
          ejecutada directamente en el navegador, sin depender de conectividad constante. Diseñado para
          pequeños caficultores del Eje Cafetero, Huila y otras regiones cafeteras de Colombia.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-lg ring-1 ring-green-200/60">PWA Offline-First</span>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg ring-1 ring-indigo-200/60">WebAssembly</span>
          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg ring-1 ring-purple-200/60">TensorFlow.js</span>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg ring-1 ring-blue-200/60">.NET 9 Backend</span>
        </div>
      </motion.div>

      {/* AI Engine */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <h3 className="text-sm font-extrabold text-gray-700 mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500" />
          Motor de Inteligencia Artificial
        </h3>
        <div className="space-y-3">
          <InfoRow label="Backend de cómputo" value={modelInfo?.backend || '—'} />
          <InfoRow label="Parámetros del modelo" value={modelInfo?.params?.toLocaleString() || '—'} />
          <InfoRow label="Dimensión de entrada" value={modelInfo?.inputShape || '—'} />
          <InfoRow label="Clases de clasificación" value={modelInfo?.classes || '—'} />
        </div>
      </motion.div>

      {/* Detectable Pests */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <h3 className="text-sm font-extrabold text-gray-700 mb-4 flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-500" />
          Plagas Detectables
        </h3>
        <div className="space-y-2.5">
          {diseases.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Cargando catálogo...</p>
          ) : (
            diseases.map(disease => {
              let risk = 'medium';
              let color = '#d97706';
              if (disease.id === 'healthy') { risk = 'none'; color = '#16a34a'; }
              else if (disease.id === 'broca') { risk = 'critical'; color = '#dc2626'; }
              else if (disease.id === 'roya') { risk = 'high'; color = '#ea580c'; }
              
              return (
                <div key={disease.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800">{disease.commonName}</p>
                    <p className="text-[11px] font-medium text-gray-400 italic">{disease.scientificName}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    risk === 'critical' ? 'bg-red-100 text-red-600' :
                    risk === 'high' ? 'bg-orange-100 text-orange-600' :
                    risk === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {risk === 'none' ? 'sano' : risk}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Server Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <h3 className="text-sm font-extrabold text-gray-700 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-500" />
          Backend .NET 9
        </h3>
        {serverVersion ? (
          <div className="space-y-3">
            <InfoRow label="Versión del modelo" value={serverVersion.version} />
            <InfoRow label="Nombre" value={serverVersion.modelName} />
            <InfoRow label="Estado" value="✓ Conectado" valueColor="text-green-600" />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
            <Wifi className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold text-amber-700">Backend no disponible — Modo offline activo</p>
          </div>
        )}
      </motion.div>

      {/* Storage */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <h3 className="text-sm font-extrabold text-gray-700 mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-green-500" />
          Almacenamiento Local
        </h3>
        <div className="space-y-3 mb-4">
          <InfoRow label="Registros guardados" value={stats?.total || 0} />
          <InfoRow label="Sincronizados" value={stats?.synced || 0} />
          <InfoRow label="Pendientes de sync" value={stats?.pending || 0} />
        </div>
        <button
          onClick={handleClearData}
          disabled={clearing || (stats?.total === 0)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all ring-1 ring-red-200/60 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          {clearing ? 'Eliminando...' : 'Eliminar Datos Locales'}
        </button>
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <h3 className="text-sm font-extrabold text-gray-700 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Stack Tecnológico
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { name: 'React 18', desc: 'UI Framework' },
            { name: 'Vite', desc: 'Build Tool' },
            { name: 'TensorFlow.js', desc: 'Motor de Análisis' },
            { name: 'WebAssembly', desc: 'Aceleración' },
            { name: 'Tailwind CSS 4', desc: 'Estilos' },
            { name: '.NET 9', desc: 'Backend API' },
            { name: 'IndexedDB', desc: 'Datos Offline' },
            { name: 'Workbox', desc: 'Service Worker' },
          ].map(tech => (
            <div key={tech.name} className="p-3 bg-white/50 rounded-xl">
              <p className="text-xs font-bold text-gray-800">{tech.name}</p>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">{tech.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-6 opacity-40">
        <p className="text-[11px] font-bold">
          <Coffee className="w-3 h-3 inline mr-1" />
          Hecho con ♥ para los caficultores de Colombia
        </p>
        <p className="text-[10px] font-medium mt-1">Proyecto de Tesis — Maestría UNIR 2026</p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, valueColor = 'text-gray-800' }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-gray-400">{label}</span>
    <span className={`text-xs font-bold ${valueColor}`}>{value}</span>
  </div>
);
