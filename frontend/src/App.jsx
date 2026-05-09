import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ScanPage } from './pages/ScanPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { InfoPage } from './pages/InfoPage';
import { initModel } from './services/aiModelService';
import { syncTelemetry } from './services/syncService';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Cpu, Shield, CheckCircle } from 'lucide-react';

function App() {
  const [modelReady, setModelReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando sistema...');
  const [syncToast, setSyncToast] = useState('');

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); handleSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const setup = async () => {
      setLoadingMessage('Configurando WebAssembly...');
      const ready = await initModel((msg) => setLoadingMessage(msg));
      setModelReady(ready);
      
      // Keep splash for at least 2.5s for a premium feel
      setTimeout(() => setShowSplash(false), 2500);
    };
    setup();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    const result = await syncTelemetry();
    setIsSyncing(false);
    if (result.success && result.count > 0) {
      setSyncToast(`${result.count} registros sincronizados`);
      setTimeout(() => setSyncToast(''), 3500);
    }
  };

  return (
    <>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-green-900 via-emerald-900 to-green-950"
          >
            {/* Animated Background Circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="relative mb-8"
            >
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-[28px] shadow-2xl shadow-green-500/30">
                <Leaf className="w-14 h-14 text-white" strokeWidth={2} />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-lg"
              >
                <Cpu className="w-4 h-4 text-green-600" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-white tracking-tight mb-2"
            >
              AgriSense AI
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-green-300/80 text-sm font-semibold mb-10 tracking-wide"
            >
              Detección Inteligente de Plagas
            </motion.p>

            {/* Loading Steps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                {modelReady ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="text-sm font-semibold text-white/80">{loadingMessage}</span>
              </div>
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 text-[11px] font-medium text-green-400/40"
            >
              Proyecto de Tesis — Maestría UNIR 2026
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Toast */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] bg-indigo-600 text-white text-sm font-bold py-2.5 px-5 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {syncToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App */}
      <BrowserRouter>
        <Layout
          isOnline={isOnline}
          isSyncing={isSyncing}
          onSync={handleSync}
          modelReady={modelReady}
        >
          <Routes>
            <Route path="/" element={<ScanPage modelReady={modelReady} />} />
            <Route path="/historial" element={<HistoryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/info" element={<InfoPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
}

export default App;
