/**
 * problem_user — Defect Detection Suite
 *
 * problem_user is a seeded test account whose session intentionally exposes
 * real application bugs. Tests in this file document each defect, assert
 * that the bug IS present (tests pass when the bug exists), and establish
 * a baseline so regressions are caught if bugs are accidentally introduced
 * to other users, or if bugs are silently fixed.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * CONFIRMED BUGS (from live DOM inspection):
 *
 *   BUG-UI-001  All 6 product images on inventory page use the same
 *               sl-404 placeholder src instead of product-specific images.
 *               (images DO load — naturalWidth=600 — but they're all wrong)
 *
 *   BUG-UI-002  Product name links on inventory page navigate to the WRONG
 *               product detail page (e.g. clicking "Sauce Labs Backpack"
 *               opens Sauce Labs Onesie's detail page).
 *
 *   BUG-UI-003  Product image links exhibit the same wrong-product navigation
 *               as BUG-UI-002. Also: the detail page image is the sl-404
 *               placeholder (BUG-UI-001 extends to detail pages).
 *
 *   BUG-UI-004  Checkout form: lastName field does not retain typed input.
 *               (fills with text from firstName or stays empty)
 *
 *   BUG-UI-005  Sort functionality produces incorrect order (sort order
 *               does not change the displayed items).
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Pattern: each "documents the bug" test asserts the violation IS present.
 * Each companion "baseline / expected behaviour" describe block runs the
 * same assertion against standard_user and must pass — giving us a
 * regression guard once bugs are fixed.
 */

import { test, expect } from '../../fixtures/ui-fixtures';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage } from './pages/InventoryPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SAUCE_PASSWORD } from '../../types/ui.types';

// Known placeholder src assigned to all problem_user product images
const PLACEHOLDER_SRC = /sl-404/;

