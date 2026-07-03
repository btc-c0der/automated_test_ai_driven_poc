import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES } from '../../../types/ui.types';

export class CartPage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────────────────────
  readonly cartList:        Locator;
  readonly cartItems:       Locator;
  readonly continueButton:  Locator;
  readonly checkoutButton:  Locator;

  constructor(page: Page) {
    super(page);
    this.cartList       = page.locator('.cart_list');
    this.cartItems      = page.locator('.cart_item');
    this.continueButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  // ─── Item locator helpers ─────────────────────────────────────────────────

  cartItem(name: string): Locator {
    return this.page.locator('.cart_item').filter({ hasText: name });
  }

  removeButton(name: string): Locator {
    return this.cartItem(name).locator('[data-test^="remove"]');
  }

  itemPrice(name: string): Locator {
    return this.cartItem(name).locator('.inventory_item_price');
  }

  itemQuantity(name: string): Locator {
    return this.cartItem(name).locator('.cart_quantity');
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.goto(ROUTES.CART);
  }

  async removeItem(name: string): Promise<void> {
    await this.removeButton(name).click();
  }

  async continueShopping(): Promise<void> {
    await this.continueButton.click();
    await this.page.waitForURL(/inventory\.html/);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await this.page.waitForURL(/checkout-step-one\.html/);
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertOnCartPage(): Promise<void> {
    await expect(this.cartList).toBeVisible();
    await this.assertOnRoute(ROUTES.CART);
  }

  async assertItemCount(expected: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(expected);
  }

  async assertItemVisible(name: string): Promise<void> {
    await expect(this.cartItem(name)).toBeVisible();
  }

  async assertItemNotVisible(name: string): Promise<void> {
    await expect(this.cartItem(name)).not.toBeVisible();
  }

  async assertEmpty(): Promise<void> {
    await expect(this.cartItems).toHaveCount(0);
  }

  async assertItemPrice(name: string, expected: string): Promise<void> {
    await expect(this.itemPrice(name)).toHaveText(expected);
  }

  async assertItemQuantity(name: string, expected: string): Promise<void> {
    await expect(this.itemQuantity(name)).toHaveText(expected);
  }
}
