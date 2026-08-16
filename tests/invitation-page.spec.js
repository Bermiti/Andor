import { expect, test } from '@playwright/test';

const validShapeToken = 'A'.repeat(43);

test.describe('group invitation entry point', () => {
  test('renders an invalid-link state instead of a missing route', async ({ page }) => {
    await page.goto('/invitations/invalid');

    await expect(page.getByRole('heading', { name: 'Junta-te a esta viagem na Andor' })).toBeVisible();
    await expect(page.getByText('Este link de convite é inválido. Pede um novo link ao organizador.')).toBeVisible();
  });

  test('asks an anonymous invitee to authenticate in an accessible dialog', async ({ page }) => {
    await page.goto(`/invitations/${validShapeToken}`);
    await page.getByRole('button', { name: 'Iniciar sessão para continuar' }).click();

    await expect(page.getByRole('dialog', { name: 'Bem-vindo de volta' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
  });
});
