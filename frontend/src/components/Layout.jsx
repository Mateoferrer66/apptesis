import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, History, BarChart3, Settings, Leaf, Wifi, WifiOff, CloudUpload, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';
import { AgroBot } from './AgroBot';

export const Layout = ({ children, isOnline, isSyncing, onSync, onToggleOnline, modelReady, pendingCount }) => {
  const { user, logout } = useAuth();
  const { isInstallable, install } = usePWAInstall();

  const navItems = [
    { to: '/', icon: ScanLine, label: 'Escanear' },
    { to: '/historial', icon: History, label: 'Historial' },
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/info', icon: Settings, label: 'Sistema' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Header */}
      <header className="px-5 py-3.5 glass-strong sticky top-0 z-50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-[14px] text-white shadow-lg shadow-green-600/25">
            <Leaf className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[17px] font-black tracking-tight text-gray-900 leading-none">AgroVision PWA</h1>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-green-700/70 mt-0.5">
              Cafetales Colombia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* User info */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100/80 px-2.5 py-1.5 rounded-xl ring-1 ring-gray-200/60">
              <User className="w-3 h-3" />
              {user.fullName}
            </div>
          )}

          {/* Model Status */}
          {modelReady ? (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-100/80 px-2.5 py-1.5 rounded-xl ring-1 ring-green-200/60">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Modelo Activo
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1.5 rounded-xl ring-1 ring-amber-200/60 animate-pulse">
              Cargando Modelo...
            </div>
          )}

          {/* Sync */}
          <div className="relative">
            <button
              onClick={onSync}
              disabled={!isOnline || isSyncing}
              className={`p-2 rounded-xl transition-all ${isOnline ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ring-1 ring-indigo-100' : 'bg-gray-50 text-gray-400 ring-1 ring-gray-100'}`}
              title="Sincronizar datos con servidor"
            >
              <CloudUpload className={`w-4.5 h-4.5 ${isSyncing ? 'animate-bounce' : ''}`} />
            </button>
            {pendingCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white" title={`${pendingCount} pendientes`}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </div>
            )}
          </div>

          {/* Online/Offline */}
          <button 
            onClick={onToggleOnline}
            className={`flex p-2 rounded-xl shadow-sm transition-all cursor-pointer ${isOnline ? 'bg-blue-50 text-blue-500 hover:bg-blue-100 ring-1 ring-blue-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 ring-1 ring-gray-200'}`}
            title={isOnline ? 'Forzar Modo Offline' : 'Activar Modo Online'}
          >
            {isOnline ? <Wifi className="w-4.5 h-4.5" /> : <WifiOff className="w-4.5 h-4.5" />}
          </button>

          {/* PWA Install */}
          <button
            onClick={() => {
              if (isInstallable && install) {
                install();
              } else {
                alert('Para instalar la aplicación:\n\n- En Android/Chrome: Toca los 3 puntos arriba a la derecha y selecciona "Instalar aplicación" o "Añadir a la pantalla de inicio".\n\n- En iPhone/Safari: Toca el ícono de Compartir (el cuadro con la flecha hacia arriba) y selecciona "Agregar a Inicio".');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
            title="Instalar App"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 ring-1 ring-red-100 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5" />
          Modo Offline — Los resultados se guardarán localmente
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-28 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 inset-x-0 z-40 flex justify-center safe-area-bottom pointer-events-none px-4">
        <div className="glass-strong border border-white/60 shadow-2xl flex items-center justify-around px-2 py-1.5 pointer-events-auto w-full max-w-sm rounded-[28px]">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-[20px] transition-all relative overflow-hidden ${
                  isActive
                    ? 'text-green-700'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-bold relative z-10 ${isActive ? 'tracking-wide' : ''}`}>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-gradient-to-tr from-green-100 to-emerald-50 opacity-80"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-green-600"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <AgroBot />
    </div>
  );
};
