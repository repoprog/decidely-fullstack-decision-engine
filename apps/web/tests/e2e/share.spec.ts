import { test, expect } from '@playwright/test';
import { registerFromLanding } from './helpers/auth';
import {
  openTableScenario,
  saveCurrentTableProject,
} from './helpers/table';

test('shares a table project and exposes a public read-only view', async ({ page, browser }) => {
  const testEmail = `share_${Date.now()}@decidely.com`;
  const testPassword = 'Password123!';
  const projectName = `Projekt do udostępnienia ${Date.now()}`;

  await registerFromLanding(page, {
    name: 'Tester Share',
    email: testEmail,
    password: testPassword,
  });

  await openTableScenario(page, 'developerHiring');

  await saveCurrentTableProject(page, projectName);

  await page.getByRole('button', { name: /Udostępnij/i }).click();

  await expect(page.getByText(/Udostępnij projekt/i)).toBeVisible({
    timeout: 5000,
  });

  await page.getByRole('button', { name: /Wygeneruj link/i }).click();

  const shareLink = page.locator('text=/\\/shared\\//').first();

  await expect(shareLink).toBeVisible({
    timeout: 10000,
  });

  const shareUrlText = await shareLink.textContent();
  expect(shareUrlText).toBeTruthy();

  const shareUrl = shareUrlText!.trim();
  expect(shareUrl).toContain('/shared/');

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();

  await publicPage.goto(shareUrl);

  await expect(publicPage.getByText(projectName)).toBeVisible({
    timeout: 10000,
  });

  await expect(publicPage.getByText(/Tryb tylko do odczytu/i)).toBeVisible({
    timeout: 10000,
  });

  const editableInputs = publicPage.locator(
    'input:visible:not([disabled]):not([readonly])'
  );

  await expect(editableInputs).toHaveCount(0, {
    timeout: 5000,
  });

  await publicContext.close();
});