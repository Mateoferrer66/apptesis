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
  }, []);

  const login = async (email, password) => {
    try {
      // Intentar login contra el backend usando apiService
      const response = await loginApi({ email, password });

      if (response.success) {
        const data = response.data;
        const userData = {
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          organizationId: data.organizationId,
          token: data.token,
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
          id: 'offline-demo-user',
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
