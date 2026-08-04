# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.js >> has title and login button
- Location: e2e\example.spec.js:3:1

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /AgroVision PWA/i
Received string:  "frontend"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "frontend"

```

```yaml
- heading "AgroVision PWA" [level=1]
- paragraph: Detección Inteligente de Plagas
- heading "Iniciar Sesión" [level=2]
- paragraph: Ingrese sus credenciales para continuar
- textbox "Correo electrónico"
- textbox "Contraseña"
- button
- button "Ingresar"
- button "¿No tienes cuenta? Regístrate"
- text: o
- button "Usar Credenciales Offline (Demo)"
- text: PWA Offline Datos Seguros
- paragraph: Proyecto de Tesis — Maestría UNIR 2026
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('has title and login button', async ({ page }) => {
  4  |   // Go to the local dev server
  5  |   await page.goto('/');
  6  | 
  7  |   // Expect a title "to contain" a substring.
> 8  |   await expect(page).toHaveTitle(/AgroVision PWA/i);
     |                      ^ Error: expect(page).toHaveTitle(expected) failed
  9  | 
  10 |   // Expect there to be some login text or button
  11 |   const loginText = page.locator('text=Iniciar Sesión');
  12 |   await expect(loginText).toBeVisible();
  13 | });
  14 | 
```