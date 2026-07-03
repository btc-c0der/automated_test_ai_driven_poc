import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { ROUTES, type CheckoutInfo } from '../../../types/ui.types';

export class CheckoutPage extends BasePage {
  // ─── Step One locators ────────────────────────────────────────────────────
  readonly firstNameInput:  Locator;
  readonly lastNameInput:   Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton:  Locator;
  readonly cancelButton:    Locator;
  readonly errorMessage:    Locator;
  readonly errorCloseButton: Locator;

  // Cart → checkout trigger (on /cart.html, navigates here)
  readonly checkoutButton:  Locator;

  // ─── Step Two locators ────────────────────────────────────────────────────
  readonly summaryItems:     Locator;
  readonly subtotalLabel:    Locator;
  readonly taxLabel:         Locator;
  readonly totalLabel:       Locator;
  readonly finishButton:     Locator;
  readonly summaryContainer: Locator;

  // ─── Complete locators ────────────────────────────────────────────────────
  readonly confirmationHeader: Locator;
  readonly confirmationText:   Locator;
  readonly backHomeButton:     Locator;
  readonly completeImage:      Locator;

  constructor(page: Page) {
    super(page);

    // Step 1
    this.firstNameInput   = page.locator('[data-test="firstName"]');
    this.lastNameInput    = page.locator('[data-test="lastName"]');
    this.postalCodeInput  = page.locator('[data-test="postalCode"]');
    this.continueButton   = page.locator('[data-test="continue"]');
    this.cancelButton     = page.locator('[data-test="cancel"]');
    this.errorMessage     = page.locator('[data-test="error"]');
    this.errorCloseButton = page.locator('.error-button');
    this.checkoutButton   = page.locator('[data-test="checkout"]');

    // Step 2
    this.summaryItems      = page.locator('.cart_item');
    this.subtotalLabel     = page.locator('[data-test="subtotal-label"]');
    this.taxLabel          = page.locator('[data-test="tax-label"]');
    this.totalLabel        = page.locator('[data-test="total-label"]');
    this.finishButton      = page.locator('[data-test="finish"]');
    this.summaryContainer  = page.locator('.checkout_summary_container');

    // Complete
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
    this.confirmationText   = page.locator('[data-test="complete-text"]');
    this.backHomeButton     = page.locator('[data-test="back-to-products"]');
    this.completeImage      = page.locator('.pony_express');
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async fillCheckoutInfo(info: CheckoutInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
    await this.page.waitForURL(/checkout-complete\.html/);
  }

  async backToHome(): Promise<void> {
    await this.backHomeButton.click();
    await this.page.waitForURL(/inventory\.html/);
  }

  /**
   * Fill step-one form and proceed to step two in one call.
   */
  async completeStepOne(info: CheckoutInfo): Promise<void> {
    await this.fillCheckoutInfo(info);
    await this.continue();
    await this.page.waitForURL(/checkout-step-two\.html/);
  }

  // ─── Data extraction ──────────────────────────────────────────────────────

  async getSubtotal(): Promise<number> {
    const text = await this.subtotalLabel.innerText();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getTax(): Promise<number> {
    const text = await this.taxLabel.innerText();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getTotal(): Promise<number> {
    const text = await this.totalLabel.innerText();
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertOnStepOne(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
    await this.assertOnRoute(ROUTES.CHECKOUT_STEP_ONE);
  }

  async assertOnStepTwo(): Promise<void> {
    await expect(this.summaryContainer).toBeVisible();
    await this.assertOnRoute(ROUTES.CHECKOUT_STEP_TWO);
  }

  async assertOnCompletePage(): Promise<void> {
    await expect(this.confirmationHeader).toBeVisible();
    await this.assertOnRoute(ROUTES.CHECKOUT_COMPLETE);
  }

  async assertConfirmationMessage(expected: string): Promise<void> {
    await expect(this.confirmationHeader).toHaveText(expected);
  }

  async assertErrorVisible(expectedText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedText) {
      await expect(this.errorMessage).toContainText(expectedText);
    }
  }

  async assertSummaryItemCount(expected: number): Promise<void> {
    await expect(this.summaryItems).toHaveCount(expected);
  }

  /**
   * Asserts the math integrity of the checkout summary:
   * subtotal + tax should equal the displayed total (within rounding tolerance).
   */
  async assertTotalsAreConsistent(): Promise<void> {
    const subtotal = await this.getSubtotal();
    const tax      = await this.getTax();
    const total    = await this.getTotal();
    const expected = parseFloat((subtotal + tax).toFixed(2));
    expect(total, `Total (${total}) should equal subtotal (${subtotal}) + tax (${tax})`).toBeCloseTo(expected, 2);
  }
}
