import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import React from 'react';
import { LoginPage } from '../pages/LoginPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock API service to avoid actual network calls
vi.mock('../services/apiService', () => ({
  getOrganizations: vi.fn().mockResolvedValue({ success: true, data: [] }),
  register: vi.fn().mockResolvedValue({ success: true }),
}));

describe('LoginPage', () => {
  let mockLogin;

  beforeEach(() => {
    mockLogin = vi.fn().mockResolvedValue({ success: true });
    vi.clearAllMocks();
  });

  const renderWithAuth = () => {
    render(
      <AuthContext.Provider value={{ login: mockLogin, isAuthenticated: false, isLoading: false }}>
        <LoginPage />
      </AuthContext.Provider>
    );
  };

  test('renders login form by default', async () => {
    renderWithAuth();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  test('switches to register mode when clicking toggle', async () => {
    renderWithAuth();
    const toggleButton = screen.getByText('¿No tienes cuenta? Regístrate');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Registrarse')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre Completo')).toBeInTheDocument();
  });

  test('fills offline credentials when clicking Demo button', async () => {
    renderWithAuth();
    const demoButton = screen.getByText('Usar Credenciales Offline (Demo)');
    fireEvent.click(demoButton);

    const emailInput = screen.getByPlaceholderText('Correo electrónico');
    const passwordInput = screen.getByPlaceholderText('Contraseña');

    expect(emailInput.value).toBe('inspector@agrovision.co');
    expect(passwordInput.value).toBe('agro2026');
  });

  test('calls login function on form submit', async () => {
    renderWithAuth();
    
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
