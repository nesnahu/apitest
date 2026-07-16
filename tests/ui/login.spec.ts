import { expect, type Page, test } from '@playwright/test';

test('user can log in through Keycloak and reach the dashboard', async ({ page }) => {
  test.setTimeout(90_000);

  const username = requiredEnv('UI_USERNAME');
  const password = requiredEnv('UI_PASSWORD');
  const baseUrl = process.env.UI_BASE_URL || 'https://dashboard.solar-twin.dev';

  await page.goto(baseUrl);

  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();

  await expectRedirectToDashboardOrExplainKeycloakState(page);
  await expect(page.locator('body')).toContainText(/dashboard|plant|event|alarm|solar twin/i);
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set for UI tests.`);
  }
  return value;
}

async function expectRedirectToDashboardOrExplainKeycloakState(page: Page) {
  try {
    await page.waitForURL(/dashboard\.solar-twin\.dev/, { timeout: 60_000 });
  } catch {
    const currentUrl = page.url();
    const keycloakMessage = await page
      .locator('.kc-feedback-text, .alert-error, .pf-v5-c-alert, .pf-c-alert, #input-error')
      .first()
      .textContent({ timeout: 2_000 })
      .catch(() => '');
    const pageText = await page.locator('body').innerText({ timeout: 2_000 }).catch(() => '');

    throw new Error(
      [
        'Login did not redirect back to dashboard.solar-twin.dev.',
        `Current URL: ${currentUrl}`,
        keycloakMessage ? `Keycloak message: ${keycloakMessage.trim()}` : '',
        `Visible page text: ${pageText.slice(0, 500)}`
      ]
        .filter(Boolean)
        .join('\n')
    );
  }
}
