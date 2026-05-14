import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, WifiOff, Cpu, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOfflineLogin, setIsOfflineLogin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    if (result.offline) {
      setIsOfflineLogin(true);
    }

    setIsLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail('inspector@agrovision.co');
    setPassword('agro2026');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-green-900 via-emerald-900 to-green-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-green-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-500/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-40 left-1/4 w-72 h-72 bg-teal-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full"
            style={{ left: `${15 + i * 15}%`, top: `${20 + i * 10}%` }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Logo & Title */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="relative mb-8 flex flex-col items-center z-10"
      >
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-5 rounded-[24px] shadow-2xl shadow-green-500/30 mb-5">
          <Leaf className="w-12 h-12 text-white" strokeWidth={2} />
        </div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-black text-white tracking-tight text-center">AgroVision PWA</h1>
          <p className="text-green-300/70 text-sm font-semibold text-center mt-1 tracking-wide">
            Detección Inteligente de Plagas
          </p>
        </motion.div>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 25 }}
        className="w-full max-w-sm px-5 z-10"
      >
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-[28px] border border-white/[0.12] p-7 shadow-2xl shadow-black/20">
          <h2 className="text-xl font-extrabold text-white mb-1">Iniciar Sesión</h2>
          <p className="text-green-300/50 text-xs font-semibold mb-6">Ingrese sus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-green-400/50" />
              <input
                id="login-email"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-medium placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/30 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-green-400/50" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl py-3.5 pl-12 pr-12 text-white text-sm font-medium placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/15 text-red-300 text-xs font-bold py-2.5 px-4 rounded-xl border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-green-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Demo Credentials */}
          <button
            id="login-demo"
            onClick={fillDemoCredentials}
            className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white/80 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Usar Credenciales Offline (Demo)
          </button>

          {/* Info chips */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/20">
              <Cpu className="w-3 h-3" />
              PWA Offline
            </div>
            <div className="w-0.5 h-0.5 rounded-full bg-white/15" />
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/20">
              <Shield className="w-3 h-3" />
              Datos Seguros
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-[10px] font-medium text-green-400/30 z-10"
      >
        Proyecto de Tesis — Maestría UNIR 2026
      </motion.p>
    </div>
  );
};
