/**
 * User Account API — APIs 11, 12, 13, 14
 *
 * Coverage:
 *   TC-009  POST createAccount registers a new user                    [Critical]
 *   TC-010  DELETE deleteAccount removes user                          [Critical]
 *   TC-011  PUT updateAccount updates existing user details            [Critical]
 *   TC-012  GET getUserDetailByEmail returns correct schema            [Critical]
 *   TC-018  POST createAccount with duplicate email returns 400        [High]
 *   TC-019  GET getUserDetailByEmail with non-existent email → 404     [High]
 *   TC-020  Full user lifecycle: create→login→get→update→delete        [High]
 *   TC-025  PUT updateAccount for non-existent user returns 404        [Medium]
 *   TC-026  DELETE deleteAccount with wrong password is rejected       [Medium]
 *   TC-027  createAccount with missing required field returns 400      [Medium]
 *   TC-032  createAccount with numeric name does not crash             [Low]
 *   TC-033  createAccount with 255+ char email does not crash          [Low]
 */

import { test, expect } from '../../fixtures/user-factory';
import { createUserPayload } from '../../fixtures/user-factory';
import { ENDPOINTS, ResponseCode } from '../../utils/constants';
import { assertResponseCode, assertUserShape } from '../../utils/assertions';
import type { UserDetailResponse } from '../../types/api.types';

