import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../services/apiService';

const AuthContext = createContext(null);

/**
 * Proveedor de autenticación.
 * Gestiona el estado de sesión del usuario con persistencia en localStorage.
 * Soporta login contra el backend o modo offline con credenciales locales.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const savedUser = localStorage.getItem('agrovision_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('agrovision_user');
      }
    }
    setIsLoading(false);

    const handleAuthError = () => {
      setUser(null);
      localStorage.removeItem('agrovision_user');
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const login = async (email, password) => {
    try {
      // Intentar login contra el backend usando apiService
      const response = await loginApi({ email, password });

      if (response.success) {
        const data = response.data;
        // Aggressively search for token in response
        let foundToken = null;
        if (typeof data === 'string') foundToken = data;
        else if (data) {
          foundToken = data.token || data.Token || data.accessToken || data.access_token || data.jwt || data.jwtToken || data.bearer || data.Bearer;
          if (!foundToken && data.data) {
            foundToken = data.data.token || data.data.Token || data.data.accessToken || data.data.access_token;
          }
        }
        
        const userData = {
          id: data?.id || data?.Id || data?.userId || 'admin-id',
          fullName: data?.fullName || data?.FullName || data?.email || 'Admin',
          email: data?.email || data?.Email,
          role: data?.role || data?.Role || 'Admin',
          organizationId: data?.organizationId || data?.OrganizationId,
          token: foundToken,
          rawResponse: data // Store it so we can debug if needed
        };
        setUser(userData);
        localStorage.setItem('agrovision_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, error: response.error?.message || response.error || 'Credenciales inválidas' };
      }
    } catch {
      // Modo offline: validar con credenciales demo
      if (email === 'inspector@agrovision.co' && password === 'agro2026') {
        const offlineUser = {
          id: '00000000-0000-0000-0000-000000000000',
          fullName: 'Inspector Demo',
          email: 'inspector@agrovision.co',
          role: 'inspector',
          organizationId: 'org-demo',
          token: null,
          isOffline: true,
        };
        setUser(offlineUser);
        localStorage.setItem('agrovision_user', JSON.stringify(offlineUser));
        return { success: true, offline: true };
      }
      return { success: false, error: 'Sin conexión al servidor. Use credenciales offline.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrovision_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
