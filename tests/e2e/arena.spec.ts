import { test, expect } from '@playwright/test';

// Opt-in staging test only. Supply two verified, distinct staging accounts and
// a staging baseURL in Playwright config. Never run against production by default.
test('two independent accounts join and complete the same private race', async ({
  browser,
  baseURL,
}) => {
  test.skip(
    process.env.ARENA_STAGING_E2E !== '1',
    'Requires an explicitly configured staging database and accounts.',
  );
  test.setTimeout(180000);
  const emails = [process.env.ARENA_A_EMAIL, process.env.ARENA_B_EMAIL];
  const passwords = [process.env.ARENA_A_PASSWORD, process.env.ARENA_B_PASSWORD];
  expect(emails.every(Boolean) && passwords.every(Boolean)).toBe(true);
  expect(emails[0]).not.toBe(emails[1]);
  const contexts = await Promise.all([
    browser.newContext({ baseURL }),
    browser.newContext({ baseURL }),
  ]);
  try {
    const pages = await Promise.all(contexts.map((c) => c.newPage()));
    for (let i = 0; i < 2; i++) {
      await pages[i].goto('/login/');
      await pages[i].getByLabel('Email', { exact: true }).fill(emails[i]!);
      await pages[i].getByLabel('Password', { exact: true }).fill(passwords[i]!);
      await pages[i].getByRole('button', { name: 'Sign in', exact: true }).click();
      await pages[i].waitForURL('**/dashboard/');
      await pages[i].goto('/arena/');
    }
    const [a, b] = pages;
    await a.getByLabel('Exam', { exact: true }).selectOption('TMUA');
    await a.getByLabel('Difficulty', { exact: true }).selectOption('Intermediate');
    await a.getByRole('checkbox', { name: 'Ranked · Elo starts at 1000' }).uncheck();
    await expect(a.getByRole('button', { name: 'Create private room', exact: true })).toBeEnabled();
    await a.getByRole('button', { name: 'Create private room', exact: true }).click();
    const code = await a.locator('.arena-ready > strong').innerText();
    expect(code).toMatch(/^[A-F0-9]{8}$/);
    await b.getByLabel('Room code', { exact: true }).fill(code);
    await b.getByRole('button', { name: 'Join room', exact: true }).click();
    await a.getByRole('button', { name: 'Ready up', exact: true }).click();
    await b.getByRole('button', { name: 'Ready up', exact: true }).click();
    for (let i = 0; i < 10; i++) {
      for (const page of pages) {
        await expect(page.locator('.arena-race-heading')).toContainText(`Question ${i + 1} / 10`, {
          timeout: 20000,
        });
        await expect(page.locator('.arena-race h2')).toBeVisible({ timeout: 20000 });
      }
      expect(await a.locator('.arena-race h2').innerText()).toBe(
        await b.locator('.arena-race h2').innerText(),
      );
      expect(await a.locator('.arena-race .answer-option').allTextContents()).toEqual(
        await b.locator('.arena-race .answer-option').allTextContents(),
      );
      await expect(a.locator('.arena-race .answer-option')).toHaveCount(5);
      // Respect the server's 750 ms minimum interval between accepted answers.
      // This journey deliberately chooses the same option without reading keys.
      await new Promise((resolve) => setTimeout(resolve, 800));
      await a.locator('.arena-race .answer-option').first().click();
      await b.locator('.arena-race .answer-option').first().click();
    }
    for (const page of pages)
      await expect(page.locator('.arena-result')).toBeVisible({ timeout: 20000 });
    const aPlayers = await a.locator('.arena-versus').innerText();
    const bPlayers = await b.locator('.arena-versus').innerText();
    // The order is viewer-relative; both must contain the same point totals.
    expect(aPlayers.match(/\d+ points/g)?.sort()).toEqual(bPlayers.match(/\d+ points/g)?.sort());
    const outcomes = await Promise.all(
      pages.map((page) => page.locator('.arena-result h2').innerText()),
    );
    if (outcomes[0].includes('draw')) expect(outcomes[1]).toContain('draw');
    else expect(outcomes.filter((outcome) => outcome.includes('Victory'))).toHaveLength(1);
    for (const page of pages) {
      await page.getByRole('button', { name: 'Return to Arena / new match', exact: true }).click();
      await expect(page.locator('.arena-history')).toContainText('points');
      await page.reload();
      await expect(page.locator('.arena-history')).toContainText('points');
      await page.getByRole('button', { name: 'View result', exact: true }).first().click();
      await expect(page.locator('.arena-result')).toBeVisible();
    }
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
