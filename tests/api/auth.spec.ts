/**
 * Auth API — APIs 7, 8, 9, 10
 *
 * Coverage:
 *   TC-007  POST verifyLogin with valid credentials returns 200        [Critical]
 *   TC-008  POST verifyLogin with invalid credentials returns 404      [Critical]
 *   TC-013  POST verifyLogin missing email param returns 400           [High]
 *   TC-014  DELETE verifyLogin returns 405                             [High]
 *   TC-029  POST verifyLogin with SQL injection payload — not bypassed [Medium]
 *   TC-030  POST verifyLogin missing password param returns 400        [Medium]
 */

import { test, expect } from '../../fixtures/user-factory';
import { ENDPOINTS, ResponseCode } from '../../utils/constants';
import { assertResponseCode } from '../../utils/assertions';
import { ApiClient } from '../../fixtures/api-client';

test.describe('Auth API', () => {
  // ── TC-007 — requires a live user created by the fixture ─────────────────────
  test('TC-007 | POST /verifyLogin with valid credentials returns 200 User exists', async ({
    createdUser,
    apiClient,
  }) => {
    const body = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      email: createdUser.email,
      password: createdUser.password,
    });
    assertResponseCode(body, ResponseCode.OK);
    expect(body.message).toBe('User exists!');
  });

  // ── TC-008 ──────────────────────────────────────────────────────────────────
  test('TC-008 | POST /verifyLogin with invalid credentials returns 404 User not found', async ({
    apiClient,
  }) => {
    const body = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      email: 'nonexistent-user@invalid-test.com',
      password: 'WrongPassword999!',
    });
    assertResponseCode(body, ResponseCode.NOT_FOUND);
    expect(body.message).toMatch(/user not found/i);
  });

  // ── TC-013 ──────────────────────────────────────────────────────────────────
  test('TC-013 | POST /verifyLogin missing email param returns 400', async ({ apiClient }) => {
    const body = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      password: 'SomePassword123',
    });
    assertResponseCode(body, ResponseCode.BAD_REQUEST);
  });

  // ── TC-014 ──────────────────────────────────────────────────────────────────
  test('TC-014 | DELETE /verifyLogin returns 405 method not allowed', async () => {
    const client = new ApiClient();
    const body = await client.delete(ENDPOINTS.VERIFY_LOGIN);
    assertResponseCode(body, ResponseCode.METHOD_NOT_ALLOWED);
  });

  // ── TC-029 ──────────────────────────────────────────────────────────────────
  test('TC-029 | POST /verifyLogin with SQL injection payload is not authenticated', async ({
    apiClient,
  }) => {
    const body = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      email: "' OR 1=1--",
      password: 'anything',
    });
    // Must NOT return 200 — authentication must not be bypassed
    expect(body.responseCode).not.toBe(ResponseCode.OK);
    assertResponseCode(body, ResponseCode.NOT_FOUND);
  });

  // ── TC-030 ──────────────────────────────────────────────────────────────────
  test('TC-030 | POST /verifyLogin missing password param returns 400', async ({ apiClient }) => {
    const body = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      email: 'someone@example.com',
    });
    assertResponseCode(body, ResponseCode.BAD_REQUEST);
  });
});
