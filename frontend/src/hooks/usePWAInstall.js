import { useState, useEffect } from 'react';

let globalDeferredPrompt = null;
let globalIsInstallable = false;
let listeners = [];

// Escuchar de forma global e inmediata para evitar race conditions
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  globalDeferredPrompt = e;
  globalIsInstallable = true;
  listeners.forEach(listener => listener(true));
});

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isInstallable, setIsInstallable] = useState(globalIsInstallable);

  useEffect(() => {
    // Sincronizar el estado actual al montar
    setIsInstallable(globalIsInstallable);
    setDeferredPrompt(globalDeferredPrompt);

    const listener = (installable) => {
      setIsInstallable(installable);
      setDeferredPrompt(globalDeferredPrompt);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt && !globalDeferredPrompt) return;
    
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    
    // Show the install prompt
    promptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    globalDeferredPrompt = null;
    globalIsInstallable = false;
    setDeferredPrompt(null);
    setIsInstallable(false);
    listeners.forEach(listener => listener(false));
  };

  return { isInstallable, install };
};
