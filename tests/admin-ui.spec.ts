import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /accedi/i }).click();
  // Attende un elemento reale dell'area admin (sidebar), non solo l'URL.
  await expect(page.getByRole("link", { name: "Richieste recesso" })).toBeVisible({
    timeout: 60_000,
  });
}

test.beforeEach(async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Credenziali staging mancanti");
  await login(page);
});

test("Compagnie: il focus resta nel campo durante la digitazione e salva", async ({ page }) => {
  await page.goto("/admin/insurance-companies");

  await page.getByRole("button", { name: "Nuova compagnia" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const name = page.locator("#c-displayName");
  const typed = `E2E Focus ${Date.now()}`;

  // Digitazione carattere per carattere: se il focus viene rubato, i caratteri si perdono.
  await name.click();
  await name.pressSequentially(typed, { delay: 40 });

  // Il valore deve corrispondere esattamente e il focus restare sull'input.
  await expect(name).toHaveValue(typed);
  await expect(name).toBeFocused();

  await page.locator("#c-legalName").fill(`${typed} SpA`);
  await page.locator("#c-withdrawalEmail").fill("e2e@example.com");

  await dialog.getByRole("button", { name: "Salva" }).click();

  // Il modale si chiude e la nuova compagnia appare in tabella.
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("cell", { name: typed })).toBeVisible();
});

test("Compagnie: modifica di una compagnia esistente persiste", async ({ page }) => {
  await page.goto("/admin/insurance-companies");

  const firstEdit = page.getByRole("button", { name: "Modifica" }).first();
  await firstEdit.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const name = page.locator("#c-displayName");
  const updated = `Demo Modificata ${Date.now()}`;
  await name.click();
  await name.fill(updated);
  await expect(name).toHaveValue(updated);

  await dialog.getByRole("button", { name: "Salva" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("cell", { name: updated })).toBeVisible();
});

test("Template email: digitazione e salvataggio del copy", async ({ page }) => {
  await page.goto("/admin/email-templates");

  const subject = page.locator('input[id^="subject-"]').first();
  await expect(subject).toBeVisible();

  // Campo svuotato e digitato a velocità "umana": verifica nessuno scramble dei caratteri.
  const newSubject = `Recesso {{policyNumber}} cliente {{customerFirstName}} ${Date.now()}`;
  await subject.click();
  await subject.fill("");
  await subject.pressSequentially(newSubject, { delay: 80 });
  await expect(subject).toBeFocused();
  await expect(subject).toHaveValue(newSubject);

  const card = page.locator(".rounded-2xl", { has: subject }).first();
  await card.getByRole("button", { name: "Salva modifiche" }).click();

  await expect(card.getByText(/salvato correttamente/i)).toBeVisible();
});
