import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../tests/ui/pages/LoginPage';
import { InventoryPage } from '../tests/ui/pages/InventoryPage';
import { CartPage } from '../tests/ui/pages/CartPage';
import { CheckoutPage } from '../tests/ui/pages/CheckoutPage';
import { SAUCE_PASSWORD, type SauceUser } from '../types/ui.types';

// ─── Fixture types ────────────────────────────────────────────────────────────

export interface UiFixtures {
  /** All POM pages in one object */
  pages: {
    login:     LoginPage;
    inventory: InventoryPage;
    cart:      CartPage;
    checkout:  CheckoutPage;
  };

  /** Page already logged in as standard_user */
  standardPage: Page;

  /** Page already logged in as problem_user */
  problemPage: Page;

  /** Page already logged in as performance_glitch_user */
  perfPage: Page;

  /** Login page opened (not yet logged in) */
  loginPage: LoginPage;

  /** Inventory page — already logged in as standard_user */
  inventoryPage: InventoryPage;

  /** Cart page — already logged in as standard_user, cart may be empty */
  cartPage: CartPage;

  /** Checkout page — already logged in as standard_user */
  checkoutPage: CheckoutPage;
}

// ─── Helper: login and navigate to inventory ─────────────────────────────────

async function loginAs(page: Page, user: SauceUser): Promise<void> {
  await page.goto('/');
  await page.locator('[data-test="username"]').fill(user);
  await page.locator('[data-test="password"]').fill(SAUCE_PASSWORD);
  await page.locator('[data-test="login-button"]').click();
  await page.waitForURL('**/inventory.html');
}

// ─── Extended test with UI fixtures ──────────────────────────────────────────

export const test = base.extend<UiFixtures>({
  // All page objects — caller decides when to login
  pages: async ({ page }, use) => {
    await use({
      login:     new LoginPage(page),
      inventory: new InventoryPage(page),
      cart:      new CartPage(page),
      checkout:  new CheckoutPage(page),
    });
  },

  // Login page opened, not yet authenticated
  loginPage: async ({ page }: { page: Page }, use: (p: LoginPage) => Promise<void>) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await use(loginPage);
  },

  // Authenticated as standard_user, on inventory page
  standardPage: async ({ page }, use) => {
    await loginAs(page, 'standard_user');
    await use(page);
  },

  // Authenticated as problem_user — exposes broken images and form bugs
  problemPage: async ({ page }, use) => {
    await loginAs(page, 'problem_user');
    await use(page);
  },

  // Authenticated as performance_glitch_user
  perfPage: async ({ page }, use) => {
    await loginAs(page, 'performance_glitch_user');
    await use(page);
  },

  // Inventory POM, already logged in as standard_user
  inventoryPage: async ({ page }: { page: Page }, use: (p: InventoryPage) => Promise<void>) => {
    await loginAs(page, 'standard_user');
    const inv = new InventoryPage(page);
    // Reset cart state before each test
    await inv.resetAppState();
    await use(inv);
  },

  // Cart POM, already logged in as standard_user
  cartPage: async ({ page }: { page: Page }, use: (p: CartPage) => Promise<void>) => {
    await loginAs(page, 'standard_user');
    const cart = new CartPage(page);
    await use(cart);
  },

  // Checkout POM, already logged in as standard_user
  checkoutPage: async ({ page }: { page: Page }, use: (p: CheckoutPage) => Promise<void>) => {
    await loginAs(page, 'standard_user');
    const checkout = new CheckoutPage(page);
    await use(checkout);
  },
});

export { expect } from '@playwright/test';
