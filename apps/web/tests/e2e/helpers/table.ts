import { expect, type Page } from "@playwright/test";

export async function openTableScenario(
  page: Page,
  scenario = "developerHiring",
) {
  await page.goto(`/app/table?scenario=${scenario}`);

  const firstEditableInput = page
    .locator("tbody input:visible:not([disabled]):not([readonly])")
    .first();

  await expect(firstEditableInput).toBeEditable({ timeout: 8000 });
}

export async function saveCurrentTableProject(page: Page, projectName: string) {
  await page.getByRole("button", { name: /Zapisz tabelę/i }).click();

  await page.getByPlaceholder(/Wybór dostawcy IT/i).fill(projectName);

  await page.getByRole("button", { name: /^Zapisz$/i }).click();

  await expect(page.getByText(/Zapisano w chmurze/i)).toBeVisible({
    timeout: 8000,
  });
}

export function firstEditableTableInput(page: Page) {
  return page
    .locator("tbody input:visible:not([disabled]):not([readonly])")
    .first();
}
