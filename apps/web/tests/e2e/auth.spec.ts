import { test, expect } from '@playwright/test';
import {
  registerFromLanding,
  logoutFromApp,
  loginFromLanding,
} from './helpers/auth';

test('registers, logs out, and logs in again from the landing page', async ({ page }) => {
  const testEmail = `tester_${Date.now()}@decidely.com`;
  const testPassword = 'Password123!';

  await registerFromLanding(page, {
    name: 'Jan Testowy',
    email: testEmail,
    password: testPassword,
  });

  await expect(page.getByText('Jan Testowy')).toBeVisible();

  await logoutFromApp(page);

  await loginFromLanding(page, {
    email: testEmail,
    password: testPassword,
  });

  await expect(page).toHaveURL(/\/app/);
});