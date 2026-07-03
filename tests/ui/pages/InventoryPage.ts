import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, type SortOption, type Product } from '../../../types/ui.types';

export class InventoryPage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────────────────────
  readonly inventoryContainer: Locator;
  readonly inventoryItems:     Locator;
  readonly sortDropdown:       Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryContainer = page.locator('.inventory_container');
    this.inventoryItems     = page.locator('.inventory_item');
    this.sortDropdown       = page.locator('[data-test="product-sort-container"]');
  }

  // ─── Item locator helpers ─────────────────────────────────────────────────

  /** Locator for a single item card by product name */
  item(name: string): Locator {
    return this.page.locator('.inventory_item').filter({ hasText: name });
  }

  /** Add-to-cart button for a named product */
  addToCartButton(name: string): Locator {
    return this.item(name).locator('[data-test^="add-to-cart"]');
  }

  /** Remove button for a named product (after it has been added) */
  removeButton(name: string): Locator {
    return this.item(name).locator('[data-test^="remove"]');
  }

  /** Product image within an item card */
  itemImage(name: string): Locator {
    return this.item(name).locator('img.inventory_item_img');
  }

  /** Product name link within an item card */
  itemNameLink(name: string): Locator {
    return this.item(name).locator('.inventory_item_name');
  }

  /** Price element within an item card */
  itemPrice(name: string): Locator {
    return this.item(name).locator('.inventory_item_price');
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    await this.goto(ROUTES.INVENTORY);
  }

  async addToCart(productName: string): Promise<void> {
    await this.addToCartButton(productName).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption({ value: option });
  }

  async clickProductName(name: string): Promise<void> {
    await this.itemNameLink(name).click();
    await this.page.waitForURL(/inventory-item\.html/);
  }

  // ─── Data extraction ──────────────────────────────────────────────────────

  /**
   * Returns all visible product names in DOM order.
   * Used to assert sort order.
   */
  async getAllProductNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  /**
   * Returns all visible prices as numbers (strips the $ sign).
   * Used to assert price sort order.
   */
  async getAllPrices(): Promise<number[]> {
    const texts = await this.page.locator('.inventory_item_price').allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  /**
   * Scrapes all items into a typed Product array.
   * Used for cross-user comparison tests.
   */
  async getAllProducts(): Promise<Product[]> {
    const count = await this.inventoryItems.count();
    const products: Product[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.inventoryItems.nth(i);
      const name        = await item.locator('.inventory_item_name').innerText();
      const description = await item.locator('.inventory_item_desc').innerText();
      const priceText   = await item.locator('.inventory_item_price').innerText();
      const imageSrc    = await item.locator('img').getAttribute('src') ?? '';
      const id          = await item.locator('[data-test^="add-to-cart"]').getAttribute('data-test') ?? '';

      products.push({
        id,
        name,
        description,
        price: parseFloat(priceText.replace('$', '')),
        imageSrc,
      });
    }

    return products;
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertOnInventoryPage(): Promise<void> {
    await expect(this.inventoryContainer).toBeVisible();
    await this.assertOnRoute(ROUTES.INVENTORY);
  }

  async assertItemCount(expected: number): Promise<void> {
    await expect(this.inventoryItems).toHaveCount(expected);
  }

  async assertProductVisible(name: string): Promise<void> {
    await expect(this.item(name)).toBeVisible();
  }

  async assertAddToCartVisible(name: string): Promise<void> {
    await expect(this.addToCartButton(name)).toBeVisible();
  }

  async assertRemoveVisible(name: string): Promise<void> {
    await expect(this.removeButton(name)).toBeVisible();
  }

  async assertSortedAZ(): Promise<void> {
    const names = await this.getAllProductNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  }

  async assertSortedZA(): Promise<void> {
    const names = await this.getAllProductNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  }

  async assertSortedPriceLowToHigh(): Promise<void> {
    const prices = await this.getAllPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  }

  async assertSortedPriceHighToLow(): Promise<void> {
    const prices = await this.getAllPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  }
}
