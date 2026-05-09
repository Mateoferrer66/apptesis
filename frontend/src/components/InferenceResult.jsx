import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, ShieldAlert, Bug, Info, X, Clock, Zap } from 'lucide-react';

const riskConfig = {
  critical: { icon: ShieldAlert, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', iconBg: 'bg-red-100 text-red-600', badge: 'bg-red-600 text-white', label: 'RIESGO CRÍTICO' },
  high:     { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', iconBg: 'bg-orange-100 text-orange-600', badge: 'bg-orange-500 text-white', label: 'RIESGO ALTO' },
  medium:   { icon: Bug, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-500 text-white', label: 'RIESGO MEDIO' },
  none:     { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', iconBg: 'bg-green-100 text-green-600', badge: 'bg-green-600 text-white', label: 'PLANTA SANA' },
};

const recommendations = {
  critical: 'Atención inmediata: Consulte con un agrónomo o técnico de la Federación Nacional de Cafeteros. Documente la zona afectada y considere aplicar control biológico o trampas.',
  high: 'Se recomienda inspección detallada de la zona. Implemente medidas preventivas y consulte las guías del Centro Nacional de Investigaciones de Café (Cenicafé).',
  medium: 'Monitoree la evolución en los próximos días. Mantenga buenas prácticas de manejo integrado de plagas (MIP) y registre la observación.',
  none: '¡Excelente! La muestra analizada parece estar sana. Continúe con el monitoreo regular, el manejo de sombra adecuado y las buenas prácticas agrícolas.',
};

export const InferenceResult = ({ result, onClose }) => {
  if (!result) return null;

  const config = riskConfig[result.risk] || riskConfig.none;
  const Icon = config.icon;
  const isRisky = result.risk !== 'none';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`relative w-full max-w-md mx-auto mt-8 rounded-[24px] shadow-2xl border ${config.border} ${config.bg} overflow-hidden`}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/70 backdrop-blur-sm rounded-xl hover:bg-white transition z-10 shadow-sm"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      {/* Risk Badge */}
      <div className="px-6 pt-5 pb-0">
        <span className={`inline-flex items-center text-[10px] font-black tracking-[0.15em] px-3 py-1.5 rounded-full ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {/* Main Result */}
      <div className="px-6 pt-4 pb-5">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl ${config.iconBg} shadow-sm shrink-0`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-black tracking-tight leading-tight ${config.text}`}>
              {result.pestType}
            </h3>
            <p className="text-sm font-medium opacity-60 mt-0.5 italic">
              {result.scientific}
            </p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Confianza del modelo</span>
            <span className="text-sm font-black">{(result.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ backgroundColor: result.color }}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold opacity-50">
            <Zap className="w-3.5 h-3.5" />
            {result.inferenceTimeMs}ms
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold opacity-50">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleTimeString('es-CO')}
          </div>
        </div>

        {/* All Predictions */}
        {result.allPredictions && result.allPredictions.length > 1 && (
          <div className="mt-4 p-3 bg-white/50 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">Otras posibilidades</p>
            {result.allPredictions.slice(1).map((pred, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-xs font-medium opacity-70">{pred.name}</span>
                <span className="text-xs font-bold opacity-50">{(pred.probability * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div className="mx-4 mb-5 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 opacity-60" />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] opacity-60">Recomendación Agrícola</span>
        </div>
        <p className="text-[13px] font-medium leading-relaxed opacity-80">
          {recommendations[result.risk]}
        </p>
      </div>
    </motion.div>
  );
};
