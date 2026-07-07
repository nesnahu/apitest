import { expect, type Locator, type Page, test } from '@playwright/test';

const env = {
  apiBaseUrl: process.env.API_BASE_URL,
  authHeader: process.env.AUTH_HEADER,
  password: process.env.UI_PASSWORD,
  username: process.env.UI_USERNAME,
};

async function fillFirstVisible(page: Page, locators: Locator[], value: string, description: string) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      const count = await locator.count();

      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);

        if (await candidate.isVisible()) {
          await candidate.fill(value);
          return;
        }
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Could not find a visible ${description} field.`);
}

async function clickFirstVisible(page: Page, locators: Locator[], description: string) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      const count = await locator.count();

      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);

        if (await candidate.isVisible()) {
          await candidate.click();
          return;
        }
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Could not find a visible ${description}.`);
}

test.describe('alarm notifications', () => {
  test.skip(!env.username || !env.password, 'Set UI_USERNAME and UI_PASSWORD to run this test.');

  test('logs in', async ({ page }) => {
    await page.goto('/login');

    await fillFirstVisible(
      page,
      [
        page.getByLabel(/email|username|user name|user/i),
        page.getByPlaceholder(/email|username|user name|user/i),
        page.locator(
          [
            'input:visible[name="email"]',
            'input:visible[name="username"]',
            'input:visible[name="user"]',
            'input:visible[autocomplete="username"]',
            'input:visible[type="email"]',
            'input:visible[id*="email" i]',
            'input:visible[id*="user" i]',
            'input:visible:not([type])',
            'input:visible[type="text"]',
          ].join(', '),
        ),
      ],
      env.username!,
      'username',
    );
    await fillFirstVisible(
      page,
      [
        page.getByLabel(/password/i),
        page.getByPlaceholder(/password/i),
        page.locator(
          [
            'input:visible[name="password"]',
            'input:visible[autocomplete="current-password"]',
            'input:visible[type="password"]',
            'input:visible[id*="password" i]',
          ].join(', '),
        ),
      ],
      env.password!,
      'password',
    );
    await clickFirstVisible(
      page,
      [
        page.getByRole('button', { name: /log in|login|sign in|submit/i }),
        page.locator('button:visible[type="submit"], input:visible[type="submit"]'),
      ],
      'login button',
    );

    await expect(
      page
        .getByRole('button', { name: /log out|logout|sign out/i })
        .or(page.getByText(/alarm notifications/i)),
    ).toBeVisible();
  });
});
