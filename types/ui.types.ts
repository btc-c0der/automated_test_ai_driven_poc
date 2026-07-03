// ─── User types ───────────────────────────────────────────────────────────────

export type SauceUser =
  | 'standard_user'
  | 'locked_out_user'
  | 'problem_user'
  | 'performance_glitch_user'
  | 'error_user'
  | 'visual_user';

export const SAUCE_PASSWORD = 'secret_sauce';

export const SAUCE_USERS: Record<string, SauceUser> = {
  STANDARD: 'standard_user',
  LOCKED: 'locked_out_user',
  PROBLEM: 'problem_user',
  PERF_GLITCH: 'performance_glitch_user',
  ERROR: 'error_user',
  VISUAL: 'visual_user',
} as const;

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageSrc: string;
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export const SORT_OPTIONS: Record<SortOption, string> = {
  az:   'Name (A to Z)',
  za:   'Name (Z to A)',
  lohi: 'Price (low to high)',
  hilo: 'Price (high to low)',
};

// ─── Checkout form ────────────────────────────────────────────────────────────

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const ROUTES = {
  LOGIN:              '/',
  INVENTORY:          '/inventory.html',
  INVENTORY_ITEM:     '/inventory-item.html',
  CART:               '/cart.html',
  CHECKOUT_STEP_ONE:  '/checkout-step-one.html',
  CHECKOUT_STEP_TWO:  '/checkout-step-two.html',
  CHECKOUT_COMPLETE:  '/checkout-complete.html',
} as const;
