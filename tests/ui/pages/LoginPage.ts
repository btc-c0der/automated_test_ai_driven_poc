import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, SAUCE_PASSWORD, type SauceUser } from '../../../types/ui.types';

export class LoginPage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────────────────────
  readonly usernameInput:    Locator;
  readonly passwordInput:    Locator;
  readonly loginButton:      Locator;
  readonly errorMessage:     Locator;
  readonly errorCloseButton: Locator;
  readonly loginLogo:        Locator;
  readonly acceptedUsernames: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput     = page.locator('[data-test="username"]');
    this.passwordInput     = page.locator('[data-test="password"]');
    this.loginButton       = page.locator('[data-test="login-button"]');
    this.errorMessage      = page.locator('[data-test="error"]');
    this.errorCloseButton  = page.locator('.error-button');
    this.loginLogo         = page.locator('.login_logo');
    this.acceptedUsernames = page.locator('#login_credentials');
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.goto(ROUTES.LOGIN);
  }

  async login(username: SauceUser | string, password: string = SAUCE_PASSWORD): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsStandardUser(): Promise<void> {
    await this.login('standard_user');
    await this.page.waitForURL('**/inventory.html');
  }

  async dismissError(): Promise<void> {
    await this.errorCloseButton.click();
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertErrorVisible(expectedText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedText) {
      await expect(this.errorMessage).toContainText(expectedText);
    }
  }

  async assertOnLoginPage(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
    await expect(this.page).toHaveURL(/\/$/);
  }

  async assertLoginSuccessful(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
  }
}
