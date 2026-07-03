/**
 * Products API — APIs 1 & 2
 *
 * Coverage:
 *   TC-001  GET all products returns valid list                [Critical]
 *   TC-002  POST to products list returns 405                  [Critical]
 *   TC-015  Response schema: all product field types correct   [High]
 *   TC-023  GET productsList response time < 2000ms            [Medium]
 *   TC-028  Products list has ≥ 10 items                       [Medium]
 *   TC-031  Unknown query param is ignored                     [Low]
 *   TC-035  Product IDs are unique                             [Low]
 */

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../fixtures/api-client';
import { ENDPOINTS, ResponseCode } from '../../utils/constants';
import { assertResponseCode, assertProductShape, assertUniqueIds } from '../../utils/assertions';
import type { ProductsResponse } from '../../types/api.types';

test.describe('Products API', () => {
  let client: ApiClient;
  let productsBody: ProductsResponse;

  test.beforeAll(async () => {
    client = new ApiClient();
    // Fetch once and share across read-only tests in this file
    productsBody = await client.get<ProductsResponse>(ENDPOINTS.PRODUCTS_LIST);
  });

  test.afterAll(async () => {
    // nothing to dispose — native fetch client is stateless
  });

  // ── TC-001 ──────────────────────────────────────────────────────────────────
  test('TC-001 | GET /productsList returns 200 with a non-empty products array', async () => {
    assertResponseCode(productsBody, ResponseCode.OK);
    expect(productsBody.products).toBeDefined();
    expect(Array.isArray(productsBody.products)).toBe(true);
    expect(productsBody.products!.length).toBeGreaterThan(0);
  });

  // ── TC-002 ──────────────────────────────────────────────────────────────────
  test('TC-002 | POST /productsList returns 405 method not allowed', async () => {
    const body = await client.post(ENDPOINTS.PRODUCTS_LIST, {});
    assertResponseCode(body, ResponseCode.METHOD_NOT_ALLOWED);
    expect(body.message).toMatch(/not supported/i);
  });

  // ── TC-015 ──────────────────────────────────────────────────────────────────
  test('TC-015 | Products response schema: all product field types are correct', async () => {
    assertResponseCode(productsBody, ResponseCode.OK);
    for (const product of productsBody.products!) {
      assertProductShape(product);
    }
  });

  // ── TC-023 ──────────────────────────────────────────────────────────────────
  test('TC-023 | GET /productsList responds within 2000ms', async () => {
    const freshClient = new ApiClient();
    const { elapsedMs } = await freshClient.getWithTiming(ENDPOINTS.PRODUCTS_LIST);
    expect(elapsedMs, `Response time was ${elapsedMs}ms, expected < 2000ms`).toBeLessThan(2000);
  });

  // ── TC-028 ──────────────────────────────────────────────────────────────────
  test('TC-028 | Products list contains at least 10 items (data integrity)', async () => {
    expect(productsBody.products!.length).toBeGreaterThanOrEqual(10);
  });

  // ── TC-031 ──────────────────────────────────────────────────────────────────
  test('TC-031 | GET /productsList with unknown query param returns same 200 response', async () => {
    const body = await client.get<ProductsResponse>(ENDPOINTS.PRODUCTS_LIST, { foo: 'bar' });
    assertResponseCode(body, ResponseCode.OK);
    expect(body.products).toBeDefined();
  });

  // ── TC-035 ──────────────────────────────────────────────────────────────────
  test('TC-035 | Product IDs are unique across the full list', async () => {
    assertUniqueIds(productsBody.products!, 'product');
  });
});
