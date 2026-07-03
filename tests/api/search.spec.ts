/**
 * Search API — APIs 5 & 6
 *
 * Coverage:
 *   TC-005  POST search with valid term returns matching products      [Critical]
 *   TC-006  POST search without search_product param returns 400       [Critical]
 *   TC-017  POST search with empty string term (edge case)             [High]
 *   TC-021  POST search with XSS payload — no 500                     [Medium]
 *   TC-022  POST search with oversized input (1000+ chars) — no 500   [Medium]
 */

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../fixtures/api-client';
import { ENDPOINTS, ResponseCode } from '../../utils/constants';
import { assertResponseCode } from '../../utils/assertions';
import type { ProductsResponse } from '../../types/api.types';

test.describe('Search API', () => {
  let client: ApiClient;

  test.beforeAll(async () => {
    client = new ApiClient();
  });

  test.afterAll(async () => {
    // nothing to dispose — native fetch client is stateless
  });

  // ── TC-005 ──────────────────────────────────────────────────────────────────
  test('TC-005 | POST /searchProduct with a valid term returns matching products', async () => {
    const body = await client.post<ProductsResponse>(ENDPOINTS.SEARCH_PRODUCT, {
      search_product: 'top',
    });
    assertResponseCode(body, ResponseCode.OK);
    expect(body.products).toBeDefined();
    expect(body.products!.length).toBeGreaterThan(0);
  });

  // ── TC-006 ──────────────────────────────────────────────────────────────────
  test('TC-006 | POST /searchProduct without search_product param returns 400', async () => {
    const body = await client.post(ENDPOINTS.SEARCH_PRODUCT, {});
    assertResponseCode(body, ResponseCode.BAD_REQUEST);
    expect(body.message).toMatch(/search_product.*missing/i);
  });

  // ── TC-017 ──────────────────────────────────────────────────────────────────
  test('TC-017 | POST /searchProduct with empty string term does not return 500', async () => {
    const body = await client.post<ProductsResponse>(ENDPOINTS.SEARCH_PRODUCT, {
      search_product: '',
    });
    // Behavior is undocumented for empty string — we only assert no server error
    expect([ResponseCode.OK, ResponseCode.BAD_REQUEST]).toContain(body.responseCode);
  });

  // ── TC-021 ──────────────────────────────────────────────────────────────────
  test('TC-021 | POST /searchProduct with XSS payload does not crash the server', async () => {
    const body = await client.post<ProductsResponse>(ENDPOINTS.SEARCH_PRODUCT, {
      search_product: '<script>alert(1)</script>',
    });
    // Must return valid JSON and never a 500
    expect(body).toBeDefined();
    expect(body.responseCode).toBeDefined();
    expect([ResponseCode.OK, ResponseCode.BAD_REQUEST]).toContain(body.responseCode);
  });

  // ── TC-022 ──────────────────────────────────────────────────────────────────
  test('TC-022 | POST /searchProduct with 1000-character input does not crash the server', async () => {
    const oversized = 'a'.repeat(1000);
    const body = await client.post<ProductsResponse>(ENDPOINTS.SEARCH_PRODUCT, {
      search_product: oversized,
    });
    expect(body).toBeDefined();
    expect(body.responseCode).toBeDefined();
    expect([ResponseCode.OK, ResponseCode.BAD_REQUEST]).toContain(body.responseCode);
  });
});
