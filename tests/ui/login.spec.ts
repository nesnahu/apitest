import { test, expect } from '@playwright/test';

test('user can log in through Keycloak', async ({ page }) => {
  await page.goto(process.env.UI_BASE_URL!);

  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.locator('input[name="username"]').fill(process.env.UI_USERNAME!);
  await page.locator('input[name="password"]').fill(process.env.UI_PASSWORD!);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/dashboard\.solar-twin\.dev/);
  await expect(page.locator('body')).toContainText(/plant|dashboard|event|alarm/i);
});
