import { test, expect } from '@playwright/test';
import { registerFromLanding } from './helpers/auth';
import {
  firstEditableTableInput,
  openTableScenario,
  saveCurrentTableProject,
} from './helpers/table';

test('creates a table project and persists changes with auto-save', async ({ page }) => {
  const testEmail = `tabela_${Date.now()}@decidely.com`;
  const testPassword = 'Password123!';
  const projectName = `Wybór służbowego laptopa ${Date.now()}`;
  const changedValue = `Zmieniona Wartość Testowa ${Date.now()}`;

  await registerFromLanding(page, {
    name: 'Tester Zapisu',
    email: testEmail,
    password: testPassword,
  });

  await openTableScenario(page, 'developerHiring');

  await saveCurrentTableProject(page, projectName);

  const firstTableInput = firstEditableTableInput(page);

  await expect(firstTableInput).toBeEditable({ timeout: 8000 });
  await firstTableInput.fill(changedValue);
  await page.keyboard.press('Tab');

  await expect(page.getByText(/Zapisano w chmurze/i)).toBeVisible({
    timeout: 10000,
  });

  await page.reload();

  const reloadedFirstTableInput = firstEditableTableInput(page);

  await expect(reloadedFirstTableInput).toHaveValue(changedValue, {
    timeout: 10000,
  });
});