import { test, expect } from '@playwright/test';

test.describe('AgroVision QA E2E Tests', () => {

  test('Page loads correctly and shows AgroVision title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AgroVision PWA/i);
    await expect(page.getByRole('heading', { name: 'AgroVision PWA' })).toBeVisible();
    await expect(page.getByText('Iniciar Sesión')).toBeVisible();
  });

  test('Shows error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill credentials
    await page.getByPlaceholder('Correo electrónico').fill('wrong@test.com');
    await page.getByPlaceholder('Contraseña').fill('wrongpass');
    
    // Click submit
    await page.getByRole('button', { name: 'Ingresar' }).click();
    
    // Wait for error message container (60s for Render backend cold start)
    await expect(page.locator('.text-red-300')).toBeVisible({ timeout: 60000 });
  });

  test('Logs in successfully using Demo Offline credentials', async ({ page }) => {
    await page.goto('/');
    
    // Click demo button
    await page.getByRole('button', { name: /Usar Credenciales Offline \(Demo\)/i }).click();
    
    // Click submit
    await page.getByRole('button', { name: 'Ingresar' }).click();
    
    // After login, it should route to the main app (Wait for any URL that isn't login error)
    // The splash screen takes ~2.5s, so we give it 15s timeout
    await expect(page).toHaveURL(/.*(\/|\/lotes)/, { timeout: 15000 });
  });

});
