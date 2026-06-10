import { expect, type Page } from "@playwright/test";

export async function registerFromLanding(
  page: Page,
  {
    name = "Tester E2E",
    email,
    password = "Password123!",
  }: {
    name?: string;
    email: string;
    password?: string;
  },
) {
  await page.goto("/");

  await page.getByRole("button", { name: /Zaloguj/i }).click();
  await page.getByText(/Zarejestruj/i).click();

  await page.getByLabel("Imię").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);
  await page.getByLabel("Potwierdź hasło").fill(password);

  await page
    .getByRole("button", { name: /Zarejestruj się|Utwórz konto/i })
    .click();

  await page.waitForURL(/\/app/);
}

export async function logoutFromApp(page: Page) {
  await page
    .getByRole("button", { name: /Wyloguj/i })
    .first()
    .click();
  await page
    .getByRole("button", { name: /Wyloguj/i })
    .nth(1)
    .click();

  await expect(page).toHaveURL("/");
}

export async function loginFromLanding(
  page: Page,
  {
    email,
    password = "Password123!",
  }: {
    email: string;
    password?: string;
  },
) {
  await page.goto("/");

  await page.getByRole("button", { name: /Zaloguj/i, exact: true }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Hasło", { exact: true }).fill(password);

  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/v1/auth/login"),
  );

  await page
    .getByRole("button", { name: /Zaloguj się/i })
    .click();

  const loginResponse = await loginResponsePromise;

  if (!loginResponse.ok()) {
    const body = await loginResponse.text();

    throw new Error(
      `Login failed with status ${loginResponse.status()}:\n${body}`,
    );
  }

  await expect(page).toHaveURL(/\/app/, { timeout: 10_000 });
}