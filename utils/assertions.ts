import { expect } from '@playwright/test';
import type { ApiResponse, Product, Brand, User } from '../types/api.types';

/**
 * Assert the body responseCode matches the expected value.
 * Use this instead of asserting HTTP status — this API always returns HTTP 200.
 */
export function assertResponseCode(body: ApiResponse, expected: number): void {
  expect(body.responseCode, `Expected responseCode ${expected}, got ${body.responseCode}`).toBe(expected);
}

/**
 * Assert a single product object conforms to the Product schema.
 * Uses expect.soft so all field failures are collected before stopping.
 */
export function assertProductShape(product: Product): void {
  expect.soft(typeof product.id, `product.id should be number`).toBe('number');
  expect.soft(typeof product.name, `product.name should be string`).toBe('string');
  expect.soft(typeof product.price, `product.price should be string`).toBe('string');
  expect.soft(typeof product.brand, `product.brand should be string`).toBe('string');
  expect.soft(typeof product.category, `product.category should be object`).toBe('object');
  expect.soft(product.category).not.toBeNull();
  expect.soft(typeof product.category.category, `product.category.category should be string`).toBe('string');
  expect.soft(typeof product.category.usertype, `product.category.usertype should be object`).toBe('object');
}

/**
 * Assert a single brand object conforms to the Brand schema.
 */
export function assertBrandShape(brand: Brand): void {
  expect.soft(typeof brand.id, `brand.id should be number`).toBe('number');
  expect.soft(typeof brand.brand, `brand.brand should be string`).toBe('string');
}

/**
 * Assert a user object conforms to the User schema and does NOT expose password.
 *
 * ⚠️  Documents known API bugs:
 *   - Field returned as `birth_day`, NOT `birth_date` (input/output name mismatch)
 *   - `mobile_number` is NOT returned in GET /getUserDetailByEmail response
 */
export function assertUserShape(user: User): void {
  const requiredStringFields: (keyof User)[] = [
    'name', 'email', 'title',
    'birth_day',   // ⚠️  API returns `birth_day` not `birth_date`
    'birth_month', 'birth_year',
    'first_name', 'last_name', 'company',
    'address1', 'address2', 'country',
    'state', 'city', 'zipcode',
    // mobile_number intentionally omitted — API does not return it
  ];

  expect.soft(typeof user.id, `user.id should be number`).toBe('number');

  for (const field of requiredStringFields) {
    expect.soft(typeof user[field], `user.${field} should be string`).toBe('string');
  }

  // Security assertion: password must never be returned
  expect.soft(
    Object.prototype.hasOwnProperty.call(user, 'password'),
    'user object must NOT contain a password field'
  ).toBe(false);
}

/**
 * Assert all IDs in an array are unique.
 */
export function assertUniqueIds(items: Array<{ id: number }>, label: string): void {
  const ids = items.map((i) => i.id);
  const unique = new Set(ids);
  expect(unique.size, `Expected all ${label} IDs to be unique`).toBe(ids.length);
}
