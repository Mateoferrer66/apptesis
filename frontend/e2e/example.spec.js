import { test, expect } from '@playwright/test';

test('has title and login button', async ({ page }) => {
  // Go to the local dev server
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/AgroVision PWA/i);

  // Expect there to be some login text or button
  const loginText = page.locator('text=Iniciar Sesión');
  await expect(loginText).toBeVisible();
});
