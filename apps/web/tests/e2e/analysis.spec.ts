import { test, expect } from '@playwright/test';
import { registerFromLanding } from './helpers/auth';
import {
  openTableScenario,
  saveCurrentTableProject,
} from './helpers/table';

test('runs backend table analysis and displays the result in the UI', async ({ page }) => {
  const testEmail = `analysis_${Date.now()}@decidely.com`;
  const testPassword = 'Password123!';
  const projectName = `Test analizy backendowej ${Date.now()}`;

  await registerFromLanding(page, {
    name: 'Tester Analizy',
    email: testEmail,
    password: testPassword,
  });

  await openTableScenario(page, 'developerHiring');

  await saveCurrentTableProject(page, projectName);

  await page.getByRole('button', { name: /Przelicz/i }).click();

  await expect(page.getByText(/Liczę|Przeliczam|Analizuję/i)).toBeHidden({
    timeout: 15000,
  });

  await expect(
    page.getByText(/Błąd weryfikacji serwera|Błąd połączenia|Błąd analizy/i)
  ).toBeHidden();

  await expect(
    page.getByText(/Zwycięzca|Brak jednoznacznego zwycięzcy|Ostrzeżenie|uwag|domin/i).first()
  ).toBeVisible({
    timeout: 10000,
  });
});