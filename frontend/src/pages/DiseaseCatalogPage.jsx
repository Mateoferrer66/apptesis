import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Plus, Edit2, Trash2, X, AlertCircle, Save, Bug, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getDiseaseCatalog, 
  createDiseaseCatalog, 
  updateDiseaseCatalog, 
  deleteDiseaseCatalog 
} from '../services/apiService';

export const DiseaseCatalogPage = () => {
  const { user } = useAuth();
  const [diseases, setDiseases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ commonName: '', recommendation: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchDiseases = async () => {
    setIsLoading(true);
    try {
      const res = await getDiseaseCatalog();
      if (res.success && res.data) {
        let diseasesArray = [];
        if (Array.isArray(res.data)) {
          diseasesArray = res.data;
        } else if (res.data.$values) {
          diseasesArray = res.data.$values;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          diseasesArray = res.data.data;
        } else if (res.data.data && res.data.data.$values) {
          diseasesArray = res.data.data.$values;
        }
        setDiseases(diseasesArray);
      } else {
        setError(res.error || 'Error al cargar enfermedades');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchDiseases();
    }
  }, [user]);

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          No tienes permisos suficientes para ver esta página. Debes ser Administrador.
        </p>
      </div>
    );
  }

  const handleOpenModal = (disease = null) => {
    setEditingDisease(disease);
    if (disease) {
      setFormData({
        commonName: disease.commonName || '',
        recommendation: disease.recommendation || ''
      });
    } else {
      setFormData({ commonName: '', recommendation: '' });
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDisease(null);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        commonName: formData.commonName,
        recommendation: formData.recommendation
      };

      let res;
      if (editingDisease) {
        res = await updateDiseaseCatalog(editingDisease.id, payload);
      } else {
        res = await createDiseaseCatalog(payload);
      }

      if (res.success) {
        await fetchDiseases();
        handleCloseModal();
      } else {
        setError(res.error || 'Error al guardar la enfermedad');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta enfermedad? Esta acción no se puede deshacer.')) return;
    
    try {
      const res = await deleteDiseaseCatalog(id);
      if (res.success) {
        await fetchDiseases();
      } else {
        alert(res.error || 'Error al eliminar');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 bg-teal-50 px-4 py-2 rounded-full mb-3 ring-1 ring-teal-100">
            <Bug className="w-3.5 h-3.5" />
            Catálogo
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Enfermedades
          </h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-2xl shadow-lg shadow-green-600/30 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : diseases.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-md rounded-3xl border border-gray-100">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay enfermedades registradas</p>
          </div>
        ) : (
          diseases.map((disease) => (
            <motion.div
              key={disease.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex items-start justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-gray-900 text-base">{disease.commonName}</h3>
                {disease.recommendation && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    <span className="font-semibold text-gray-700">Recomendación:</span> {disease.recommendation}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenModal(disease)}
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(disease.id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md mx-auto p-6 shadow-2xl relative"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-gray-900 mb-6 pr-8">
                {editingDisease ? 'Editar Enfermedad' : 'Nueva Enfermedad'}
              </h3>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Nombre Común</label>
                  <input
                    type="text"
                    required
                    value={formData.commonName}
                    onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all outline-none"
                    placeholder="Ej. Roya del Cafeto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Recomendación</label>
                  <textarea
                    rows="3"
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all outline-none resize-none"
                    placeholder="Ej. Aplicar fungicida a base de cobre..."
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="pt-4 mt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-600/25 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingDisease ? 'Guardar Cambios' : 'Crear Registro'}
                      </>
                    )}
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
