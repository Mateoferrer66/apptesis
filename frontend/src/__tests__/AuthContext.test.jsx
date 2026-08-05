import { render, screen, act, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as apiService from '../services/apiService';

vi.mock('../services/apiService', () => ({
  login: vi.fn().mockRejectedValue(new Error('Network error')),
}));

// Dummy component to test the AuthContext hook
const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <button onClick={async () => { await login('inspector@agrovision.co', 'agro2026'); }}>Login Offline</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

test('AuthContext handles offline login correctly', async () => {
  // Clear local storage before test
  localStorage.clear();

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  // Initially not authenticated
  expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  
  // Perform offline login
  await act(async () => {
    screen.getByText('Login Offline').click();
  });

  // Check if authenticated
  expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  expect(screen.getByTestId('user-email')).toHaveTextContent('inspector@agrovision.co');

  // Verify localStorage was updated
  const storedUser = JSON.parse(localStorage.getItem('agrovision_user'));
  expect(storedUser).toBeTruthy();
  expect(storedUser.email).toBe('inspector@agrovision.co');
  expect(storedUser.isOffline).toBe(true);

  // Perform logout
  await act(async () => {
    screen.getByText('Logout').click();
  });

  // Verify logout state
  expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  expect(localStorage.getItem('agrovision_user')).toBeNull();
});
