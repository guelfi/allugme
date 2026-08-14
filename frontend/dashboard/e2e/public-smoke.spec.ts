import { expect, test } from '@playwright/test'

test('landing page uses the public title and exposes authentication', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('Allugme')
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
})

test('password recovery is reachable from login', async ({ page }) => {
  await page.goto('./login')
  await page.getByRole('link', { name: /esqueci a senha/i }).click()

  await expect(page).toHaveURL(/\/forgot-password$/)
  await expect(page.getByRole('heading', { name: /esqueci a senha/i })).toBeVisible()
  await expect(page.getByRole('link', { name: '← Voltar ao login' })).toBeVisible()
})

test('anonymous user cannot open the SaaS dashboard', async ({ page }) => {
  await page.goto('./painel')

  await expect(page).toHaveURL(/\/login$/)
})
