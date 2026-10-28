import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  test.skip(
    process.env.ARENA_STAGING_E2E !== '1' ||
      !process.env.ARENA_A_EMAIL ||
      !process.env.ARENA_A_PASSWORD,
    'Requires an approved staging account.',
  );
  await page.goto('/login/');
  await page.getByLabel('Email', { exact: true }).fill(process.env.ARENA_A_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ARENA_A_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard/');
});
test('a practice answer survives reload and produces results', async ({ page }) => {
  await page.goto('/question-bank');
  await page.getByLabel('Practice tmua-001', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A moment to think.' })).toBeVisible();
  await page.getByRole('button', { name: 'B 22', exact: true }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right. Nicely reasoned.')).toBeVisible();
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes('/api/progress/') &&
      r.request().method() === 'PUT' &&
      r.status() === 200 &&
      r.request().postDataJSON()?.state?.session?.finished === true,
  );
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('heading', { name: 'Raw marks earned' })).toBeVisible();
  await saved;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Raw marks earned' })).toBeVisible();
});
test('an editable plan persists completion', async ({ page }) => {
  await page.goto('/study-plan');
  const complete = page.getByRole('button', { name: /^Complete / }).first();
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes('/api/progress/') && r.request().method() === 'PUT' && r.status() === 200,
  );
  await complete.click();
  await saved;
  await page.reload();
  await expect(page.getByRole('button', { name: /^Reopen / }).first()).toBeVisible();
});
