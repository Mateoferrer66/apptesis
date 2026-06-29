import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getModelInfo } from '../services/ModelService';
import { getDiseaseCatalog, createDiseaseCatalog, updateDiseaseCatalog, deleteDiseaseCatalog, getSyncLogs } from '../services/apiService';
import { getStats, clearAllData } from '../services/db';
import { fetchLatestModelVersion } from '../services/syncService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Cpu, HardDrive, Wifi, Server, Trash2, Shield,
  ExternalLink, Coffee, BookOpen, Bug, Leaf, Globe, Smartphone, Download,
  Plus, Edit2, X, RefreshCw
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InfoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, install } = usePWAInstall();
  const [modelInfo, setModelInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [serverVersion, setServerVersion] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [diseases, setDiseases] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', commonName: '', scientificName: '', category: 'insecto' });
  const [submitting, setSubmitting] = useState(false);
  
  // Sync Logs state
  const [syncLogs, setSyncLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const fetchDiseases = () => {
    setErrorMsg('');
    getDiseaseCatalog().then(res => {
      if (res.success && res.data) {
        let diseasesArray = [];
        if (Array.isArray(res.data)) diseasesArray = res.data;
        else if (res.data.$values) diseasesArray = res.data.$values;
        else if (res.data.data && Array.isArray(res.data.data)) diseasesArray = res.data.data;
        else if (res.data.data && res.data.data.$values) diseasesArray = res.data.data.$values;
        
        if (diseasesArray.length === 0) {
          setErrorMsg('El catálogo está vacío en la base de datos.');
        } else {
          setDiseases(diseasesArray);
        }
      } else {
        console.error("fetchDiseases error:", res);
        
        // Debugging info
        const userStr = localStorage.getItem('agrovision_user');
        let debugInfo = '';
        if (userStr) {
          const user = JSON.parse(userStr);
          debugInfo = ` | Token guardado: ${user.token ? 'Sí (empieza con ' + user.token.substring(0, 10) + ')' : 'NO'}`;
          if (!user.token && user.rawResponse) {
             debugInfo += ` | Respuesta Login RAW: ${JSON.stringify(user.rawResponse).substring(0, 50)}`;
          }
        }

        setErrorMsg(res.error ? `Error: ${res.error}${debugInfo}` : `Error HTTP ${res.status || 'Desconocido'}${debugInfo}`);
      }
    });
  };
  useEffect(() => {
    const info = getModelInfo();
    setModelInfo(info);
    getStats().then(setStats);
    fetchLatestModelVersion().then(setServerVersion);
    fetchDiseases();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    const res = await getSyncLogs();
    if (res.success) {
      let logsArray = [];
      if (Array.isArray(res.data)) logsArray = res.data;
      else if (res.data?.$values) logsArray = res.data.$values;
      setSyncLogs(logsArray.slice(0, 10)); // Just keep the latest 10
    }
    setLoadingLogs(false);
  };

  const handleClearData = async () => {
    if (!window.confirm('¿Estás seguro de eliminar todos los registros locales? Esta acción no se puede deshacer.')) return;
    setClearing(true);
    await clearAllData();
    const s = await getStats();
    setStats(s);
    setClearing(false);
  };

  const openModal = (disease = null) => {
    if (disease) {
      setIsEditing(true);
      setFormData({
        id: disease.id || '',
        commonName: disease.commonName || '',
        recommendation: disease.recommendation || ''
      });
    } else {
      setIsEditing(false);
      setFormData({ id: '', commonName: '', recommendation: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { 
        commonName: formData.commonName, 
        recommendation: formData.recommendation 
      };
      
      let res;
      if (isEditing && formData.id) {
        res = await updateDiseaseCatalog(formData.id, payload);
      } else {
        res = await createDiseaseCatalog(payload);
      }
      
      if (!res.success) {
        alert('Error del servidor: ' + (res.error?.title || res.error || 'Error desconocido al guardar'));
        return;
      }
      
      fetchDiseases();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving disease:', error);
      alert('Hubo un error de red al guardar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta plaga?')) return;
    try {
      const res = await deleteDiseaseCatalog(id);
      if (!res.success) {
        alert('Error al eliminar: ' + (res.error?.title || res.error));
        return;
      }
      fetchDiseases();
    } catch (error) {
      console.error('Error deleting disease:', error);
      alert('Hubo un error de red al eliminar.');
    }
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

      {/* PWA Install */}
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="glass rounded-[24px] p-5 shadow-lg mb-5 bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-100"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">Instalar Aplicación</h3>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5">Accede sin conexión y más rápido</p>
                </div>
              </div>
              <button
                onClick={install}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                Instalar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Catálogo de Enfermedades (CRUD) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-500" />
            Catálogo de Plagas
          </h3>
          {(user?.role?.toLowerCase().includes('admin') || user?.role === 'Administrador') && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Plaga
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200/50">
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">ID</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre Plaga</th>
                <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Recomendación</th>
                {(user?.role?.toLowerCase().includes('admin') || user?.role === 'Administrador') && (
                  <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-2">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {diseases.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-xs font-medium text-gray-400">
                    {errorMsg || 'No hay plagas registradas o cargando catálogo...'}
                  </td>
                </tr>
              ) : (
                diseases.map((disease) => {
                  return (
                    <tr key={disease.id} className="hover:bg-white/40 transition-colors group">
                      <td className="py-3 pl-2 text-[10px] font-medium text-gray-400 max-w-[80px] truncate" title={disease.id}>{disease.id}</td>
                      <td className="py-3 text-xs font-bold text-gray-800">
                        {disease.commonName}
                      </td>
                      <td className="py-3 text-[11px] font-medium text-gray-500">
                        {disease.recommendation ? (
                           <div className="line-clamp-2" title={disease.recommendation}>{disease.recommendation}</div>
                        ) : (
                           <span className="italic text-gray-300">Sin recomendación</span>
                        )}
                      </td>
                      {(user?.role?.toLowerCase().includes('admin') || user?.role === 'Administrador') && (
                        <td className="py-3 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openModal(disease)}
                              className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                              title="Editar plaga"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(disease.id)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                              title="Eliminar plaga"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      {/* Sync Logs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-[24px] p-5 shadow-lg mb-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Registro de Sincronización
          </h3>
          <button
            onClick={fetchLogs}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {loadingLogs ? (
             <p className="text-xs text-gray-400 italic text-center py-2">Cargando logs...</p>
          ) : syncLogs.length === 0 ? (
             <p className="text-xs text-gray-400 italic text-center py-2">No hay registros de sincronización disponibles.</p>
          ) : (
            syncLogs.map((log) => (
              <div key={log.id} className="bg-white/50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status === 'success' ? 'Éxito' : 'Error'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{new Date(log.syncTime).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Dispositivo: {log.deviceId}</p>
                <p className="text-[10px] text-gray-500 mt-1">{log.details}</p>
              </div>
            ))
          )}
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

      {/* CRUD Modal for Admin */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black text-gray-900 mb-5">
                {isEditing ? 'Editar Plaga' : 'Nueva Plaga'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-4">
                {!isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ID (Clave Única)</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: araña_roja"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                      value={formData.id}
                      onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Común</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    value={formData.commonName}
                    onChange={(e) => setFormData({...formData, commonName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Recomendación (Tratamiento/Manejo)</label>
                  <textarea
                    required
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    value={formData.recommendation}
                    onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Guardar Plaga'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoRow = ({ label, value, valueColor = 'text-gray-800' }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-gray-400">{label}</span>
    <span className={`text-xs font-bold ${valueColor}`}>{value}</span>
  </div>
);
