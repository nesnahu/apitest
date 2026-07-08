import { expect, type Frame, type Locator, type Page, test } from '@playwright/test';

const env = {
  apiBaseUrl: process.env.API_BASE_URL,
  authHeader: process.env.AUTH_HEADER,
  password: process.env.UI_PASSWORD,
  username: process.env.UI_USERNAME,
};

type SearchContext = Page | Frame;

function searchableContexts(page: Page): SearchContext[] {
  return [page, ...page.frames().filter((frame) => !frame.isDetached())];
}

function usernameLocators(context: SearchContext): Locator[] {
  return [
    context.getByLabel(/email|e-mail|username|user name|user|login|account/i),
    context.getByPlaceholder(/email|e-mail|username|user name|user|login|account/i),
    context.locator(
      [
        'input:visible[name*="email" i]',
        'input:visible[name*="user" i]',
        'input:visible[name*="login" i]',
        'input:visible[name*="account" i]',
        'input:visible[autocomplete="username"]',
        'input:visible[type="email"]',
        'input:visible[id*="email" i]',
        'input:visible[id*="user" i]',
        'input:visible[id*="login" i]',
        'input:visible[id*="account" i]',
        'input:visible[aria-label*="email" i]',
        'input:visible[aria-label*="user" i]',
        'input:visible[aria-label*="login" i]',
        'input:visible:not([type])',
        'input:visible[type="text"]',
      ].join(', '),
    ),
  ];
}

function passwordLocators(context: SearchContext): Locator[] {
  return [
    context.getByLabel(/password/i),
    context.getByPlaceholder(/password/i),
    context.locator(
      [
        'input:visible[name*="password" i]',
        'input:visible[autocomplete="current-password"]',
        'input:visible[type="password"]',
        'input:visible[id*="password" i]',
        'input:visible[aria-label*="password" i]',
      ].join(', '),
    ),
  ];
}

function signInLocators(context: SearchContext): Locator[] {
  return [
    context.getByRole('button', {
      name: /log in|login|sign in|single sign|sso|microsoft|azure|continue|next/i,
    }),
    context.getByRole('link', {
      name: /log in|login|sign in|single sign|sso|microsoft|azure|continue|next/i,
    }),
    context.locator(
      [
        'button:visible[type="submit"]',
        'input:visible[type="submit"]',
        'a:visible[href*="login" i]',
        'a:visible[href*="signin" i]',
        'a:visible[href*="sso" i]',
        'a:visible[href*="oauth" i]',
      ].join(', '),
    ),
  ];
}

async function collectLoginDiagnostics(page: Page) {
  const snapshots = [];

  for (const context of searchableContexts(page)) {
    try {
      const snapshot = await context.evaluate(() => {
        const summarize = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const visible =
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none';

          return {
            ariaLabel: element.getAttribute('aria-label'),
            autocomplete: element.getAttribute('autocomplete'),
            id: element.id || null,
            name: element.getAttribute('name'),
            placeholder: element.getAttribute('placeholder'),
            text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) || null,
            type: element.getAttribute('type'),
            visible,
          };
        };

        return {
          buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
            .map(summarize)
            .slice(0, 20),
          inputs: Array.from(document.querySelectorAll('input, textarea')).map(summarize).slice(0, 20),
          links: Array.from(document.querySelectorAll('a')).map(summarize).slice(0, 20),
          title: document.title,
          url: window.location.href,
        };
      });

      snapshots.push(snapshot);
    } catch {
      snapshots.push({ url: context.url(), error: 'Could not inspect this frame.' });
    }
  }

  return JSON.stringify(snapshots, null, 2);
}

async function tryFillFirstVisible(
  page: Page,
  buildLocators: (context: SearchContext) => Locator[],
  value: string,
) {
  for (const context of searchableContexts(page)) {
    for (const locator of buildLocators(context)) {
      const count = await locator.count();

      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);

        if (await candidate.isVisible()) {
          await candidate.fill(value);
          return true;
        }
      }
    }
  }

  return false;
}

async function fillFirstVisible(
  page: Page,
  buildLocators: (context: SearchContext) => Locator[],
  value: string,
  description: string,
) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (await tryFillFirstVisible(page, buildLocators, value)) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(
    `Could not find a visible ${description} field. Current URL: ${page.url()}\n` +
      `Login page diagnostics:\n${await collectLoginDiagnostics(page)}`,
  );
}

async function tryClickFirstVisible(page: Page, buildLocators: (context: SearchContext) => Locator[]) {
  for (const context of searchableContexts(page)) {
    for (const locator of buildLocators(context)) {
      const count = await locator.count();

      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);

        if (await candidate.isVisible()) {
          await Promise.all([
            page.waitForLoadState('domcontentloaded').catch(() => undefined),
            candidate.click(),
          ]);
          return true;
        }
      }
    }
  }

  return false;
}

async function clickFirstVisible(
  page: Page,
  buildLocators: (context: SearchContext) => Locator[],
  description: string,
) {
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    if (await tryClickFirstVisible(page, buildLocators)) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(
    `Could not find a visible ${description}. Current URL: ${page.url()}\n` +
      `Login page diagnostics:\n${await collectLoginDiagnostics(page)}`,
  );
}

test.describe('alarm notifications', () => {
  test.skip(!env.username || !env.password, 'Set UI_USERNAME and UI_PASSWORD to run this test.');

  test('logs in', async ({ page }) => {
    await page.goto('/');

    if (!(await tryFillFirstVisible(page, usernameLocators, env.username!))) {
      await clickFirstVisible(page, signInLocators, 'sign-in entry point');
      await fillFirstVisible(page, usernameLocators, env.username!, 'username');
    }

    await fillFirstVisible(page, passwordLocators, env.password!, 'password');
    await clickFirstVisible(page, signInLocators, 'login button');

    await expect(
      page
        .getByRole('button', { name: /log out|logout|sign out/i })
        .or(page.getByText(/alarm notifications/i)),
    ).toBeVisible();
  });
});