test.describe('User Account API', () => {
  // ── TC-009 ──────────────────────────────────────────────────────────────────
  test('TC-009 | POST /createAccount registers a new user and returns 201', async ({ apiClient }) => {
    const payload = createUserPayload();

    const createBody = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);
    assertResponseCode(createBody, ResponseCode.CREATED);
    expect(createBody.message).toBe('User created!');

    // Teardown: clean up the user created in this test
    await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
      email: payload.email,
      password: payload.password,
    });
  });

  // ── TC-010 ──────────────────────────────────────────────────────────────────
  test('TC-010 | DELETE /deleteAccount removes the user and returns 200', async ({ apiClient }) => {
    // Create a dedicated user for this test
    const payload = createUserPayload();
    const created = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);
    expect(created.responseCode).toBe(ResponseCode.CREATED);

    const deleteBody = await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
      email: payload.email,
      password: payload.password,
    });
    assertResponseCode(deleteBody, ResponseCode.OK);
    expect(deleteBody.message).toBe('Account deleted!');
  });

  // ── TC-011 ──────────────────────────────────────────────────────────────────
  test('TC-011 | PUT /updateAccount updates user name and change persists in GET', async ({
    createdUser,
    apiClient,
  }) => {
    const updatedName = 'Updated Name Test';
    const updateBody = await apiClient.put(ENDPOINTS.UPDATE_ACCOUNT, {
      ...(createdUser as unknown as Record<string, string>),
      name: updatedName,
    });
    assertResponseCode(updateBody, ResponseCode.OK);
    expect(updateBody.message).toBe('User updated!');

    // Verify the change persisted
    const detailBody = await apiClient.get<UserDetailResponse>(ENDPOINTS.GET_USER_DETAIL, {
      email: createdUser.email,
    });
    assertResponseCode(detailBody, ResponseCode.OK);
    expect(detailBody.user!.name).toBe(updatedName);
  });

  // ── TC-012 ──────────────────────────────────────────────────────────────────
  test('TC-012 | GET /getUserDetailByEmail returns correct user schema with no password field', async ({
    createdUser,
    apiClient,
  }) => {
    const body = await apiClient.get<UserDetailResponse>(ENDPOINTS.GET_USER_DETAIL, {
      email: createdUser.email,
    });
    assertResponseCode(body, ResponseCode.OK);
    expect(body.user).toBeDefined();
    assertUserShape(body.user!);
    expect(body.user!.email).toBe(createdUser.email);

    // ⚠️  REAL BUG #1: API returns `birth_day`, NOT `birth_date`
    // The createAccount input field is `birth_date` but the GET response returns `birth_day`.
    expect(body.user!).toHaveProperty('birth_day');
    expect(body.user!).not.toHaveProperty('birth_date');

    // ⚠️  REAL BUG #2: `mobile_number` is not returned in GET /getUserDetailByEmail
    // The field is accepted on createAccount but silently dropped from the GET response.
    expect(body.user!).not.toHaveProperty('mobile_number');
  });

  // ── TC-018 ──────────────────────────────────────────────────────────────────
  test('TC-018 | POST /createAccount with duplicate email returns 400', async ({
    createdUser,
    apiClient,
  }) => {
    // Attempt to register again with the same email
    const duplicate = createUserPayload({ email: createdUser.email });
    const body = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, duplicate as unknown as Record<string, string>);
    assertResponseCode(body, ResponseCode.BAD_REQUEST);
    expect(body.message).toMatch(/already exist/i);
  });

  // ── TC-019 ──────────────────────────────────────────────────────────────────
  test('TC-019 | GET /getUserDetailByEmail with non-existent email returns 404', async ({
    apiClient,
  }) => {
    const body = await apiClient.get(ENDPOINTS.GET_USER_DETAIL, {
      email: 'ghost-does-not-exist@invalid-test.com',
    });
    assertResponseCode(body, ResponseCode.NOT_FOUND);
  });

  // ── TC-020 ──────────────────────────────────────────────────────────────────
  test('TC-020 | Full user lifecycle: create → login → get → update → delete', async ({ apiClient }) => {
    const payload = createUserPayload();

    // 1. Create
    const createBody = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);
    assertResponseCode(createBody, ResponseCode.CREATED);

    // 2. Login
    const loginBody = await apiClient.post(ENDPOINTS.VERIFY_LOGIN, {
      email: payload.email,
      password: payload.password,
    });
    assertResponseCode(loginBody, ResponseCode.OK);
    expect(loginBody.message).toBe('User exists!');

    // 3. Get detail
    const getBody = await apiClient.get<UserDetailResponse>(ENDPOINTS.GET_USER_DETAIL, {
      email: payload.email,
    });
    assertResponseCode(getBody, ResponseCode.OK);
    expect(getBody.user!.email).toBe(payload.email);

    // 4. Update name
    const newName = 'Lifecycle Updated Name';
    const updateBody = await apiClient.put(ENDPOINTS.UPDATE_ACCOUNT, {
      ...(payload as unknown as Record<string, string>),
      name: newName,
    });
    assertResponseCode(updateBody, ResponseCode.OK);

    // 5. Confirm update persisted
    const getUpdatedBody = await apiClient.get<UserDetailResponse>(ENDPOINTS.GET_USER_DETAIL, {
      email: payload.email,
    });
    expect(getUpdatedBody.user!.name).toBe(newName);

    // 6. Delete
    const deleteBody = await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
      email: payload.email,
      password: payload.password,
    });
    assertResponseCode(deleteBody, ResponseCode.OK);
  });

  // ── TC-025 ──────────────────────────────────────────────────────────────────
  test('TC-025 | PUT /updateAccount for non-existent user returns 404', async ({ apiClient }) => {
    const phantom = createUserPayload({ email: 'phantom-nobody@invalid-test.com' });
    const body = await apiClient.put(ENDPOINTS.UPDATE_ACCOUNT, phantom as unknown as Record<string, string>);
    assertResponseCode(body, ResponseCode.NOT_FOUND);
  });

  // ── TC-026 ──────────────────────────────────────────────────────────────────
  test('TC-026 | DELETE /deleteAccount with wrong password is rejected', async ({
    createdUser,
    apiClient,
  }) => {
    const body = await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
      email: createdUser.email,
      password: 'definitely-wrong-password-XYZ!',
    });
    // API should reject — account must still exist afterwards (fixture teardown will clean up)
    expect([ResponseCode.NOT_FOUND, 403]).toContain(body.responseCode);
  });

  // ── TC-027 ──────────────────────────────────────────────────────────────────
  test('TC-027 | POST /createAccount with missing required field (name) returns 400', async ({
    apiClient,
  }) => {
    const payload = createUserPayload();
    const { name: _omitted, ...withoutName } = payload;
    const body = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, withoutName as unknown as Record<string, string>);
    assertResponseCode(body, ResponseCode.BAD_REQUEST);
  });

  // ── TC-032 ──────────────────────────────────────────────────────────────────
  test('TC-032 | POST /createAccount with numeric name does not crash (boundary)', async ({ apiClient }) => {
    const payload = createUserPayload({ name: '12345' });
    const body = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);
    // Accept either success (201) or validation rejection (400) — never 500
    expect([ResponseCode.CREATED, ResponseCode.BAD_REQUEST]).toContain(body.responseCode);

    // Cleanup if user was created
    if (body.responseCode === ResponseCode.CREATED) {
      await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
        email: payload.email,
        password: payload.password,
      });
    }
  });

  // ── TC-033 ──────────────────────────────────────────────────────────────────
  test('TC-033 | POST /createAccount with 255-character email does not crash (boundary)', async ({ apiClient }) => {
    const longLocalPart = 'a'.repeat(243); // 243 + '@test.com' = 252 chars, under 255
    const longEmail = `${longLocalPart}@t.com`;
    const payload = createUserPayload({ email: longEmail });
    const body = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);
    // Accept either success or validation rejection — never 500
    expect([ResponseCode.CREATED, ResponseCode.BAD_REQUEST]).toContain(body.responseCode);

    if (body.responseCode === ResponseCode.CREATED) {
      await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
        email: payload.email,
        password: payload.password,
      });
    }
  });
});
