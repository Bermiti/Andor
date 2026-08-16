import { test, expect } from '@playwright/test';

test.describe('curated demo regressions', () => {
  test('homepage demo CTA opens a valid map-ready itinerary', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver Demo' }).click();

    await expect(page).toHaveURL(/\/itinerary\/tokyo-food$/);
    await expect(page.getByRole('heading', { name: 'Itinerário inválido' })).toHaveCount(0);
    await expect(page.getByTestId('day-tabs')).toBeVisible();
    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
  });

  test('secondary Lisbon demo also survives strict normalization', async ({ page }) => {
    await page.goto('/itinerary/hidden-gems-lisbon');

    await expect(page.getByRole('heading', { name: 'Itinerário inválido' })).toHaveCount(0);
    await expect(page.getByTestId('day-tabs')).toBeVisible();
    await expect(page.getByTestId('itinerary-map-container')).toBeVisible();
  });

  test('dark-only mobile navigation exposes no non-functional theme action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Menu' });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator('#primary-navigation').getByRole('link', { name: /Destinos/i })).toBeVisible();

    const legacyThemeControl = page.locator('button').filter({ hasText: /Modo (Claro|Escuro)/ });
    await expect(legacyThemeControl).toBeHidden();
    await expect(page.getByRole('button', { name: /Modo (Claro|Escuro)/ })).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(12, 12, 12)');
  });
});
