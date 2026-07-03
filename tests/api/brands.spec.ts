/**
 * Brands API — APIs 3 & 4
 *
 * Coverage:
 *   TC-003  GET all brands returns valid list                  [Critical]
 *   TC-004  PUT to brands list returns 405                     [Critical]
 *   TC-016  Response schema: all brand field types correct     [High]
 *   TC-024  GET brandsList response time < 2000ms              [Medium]
 *   TC-034  Brand IDs are unique                               [Low]
 */

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../fixtures/api-client';
import { ENDPOINTS, ResponseCode } from '../../utils/constants';
import { assertResponseCode, assertBrandShape, assertUniqueIds } from '../../utils/assertions';
import type { BrandsResponse } from '../../types/api.types';

test.describe('Brands API', () => {
  let client: ApiClient;
  let brandsBody: BrandsResponse;

  test.beforeAll(async () => {
    client = new ApiClient();
    brandsBody = await client.get<BrandsResponse>(ENDPOINTS.BRANDS_LIST);
  });

  test.afterAll(async () => {
    // nothing to dispose — native fetch client is stateless
  });

  // ── TC-003 ──────────────────────────────────────────────────────────────────
  test('TC-003 | GET /brandsList returns 200 with a non-empty brands array', async () => {
    assertResponseCode(brandsBody, ResponseCode.OK);
    expect(brandsBody.brands).toBeDefined();
    expect(Array.isArray(brandsBody.brands)).toBe(true);
    expect(brandsBody.brands!.length).toBeGreaterThan(0);
  });

  // ── TC-004 ──────────────────────────────────────────────────────────────────
  test('TC-004 | PUT /brandsList returns 405 method not allowed', async () => {
    const body = await client.put(ENDPOINTS.BRANDS_LIST, {});
    assertResponseCode(body, ResponseCode.METHOD_NOT_ALLOWED);
    expect(body.message).toMatch(/not supported/i);
  });

  // ── TC-016 ──────────────────────────────────────────────────────────────────
  test('TC-016 | Brands response schema: all brand field types are correct', async () => {
    assertResponseCode(brandsBody, ResponseCode.OK);
    for (const brand of brandsBody.brands!) {
      assertBrandShape(brand);
    }
  });

  // ── TC-024 ──────────────────────────────────────────────────────────────────
  test('TC-024 | GET /brandsList responds within 2000ms', async () => {
    const freshClient = new ApiClient();
    const { elapsedMs } = await freshClient.getWithTiming(ENDPOINTS.BRANDS_LIST);
    expect(elapsedMs, `Response time was ${elapsedMs}ms, expected < 2000ms`).toBeLessThan(2000);
  });

  // ── TC-034 ──────────────────────────────────────────────────────────────────
  test('TC-034 | Brand IDs are unique across the full list', async () => {
    assertUniqueIds(brandsBody.brands!, 'brand');
  });
});
