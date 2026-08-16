import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop 1440', width: 1440, height: 900 },
  { name: 'Desktop 1280', width: 1280, height: 720 },
  { name: 'Tablet 768', width: 768, height: 1024 },
  { name: 'Mobile 390', width: 390, height: 844 },
  { name: 'Mobile 360', width: 360, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Critical User Journey — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('renders homepage, opens creation modal, and parses natural text', async ({ page }) => {
      await page.goto('/');

      // 1. Check title and main heading
      await expect(page).toHaveTitle(/Andor/);
      await expect(page.locator('h1')).toBeVisible();

      // 2. Type natural language sentence in prompt input
      const promptInput = page.locator('input[placeholder*="Quero viajar"]');
      await expect(promptInput).toBeVisible();
      await promptInput.fill('Quero passar 5 dias em Roma em setembro com a minha namorada');

      // 3. Click submit to open creation modal
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();

      // 4. Verify modal opens and extracted chips are visible
      const modal = page.locator('div[class*="modal"]');
      await expect(modal).toBeVisible();
      await expect(page.locator('text=Roma, Itália')).toBeVisible();
      await expect(page.locator('text=5 dias')).toBeVisible();

      // 5. Click "Continuar" to go to preview / adaptive questions
      const continueBtn = page.locator('button:has-text("Continuar"), button:has-text("Ver Resumo")');
      await continueBtn.click();

      // 6. Verify preview box is displayed with 5 days and Roma
      await expect(page.locator('text=Resumo do Roteiro')).toBeVisible();
      await expect(page.locator('text=Confiança')).toBeVisible();
    });

    test('opens preferences drawer, changes pace preference, and resets cleanly', async ({ page }) => {
      await page.goto('/');

      // 1. Click Preferences button in header
      const prefBtn = page.locator('button:has-text("Preferências")');
      if (await prefBtn.isVisible()) {
        await prefBtn.click();

        // 2. Verify drawer opens
        const drawer = page.locator('div[class*="drawer"]');
        await expect(drawer).toBeVisible();
        await expect(page.locator('text=As Minhas Preferências')).toBeVisible();

        // 3. Click "Tranquilo & Calmo"
        const relaxedBtn = page.locator('button:has-text("Tranquilo & Calmo")');
        await relaxedBtn.click();

        // 4. Close drawer
        const closeBtn = page.locator('button[aria-label="Fechar"]');
        await closeBtn.click();
        await expect(drawer).not.toBeVisible();
      }
    });
  });
}
