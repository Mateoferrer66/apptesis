import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertTriangle, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CameraCapture = ({ onCapture, disabled }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [capturedPreview, setCapturedPreview] = useState(null);

  const startCamera = useCallback(async () => {
    // Stop any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos de tu navegador.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    if (!videoRef.current || disabled) return;
    setIsCapturing(true);
    setCapturedPreview(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPreview(dataUrl);

    canvas.toBlob((blob) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        onCapture(img, dataUrl, blob);
        setTimeout(() => {
          setIsCapturing(false);
        }, 1200);
      };
    }, 'image/jpeg', 0.85);
  };


  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera Viewport */}
      <div className="relative overflow-hidden rounded-[28px] shadow-2xl bg-black aspect-[3/4] border border-white/10 ring-1 ring-black/5">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-gradient-to-b from-red-800 to-red-950">
            <div className="p-4 bg-red-700/50 rounded-2xl mb-5">
              <AlertTriangle className="w-10 h-10 text-red-300" />
            </div>
            <p className="text-lg font-bold mb-2">Cámara no disponible</p>
            <p className="text-sm text-red-200 mb-6">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 font-bold text-white bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all border border-white/10"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="object-cover w-full h-full"
            />

            {/* Corner Brackets (scan area) */}
            <div className="absolute inset-0 pointer-events-none p-6">
              {/* Top-left */}
              <div className="absolute top-6 left-6 w-10 h-10 border-l-3 border-t-3 border-green-400 rounded-tl-lg" />
              {/* Top-right */}
              <div className="absolute top-6 right-6 w-10 h-10 border-r-3 border-t-3 border-green-400 rounded-tr-lg" />
              {/* Bottom-left */}
              <div className="absolute bottom-28 left-6 w-10 h-10 border-l-3 border-b-3 border-green-400 rounded-bl-lg" />
              {/* Bottom-right */}
              <div className="absolute bottom-28 right-6 w-10 h-10 border-r-3 border-b-3 border-green-400 rounded-br-lg" />
            </div>

            {/* Flash overlay on capture */}
            <AnimatePresence>
              {isCapturing && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white z-20 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Scan line */}
            <AnimatePresence>
              {isCapturing && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 w-full h-0.5 bg-green-400 z-10"
                  style={{ boxShadow: '0 0 15px 3px rgba(74,222,128,0.6)' }}
                />
              )}
            </AnimatePresence>

            {/* Flip camera button */}
            <button
              onClick={toggleCamera}
              className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white/80 hover:text-white transition-all z-10 border border-white/10"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>

            {/* Bottom Controls */}
            <div className="absolute inset-x-0 bottom-0 pb-7 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              <div className="flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCapture}
                  disabled={isCapturing || disabled}
                  className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center pulse-glow"
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-[3px] border-white/90" />
                  {/* Inner solid circle */}
                  <div className={`w-[58px] h-[58px] rounded-full transition-all ${isCapturing ? 'bg-green-400 scale-75' : 'bg-white'}`} />
                </motion.button>
              </div>
              <p className="mt-5 text-[13px] font-semibold text-center text-white/80 tracking-wide">
                Apunta a la hoja o fruto del café
              </p>
            </div>
          </>
        )}
      </div>

      {/* Captured Preview Thumbnail */}
      <AnimatePresence>
        {capturedPreview && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -bottom-3 -left-3 w-16 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-white z-30"
          >
            <img src={capturedPreview} alt="Captura" className="w-full h-full object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