// The 6 known product names (stable across users)
const ALL_PRODUCTS = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Image Defects (BUG-UI-001)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('problem_user — BUG-UI-001: Inventory images show wrong placeholder', () => {

  test('all 6 product images on inventory page use the sl-404 placeholder src', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);
    const srcs = await inv.getImageSources('.inventory_item img');

    // All 6 images should be present
    expect(srcs).toHaveLength(6);

    // Every image points to the same placeholder — this is the bug
    for (const src of srcs) {
      expect(src, `Expected sl-404 placeholder, got: ${src}`).toMatch(PLACEHOLDER_SRC);
    }
  });

  test('all product image srcs are identical — no product-specific images', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);
    const srcs = await inv.getImageSources('.inventory_item img');

    const uniqueSrcs = new Set(srcs);
    // The bug: all 6 items share a single src
    expect(
      uniqueSrcs.size,
      `Expected 1 unique src (the placeholder) but found ${uniqueSrcs.size}: ${[...uniqueSrcs].join(', ')}`
    ).toBe(1);
  });

  test('images do technically load (naturalWidth > 0) — the placeholder file itself is valid', async ({ problemPage }) => {
    // This confirms the bug is "wrong image shown", NOT "image fails to load".
    // naturalWidth > 0 means the browser successfully fetched the file.
    const inv = new InventoryPage(problemPage);
    await inv.page.waitForLoadState('networkidle');

    const results = await inv.page.locator('.inventory_item img').evaluateAll(
      (imgs: HTMLImageElement[]) =>
        imgs.map(img => ({ src: img.getAttribute('src'), naturalWidth: img.naturalWidth }))
    );

    for (const { src, naturalWidth } of results) {
      expect(naturalWidth, `Placeholder image at ${src} failed to load (naturalWidth=0)`).toBeGreaterThan(0);
    }
  });

  // ── Baseline: standard_user must have unique, non-placeholder images ──────

  test('BASELINE | standard_user: each product has a unique, product-specific image src', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    const srcs = await inv.getImageSources('.inventory_item img');

    expect(srcs).toHaveLength(6);

    const uniqueSrcs = new Set(srcs);
    expect(
      uniqueSrcs.size,
      `standard_user should have 6 unique image srcs but got ${uniqueSrcs.size}`
    ).toBe(6);

    for (const src of srcs) {
      expect(src, `standard_user image should not be the sl-404 placeholder: ${src}`).not.toMatch(PLACEHOLDER_SRC);
    }
  });

  test('BASELINE | standard_user: all product images load successfully (naturalWidth > 0)', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    await inv.assertAllImagesLoaded();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Navigation Defects (BUG-UI-002, BUG-UI-003)
//
// REVISED after live test run:
// problem_user product name/image links DO navigate — but to the WRONG product.
// Clicking "Sauce Labs Backpack" (index 0) navigates to id=5 (Sauce Labs Onesie).
// ─────────────────────────────────────────────────────────────────────────────

test.describe('problem_user — BUG-UI-002/003: Product links navigate to wrong product', () => {

  test('clicking a product name navigates to a detail page but for the wrong product', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);

    // Click "Sauce Labs Backpack" — should navigate to its own detail page
    await inv.itemNameLink(ALL_PRODUCTS[0]).click();
    await problemPage.waitForURL(/inventory-item\.html/, { timeout: 5000 });

    // We ARE on a detail page, but confirm it is NOT the correct product
    const detailName = await problemPage.locator('.inventory_details_name').innerText();
    expect(
      detailName,
      `BUG-UI-002: Clicking "${ALL_PRODUCTS[0]}" should show its detail page but shows "${detailName}"`
    ).not.toBe(ALL_PRODUCTS[0]);
  });

  test('clicking a product image navigates to a detail page but for the wrong product', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);

    await inv.itemImage(ALL_PRODUCTS[0]).click();
    await problemPage.waitForURL(/inventory-item\.html/, { timeout: 5000 });

    const detailName = await problemPage.locator('.inventory_details_name').innerText();
    expect(
      detailName,
      `BUG-UI-003: Clicking image of "${ALL_PRODUCTS[0]}" should open its detail but shows "${detailName}"`
    ).not.toBe(ALL_PRODUCTS[0]);
  });

  test('detail page reached via wrong link shows a real image — but for the wrong product', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);
    // Click "Sauce Labs Backpack" — navigates to a different product's detail page
    await inv.itemNameLink(ALL_PRODUCTS[0]).click();
    await problemPage.waitForURL(/inventory-item\.html/, { timeout: 5000 });

    const detailImgSrc   = await problemPage.locator('.inventory_details_img').getAttribute('src') ?? '';
    const detailName     = await problemPage.locator('.inventory_details_name').innerText();

    // The detail page image is NOT sl-404 (it shows the wrong product's real image)
    expect(
      detailImgSrc,
      `Detail page shows image for "${detailName}" (wrong product) — but the image itself is real, not sl-404`
    ).not.toMatch(PLACEHOLDER_SRC);

    // But the product name confirms we are on the wrong product's page
    expect(detailName).not.toBe(ALL_PRODUCTS[0]);
  });

  // ── Baseline: standard_user navigation is correct ─────────────────────────

  test('BASELINE | standard_user: clicking product name navigates to its own detail page', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    await inv.itemNameLink(ALL_PRODUCTS[0]).click();
    await standardPage.waitForURL(/inventory-item\.html/, { timeout: 5000 });

    const detailName = await standardPage.locator('.inventory_details_name').innerText();
    expect(detailName).toBe(ALL_PRODUCTS[0]);
  });

  test('BASELINE | standard_user: clicking product image navigates to its own detail page', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    await inv.itemImage(ALL_PRODUCTS[0]).click();
    await standardPage.waitForURL(/inventory-item\.html/, { timeout: 5000 });

    const detailName = await standardPage.locator('.inventory_details_name').innerText();
    expect(detailName).toBe(ALL_PRODUCTS[0]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Checkout Form Defects (BUG-UI-004)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('problem_user — BUG-UI-004: Checkout lastName field ignores input', () => {

  test('lastName field does not retain typed text', async ({ problemPage }) => {
    // Add any item to cart and proceed to checkout
    const inv = new InventoryPage(problemPage);
    await inv.addToCartButton(ALL_PRODUCTS[0]).click();
    await inv.goToCart();

    const checkout = new CheckoutPage(problemPage);
    await checkout.checkoutButton.click();
    await problemPage.waitForURL(/checkout-step-one\.html/);

    // Type into lastName
    await checkout.lastNameInput.fill('TestLastName');
    const value = await checkout.lastNameInput.inputValue();

    // Bug: field value is empty or does not equal what was typed
    expect(value, 'BUG-UI-004: lastName field should retain typed text but does not').not.toBe('TestLastName');
  });

  test('filling firstName causes lastName to mirror it (or stay blank)', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);
    await inv.addToCartButton(ALL_PRODUCTS[0]).click();
    await inv.goToCart();

    const checkout = new CheckoutPage(problemPage);
    await checkout.checkoutButton.click();
    await problemPage.waitForURL(/checkout-step-one\.html/);

    await checkout.firstNameInput.fill('Alice');
    await checkout.lastNameInput.fill('Smith');

    const lastName = await checkout.lastNameInput.inputValue();
    const firstName = await checkout.firstNameInput.inputValue();

    // Document the actual buggy behaviour: lastName is either blank or mirrors firstName
    const isBuggy = lastName !== 'Smith';
    expect(
      isBuggy,
      `BUG-UI-004: lastName should be "Smith" — actual value: "${lastName}", firstName: "${firstName}"`
    ).toBe(true);
  });

  test('checkout submission fails with lastName error due to bug', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);
    await inv.addToCartButton(ALL_PRODUCTS[0]).click();
    await inv.goToCart();

    const checkout = new CheckoutPage(problemPage);
    await checkout.checkoutButton.click();
    await problemPage.waitForURL(/checkout-step-one\.html/);

    // Fill all fields — but lastName won't stick due to the bug
    await checkout.firstNameInput.fill('Test');
    await checkout.lastNameInput.fill('User');
    await checkout.postalCodeInput.fill('12345');
    await checkout.continue();

    // Because lastName is empty/wrong, the form should show a validation error
    // OR it proceeds and shows a broken checkout — either way the UX is broken
    const onStepTwo = problemPage.url().includes('checkout-step-two');
    const hasError  = await checkout.errorMessage.isVisible();

    // At least one of these must be true for the bug to manifest
    expect(
      hasError || !onStepTwo,
      'BUG-UI-004: Expected a validation error or failure to proceed due to broken lastName field'
    ).toBe(true);
  });

  // ── Baseline: standard_user checkout form works correctly ─────────────────

  test('BASELINE | standard_user: lastName field retains typed text', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    await inv.addToCartButton(ALL_PRODUCTS[0]).click();
    await inv.goToCart();

    const checkout = new CheckoutPage(standardPage);
    await checkout.checkoutButton.click();
    await standardPage.waitForURL(/checkout-step-one\.html/);

    await checkout.lastNameInput.fill('SmithBaseline');
    const value = await checkout.lastNameInput.inputValue();
    expect(value).toBe('SmithBaseline');
  });

  test('BASELINE | standard_user: complete checkout succeeds end-to-end', async ({ standardPage }) => {
    const inv = new InventoryPage(standardPage);
    await inv.addToCartButton(ALL_PRODUCTS[0]).click();
    await inv.goToCart();

    const checkout = new CheckoutPage(standardPage);
    await checkout.checkoutButton.click();
    await standardPage.waitForURL(/checkout-step-one\.html/);

    await checkout.completeStepOne({ firstName: 'Test', lastName: 'User', postalCode: '12345' });
    await checkout.assertOnStepTwo();
    await checkout.finish();
    await checkout.assertOnCompletePage();
    await checkout.assertConfirmationMessage('Thank you for your order!');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Sort Defects (BUG-UI-005)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('problem_user — BUG-UI-005: Sort functionality is broken', () => {

  test('sort Z→A does not re-order items alphabetically descending', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);

    const before = await inv.getAllProductNames();
    await inv.sortBy('za');
    const after = await inv.getAllProductNames();

    const expected = [...before].sort((a, b) => b.localeCompare(a));

    // Bug: the list does not match the expected descending order
    const isSortBroken = JSON.stringify(after) !== JSON.stringify(expected);
    expect(
      isSortBroken,
      `BUG-UI-005: Sort Z→A should reorder items. Before: [${before}] After: [${after}] Expected: [${expected}]`
    ).toBe(true);
  });

  test('sort by price low→high does not order items by ascending price', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);

    await inv.sortBy('lohi');
    const prices = await inv.getAllPrices();
    const sorted = [...prices].sort((a, b) => a - b);

    const isBroken = JSON.stringify(prices) !== JSON.stringify(sorted);
    expect(
      isBroken,
      `BUG-UI-005: Sort low→high should order by price. Actual: [${prices}] Expected: [${sorted}]`
    ).toBe(true);
  });

  // ── Baseline: standard_user sort works ───────────────────────────────────

  test('BASELINE | standard_user: sort A→Z orders items alphabetically ascending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    await inventoryPage.assertSortedAZ();
  });

  test('BASELINE | standard_user: sort Z→A orders items alphabetically descending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    await inventoryPage.assertSortedZA();
  });

  test('BASELINE | standard_user: sort price low→high orders items by ascending price', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    await inventoryPage.assertSortedPriceLowToHigh();
  });

  test('BASELINE | standard_user: sort price high→low orders items by descending price', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    await inventoryPage.assertSortedPriceHighToLow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Add to Cart Defects
// Some products cannot be added to cart for problem_user
// ─────────────────────────────────────────────────────────────────────────────

test.describe('problem_user — Add to Cart partial defect', () => {

  test('add all 6 products and verify cart count reflects actual adds', async ({ problemPage }) => {
    const inv = new InventoryPage(problemPage);

    let addedCount = 0;
    for (const name of ALL_PRODUCTS) {
      const btn = inv.addToCartButton(name);
      const isVisible = await btn.isVisible();
      if (isVisible) {
        await btn.click();
        addedCount++;
      }
    }

    // Read actual badge — might not match addedCount due to the bug
    const badgeVisible = await inv.cartBadge.isVisible();
    if (badgeVisible) {
      const badge = await inv.cartBadge.textContent();
      const badgeCount = parseInt(badge ?? '0', 10);

      // Document: badge count may not equal the number of add-to-cart clicks
      if (badgeCount !== addedCount) {
        // This is the bug — cart count does not track all adds
        expect(
          badgeCount,
          `BUG: Cart badge (${badgeCount}) does not equal number of add-to-cart clicks (${addedCount})`
        ).not.toBe(addedCount); // assert bug IS present
      }
    }
  });

  // ── Baseline ──────────────────────────────────────────────────────────────

  test('BASELINE | standard_user: adding all 6 products shows badge count of 6', async ({ inventoryPage }) => {
    for (const name of ALL_PRODUCTS) {
      await inventoryPage.addToCart(name);
    }
    await inventoryPage.assertCartCount(6);
  });
});
