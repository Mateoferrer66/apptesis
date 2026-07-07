import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, AlertCircle, RefreshCw, Users, ShieldCheck } from 'lucide-react';
import { getOrganizations } from '../services/apiService';

export const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError('');
    const res = await getOrganizations();
    if (res.success && res.data) {
      const dataArr = res.data.$values || res.data;
      setOrganizations(Array.isArray(dataArr) ? dataArr : []);
    } else {
      setError(res.error || 'Error al obtener organizaciones');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-teal-600" />
            Organizaciones
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Entidades registradas en el sistema
          </p>
        </div>
        <button
          onClick={fetchOrganizations}
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

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Cargando organizaciones...</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-teal-50/50 border border-teal-100 rounded-3xl p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-gray-900 font-bold mb-1">Sin organizaciones</h3>
          <p className="text-gray-500 text-xs font-medium">
            No se encontraron organizaciones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Building className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm mb-1">{org.name || 'Organización sin nombre'}</h4>
                <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                    <ShieldCheck className="w-3 h-3 text-gray-400" />
                    ID: {org.id.substring(0, 6)}
                  </span>
                  <span className="flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-1 rounded-lg">
                    <Users className="w-3 h-3 text-teal-500" />
                    Activa
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
