import { expect, test } from '@playwright/test';

const env = {
  apiBaseUrl: process.env.API_BASE_URL,
  authHeader: process.env.AUTH_HEADER,
  password: process.env.UI_PASSWORD,
  username: process.env.UI_USERNAME,
};

test.describe('alarm notifications', () => {
  test.skip(!env.username || !env.password, 'Set UI_USERNAME and UI_PASSWORD to run this test.');

  test('logs in', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email|username|user name/i).fill(env.username!);
    await page.getByLabel(/password/i).fill(env.password!);
    await page.getByRole('button', { name: /log in|login|sign in/i }).click();

    await expect(
      page
        .getByRole('button', { name: /log out|logout|sign out/i })
        .or(page.getByText(/alarm notifications/i)),
    ).toBeVisible();
  });
});
