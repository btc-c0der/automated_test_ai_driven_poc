import { type Page, type Locator, expect } from '@playwright/test';
import { ROUTES } from '../../../types/ui.types';

/**
 * BasePage — shared foundation for all Page Objects.
 *
 * Provides:
 *  - Common header/nav locators (burger menu, cart, title)
 *  - Navigation helpers (goto, waitForRoute)
 *  - Reusable assertions (assertOnRoute, assertPageTitle)
 *  - Image integrity check (used extensively for problem_user)
 */
export abstract class BasePage {
  readonly page: Page;

  // ─── Header locators ──────────────────────────────────────────────────────
  readonly burgerMenuButton: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly pageTitle: Locator;
  readonly menuAllItems: Locator;
  readonly menuAbout: Locator;
  readonly menuLogout: Locator;
  readonly menuResetState: Locator;
  readonly menuCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.burgerMenuButton  = page.locator('#react-burger-menu-btn');
    this.cartLink          = page.locator('.shopping_cart_link');
    this.cartBadge         = page.locator('.shopping_cart_badge');
    this.pageTitle         = page.locator('.title');
    this.menuAllItems      = page.locator('#inventory_sidebar_link');
    this.menuAbout         = page.locator('#about_sidebar_link');
    this.menuLogout        = page.locator('#logout_sidebar_link');
    this.menuResetState    = page.locator('#reset_sidebar_link');
    this.menuCloseButton   = page.locator('#react-burger-cross-btn');
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  async goto(path: string = ROUTES.LOGIN): Promise<void> {
    await this.page.goto(path);
  }

  async openBurgerMenu(): Promise<void> {
    await this.burgerMenuButton.click();
    await this.menuLogout.waitFor({ state: 'visible' });
  }

  async logout(): Promise<void> {
    await this.openBurgerMenu();
    await this.menuLogout.click();
    await this.page.waitForURL('**/');
  }

  async resetAppState(): Promise<void> {
    await this.openBurgerMenu();
    await this.menuResetState.click();
    await this.menuCloseButton.click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
    await this.page.waitForURL('**/cart.html');
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertOnRoute(route: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(route.replace(/\./g, '\\.')));
  }

  async assertPageTitle(expected: string): Promise<void> {
    await expect(this.pageTitle).toHaveText(expected);
  }

  async assertCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }

  /**
   * Assert all <img> elements on the page have loaded successfully.
   * Waits for network idle first to avoid false failures from slow-loading images.
   * Broken images (naturalWidth === 0 after load) are flagged with their src.
   */
  async assertAllImagesLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    const images = this.page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src') ?? '(no src)';
      const loaded = await img.evaluate((el: HTMLImageElement) =>
        el.complete && el.naturalWidth > 0
      );
      expect(loaded, `Image failed to load: ${src}`).toBe(true);
    }
  }

  /**
   * Returns a list of broken image sources (naturalWidth === 0 after network idle).
   */
  async getBrokenImages(): Promise<string[]> {
    await this.page.waitForLoadState('networkidle');
    const images = this.page.locator('img');
    const count = await images.count();
    const broken: string[] = [];

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src') ?? '(no src)';
      const loaded = await img.evaluate((el: HTMLImageElement) =>
        el.complete && el.naturalWidth > 0
      );
      if (!loaded) broken.push(src);
    }
    return broken;
  }

  /**
   * Returns all image src attributes visible on the page.
   * Used to detect problem_user's "all images same src" bug.
   */
  async getImageSources(selector = 'img'): Promise<string[]> {
    await this.page.waitForLoadState('networkidle');
    return this.page.locator(selector).evaluateAll(
      (imgs: HTMLImageElement[]) => imgs.map(img => img.getAttribute('src') ?? '')
    );
  }
}
