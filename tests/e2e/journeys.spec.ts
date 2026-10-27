import { test, expect } from '@playwright/test';
test('a practice answer survives reload and produces results', async ({ page }) => {
  await page.goto('/question-bank');
  await page.getByLabel('Practice tmua-001', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A moment to think.' })).toBeVisible();
  await page.getByRole('button', { name: 'B 22', exact: true }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right. Nicely reasoned.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('That’s right. Nicely reasoned.')).toBeVisible();
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('heading', { name: 'Raw marks earned' })).toBeVisible();
});
test('an editable plan persists completion', async ({ page }) => {
  await page.goto('/study-plan');
  const complete = page.getByRole('button', { name: /^Complete / }).first();
  await complete.click();
  await page.reload();
  await expect(page.getByRole('button', { name: /^Reopen / }).first()).toBeVisible();
});
