/**
 * REST API Standards Compliance Audit
 *
 * This file documents design violations in the automationexercise.com API
 * measured against RFC 7231 (HTTP/1.1 Semantics) and REST best practices.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * HOW VIOLATIONS ARE MARKED
 * ──────────────────────────────────────────────────────────────────────────────
 * Tests that expose known design violations call `test.fail()` internally.
 * This means:
 *   • While the violation exists  → test is expected to fail → suite stays green
 *   • After the API is fixed      → test.fail() must be removed → test passes normally
 *
 * This pattern keeps the suite green while making every violation visible,
 * trackable, and automatically "unblocked" once the API is corrected.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ENDPOINT NAMING GUIDANCE (for API maintainers)
 * ──────────────────────────────────────────────────────────────────────────────
 * REST URLs must:
 *   1. Use lowercase only              → /products, not /productsList
 *   2. Use hyphens, not camelCase      → /product-categories, not /productCategories
 *   3. Use plural nouns for resources  → /products, not /product
 *   4. Use HTTP verbs, not URL verbs   → DELETE /users/{id}, not /deleteAccount
 *   5. Encode filters as query params  → GET /products?q=term, not POST /searchProduct
 *
 * Current → Recommended mapping:
 *
 *   GET  /productsList              → GET  /products
 *   POST /productsList (→ 405)      → (handled by HTTP 405 on GET /products automatically)
 *   GET  /brandsList                → GET  /brands
 *   PUT  /brandsList (→ 405)        → (handled by HTTP 405 on GET /brands automatically)
 *   POST /searchProduct?search=term → GET  /products?q=term
 *   POST /verifyLogin               → POST /auth/sessions   { email, password }
 *   DELETE /verifyLogin (→ 405)     → (handled by HTTP 405 on /auth/sessions automatically)
 *   POST /createAccount             → POST /users
 *   DELETE /deleteAccount           → DELETE /users/{id}
 *   PUT  /updateAccount             → PUT  /users/{id}  (or PATCH for partial updates)
 *   GET  /getUserDetailByEmail      → GET  /users?email={email}
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * Coverage:
 *   TC-036  [VIOLATION] POST /productsList HTTP status should be 405            [Critical]
 *   TC-037  [VIOLATION] PUT /brandsList HTTP status should be 405               [Critical]
 *   TC-038  [VIOLATION] POST /searchProduct (missing param) HTTP status → 400   [Critical]
 *   TC-039  [VIOLATION] POST /verifyLogin (invalid creds) HTTP status → 401/404 [Critical]
 *   TC-040  [VIOLATION] DELETE /verifyLogin HTTP status should be 405           [Critical]
 *   TC-041  [VIOLATION] POST /createAccount success HTTP status should be 201   [Critical]
 *   TC-042  [VIOLATION] GET /getUserDetailByEmail (not found) HTTP → 404        [Critical]
 *   TC-043  [VIOLATION] Endpoint paths must not contain camelCase               [High]
 *   TC-044  [VIOLATION] Endpoint paths must not use verb prefixes               [High]
 *   TC-045  [VIOLATION] Search must use GET + query params, not POST + body     [High]
 *   TC-046  [VIOLATION] Response body must not contain a redundant responseCode [High]
 *   TC-047  Compliant: GET /productsList HTTP status is 200                     [Medium]
 *   TC-048  Compliant: GET /brandsList HTTP status is 200                       [Medium]
 *   TC-049  Compliant: DELETE /deleteAccount HTTP status is 200                 [Medium]
 */

import { test, expect } from '@playwright/test';
import { ApiClient } from '../../fixtures/api-client';
import { ENDPOINTS } from '../../utils/constants';

// ─── Shared client (read-only tests share one instance) ───────────────────────

let client: ApiClient;

test.beforeAll(() => {
  client = new ApiClient();
});

// =============================================================================
// SECTION 1 — HTTP STATUS CODE COMPLIANCE (RFC 7231)
//
// REST standard: HTTP status codes ARE the protocol-level outcome.
// The API should return 4xx/5xx at the HTTP layer, not wrap everything in 200.
// =============================================================================

test.describe('HTTP Status Code Compliance', () => {

  // ── TC-047 (compliant — baseline) ──────────────────────────────────────────
  test('TC-047 | GET /productsList returns HTTP 200 (REST compliant)', async () => {
    const { httpStatus } = await client.getWithStatus(ENDPOINTS.PRODUCTS_LIST);
    expect(httpStatus).toBe(200);
  });

  // ── TC-048 (compliant — baseline) ──────────────────────────────────────────
  test('TC-048 | GET /brandsList returns HTTP 200 (REST compliant)', async () => {
    const { httpStatus } = await client.getWithStatus(ENDPOINTS.BRANDS_LIST);
    expect(httpStatus).toBe(200);
  });

  // ── TC-049 (compliant — baseline) ──────────────────────────────────────────
  test('TC-049 | DELETE /deleteAccount with valid credentials returns HTTP 200 (REST compliant)', async () => {
    // Create a throw-away user to delete
    const email = `standards-delete-${Date.now()}@test-ae.com`;
    await client.post(ENDPOINTS.CREATE_ACCOUNT, {
      name: 'Standards Test', email, password: 'Test1234!', title: 'Mr',
      birth_date: '01', birth_month: '01', birth_year: '1990',
      firstname: 'Standards', lastname: 'Test', company: 'TestCo',
      address1: '1 St', address2: '', country: 'United States',
      zipcode: '10001', state: 'NY', city: 'NY', mobile_number: '5551234567',
    });
    const { httpStatus } = await client.deleteWithStatus(ENDPOINTS.DELETE_ACCOUNT, {
      email,
      password: 'Test1234!',
    });
    expect(httpStatus).toBe(200);
  });

  // ── TC-036 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-036 | [REST VIOLATION] POST /productsList should return HTTP 405, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:405. ' +
        'RFC 7231 §6.5.5 requires HTTP 405 at transport level. ' +
        'Fix: return HTTP 405 and remove responseCode from body.'
      );
      const { httpStatus } = await client.postWithStatus(ENDPOINTS.PRODUCTS_LIST, {});
      expect(httpStatus, 'HTTP status should be 405 Method Not Allowed').toBe(405);
    }
  );

  // ── TC-037 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-037 | [REST VIOLATION] PUT /brandsList should return HTTP 405, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:405. ' +
        'RFC 7231 §6.5.5 requires HTTP 405 at transport level. ' +
        'Fix: return HTTP 405 and remove responseCode from body.'
      );
      const { httpStatus } = await client.putWithStatus(ENDPOINTS.BRANDS_LIST, {});
      expect(httpStatus, 'HTTP status should be 405 Method Not Allowed').toBe(405);
    }
  );

  // ── TC-038 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-038 | [REST VIOLATION] POST /searchProduct (missing param) should return HTTP 400, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:400. ' +
        'RFC 7231 §6.5.1 requires HTTP 400 Bad Request at transport level. ' +
        'Fix: return HTTP 400 and remove responseCode from body.'
      );
      const { httpStatus } = await client.postWithStatus(ENDPOINTS.SEARCH_PRODUCT, {});
      expect(httpStatus, 'HTTP status should be 400 Bad Request').toBe(400);
    }
  );

  // ── TC-039 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-039 | [REST VIOLATION] POST /verifyLogin with invalid credentials should return HTTP 401, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:404. ' +
        'RFC 7235 §3.1 requires HTTP 401 Unauthorized for failed authentication. ' +
        'Using 404 in body is also misleading — 401 is the correct semantic. ' +
        'Fix: return HTTP 401 and remove responseCode from body.'
      );
      const { httpStatus } = await client.postWithStatus(ENDPOINTS.VERIFY_LOGIN, {
        email: 'nobody@invalid-test.com',
        password: 'wrong',
      });
      // 401 is the REST-correct status for failed authentication
      expect(httpStatus, 'HTTP status should be 401 Unauthorized').toBe(401);
    }
  );

  // ── TC-040 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-040 | [REST VIOLATION] DELETE /verifyLogin should return HTTP 405, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:405. ' +
        'RFC 7231 §6.5.5 requires HTTP 405 at transport level. ' +
        'Fix: return HTTP 405 and remove responseCode from body.'
      );
      const { httpStatus } = await client.deleteWithStatus(ENDPOINTS.VERIFY_LOGIN);
      expect(httpStatus, 'HTTP status should be 405 Method Not Allowed').toBe(405);
    }
  );

  // ── TC-041 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-041 | [REST VIOLATION] POST /createAccount success should return HTTP 201, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:201. ' +
        'RFC 7231 §6.3.2 requires HTTP 201 Created when a resource is created. ' +
        'Fix: return HTTP 201 and remove responseCode from body.'
      );
      const email = `standards-create-${Date.now()}@test-ae.com`;
      const { httpStatus } = await client.postWithStatus(ENDPOINTS.CREATE_ACCOUNT, {
        name: 'Standards Create', email, password: 'Test1234!', title: 'Mr',
        birth_date: '01', birth_month: '01', birth_year: '1990',
        firstname: 'Standards', lastname: 'Create', company: 'TestCo',
        address1: '1 St', address2: '', country: 'United States',
        zipcode: '10001', state: 'NY', city: 'NY', mobile_number: '5551234567',
      });
      // Cleanup regardless of assertion outcome
      await client.delete(ENDPOINTS.DELETE_ACCOUNT, { email, password: 'Test1234!' });

      expect(httpStatus, 'HTTP status should be 201 Created').toBe(201);
    }
  );

  // ── TC-042 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-042 | [REST VIOLATION] GET /getUserDetailByEmail (not found) should return HTTP 404, not 200',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: API returns HTTP 200 with body responseCode:404. ' +
        'RFC 7231 §6.5.4 requires HTTP 404 Not Found at transport level. ' +
        'Fix: return HTTP 404 and remove responseCode from body.'
      );
      const { httpStatus } = await client.getWithStatus(ENDPOINTS.GET_USER_DETAIL, {
        email: 'ghost-nobody@invalid-test.com',
      });
      expect(httpStatus, 'HTTP status should be 404 Not Found').toBe(404);
    }
  );
});

// =============================================================================
// SECTION 2 — ENDPOINT NAMING CONVENTIONS
//
// REST standard (RFC 3986 + industry convention):
//   • URIs use lowercase letters only
//   • Words separated by hyphens (kebab-case), never camelCase
//   • Path segments are nouns (resources), not verbs
//   • HTTP method expresses the action (GET=read, POST=create, PUT=replace, DELETE=remove)
//   • Filtering/searching uses query parameters on a resource endpoint
// =============================================================================

test.describe('Endpoint Naming Convention Compliance', () => {
  const CAMEL_CASE = /[a-z][A-Z]/;
  const VERB_PREFIXES = /^\/(create|delete|update|get|set|do|verify|search|check|fetch|add|remove|find)/i;

  // Enumerate all current endpoints with their recommended replacements
  const endpointAudit: Array<{
    current: string;
    recommended: string;
    method: string;
    reason: string;
  }> = [
    {
      current: ENDPOINTS.PRODUCTS_LIST,
      recommended: '/products',
      method: 'GET',
      reason: 'camelCase "productsList" — should be plural noun /products',
    },
    {
      current: ENDPOINTS.BRANDS_LIST,
      recommended: '/brands',
      method: 'GET',
      reason: 'camelCase "brandsList" — should be plural noun /brands',
    },
    {
      current: ENDPOINTS.SEARCH_PRODUCT,
      recommended: '/products?q={term}',
      method: 'GET',
      reason: 'camelCase "searchProduct" + verb — should be GET /products?q=',
    },
    {
      current: ENDPOINTS.VERIFY_LOGIN,
      recommended: '/auth/sessions',
      method: 'POST',
      reason: 'camelCase "verifyLogin" + verb — should be POST /auth/sessions',
    },
    {
      current: ENDPOINTS.CREATE_ACCOUNT,
      recommended: '/users',
      method: 'POST',
      reason: 'camelCase "createAccount" + verb — should be POST /users',
    },
    {
      current: ENDPOINTS.DELETE_ACCOUNT,
      recommended: '/users/{id}',
      method: 'DELETE',
      reason: 'camelCase "deleteAccount" + verb — should be DELETE /users/{id}',
    },
    {
      current: ENDPOINTS.UPDATE_ACCOUNT,
      recommended: '/users/{id}',
      method: 'PUT/PATCH',
      reason: 'camelCase "updateAccount" + verb — should be PUT /users/{id}',
    },
    {
      current: ENDPOINTS.GET_USER_DETAIL,
      recommended: '/users?email={email}',
      method: 'GET',
      reason: 'camelCase "getUserDetailByEmail" + verb — should be GET /users?email=',
    },
  ];

  // ── TC-043 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-043 | [REST VIOLATION] Endpoint paths must not contain camelCase characters',
    () => {
      test.fail(
        true,
        'KNOWN VIOLATION: All 8 active endpoint paths use camelCase. ' +
        'REST convention requires lowercase kebab-case. See endpointAudit table in this file.'
      );
      for (const { current, recommended, reason } of endpointAudit) {
        expect.soft(
          CAMEL_CASE.test(current),
          `"${current}" uses camelCase → rename to "${recommended}" (${reason})`
        ).toBe(false);
      }
    }
  );

  // ── TC-044 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-044 | [REST VIOLATION] Endpoint paths must not start with verb prefixes',
    () => {
      test.fail(
        true,
        'KNOWN VIOLATION: /createAccount, /deleteAccount, /updateAccount, ' +
        '/getUserDetailByEmail, /verifyLogin, /searchProduct all start with verbs. ' +
        'HTTP method should express the action; the path should name the resource.'
      );
      for (const { current, recommended, method, reason } of endpointAudit) {
        expect.soft(
          VERB_PREFIXES.test(current),
          `"${current}" starts with a verb → use ${method} "${recommended}" (${reason})`
        ).toBe(false);
      }
    }
  );

  // ── TC-045 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-045 | [REST VIOLATION] Search must use GET with query params, not POST with body',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: POST /searchProduct requires the search term in the request body. ' +
        'REST standard: search is safe + idempotent → use GET /products?q={term}. ' +
        'Proof: GET /searchProduct?q=top returns responseCode:400 (missing body param), ' +
        'confirming the endpoint only works via POST body — the opposite of REST.'
      );
      // Attempt the REST-standard approach: GET with a query param
      // A compliant endpoint would return 200 with matching products.
      // This API returns 400 (missing search_product body param) — proving the violation.
      const { body } = await client.getWithStatus(ENDPOINTS.SEARCH_PRODUCT, { q: 'top' });
      expect(
        body.responseCode,
        'GET /products?q=top should return 200 with results — REST-standard search must use GET'
      ).toBe(200);
    }
  );
});

// =============================================================================
// SECTION 3 — RESPONSE BODY DESIGN
//
// REST standard: HTTP status codes are the authoritative outcome signal.
// Duplicating the HTTP status inside the response body is:
//   • Redundant — clients already receive it in the HTTP layer
//   • Inconsistent — this API embeds responseCode in body but the HTTP status is always 200
//   • Coupling — clients must parse the body even for simple success/failure checks
//
// Fix: remove responseCode from response body; let HTTP status speak for itself.
//   • On success → HTTP 200/201, body contains only the resource payload
//   • On error   → HTTP 4xx/5xx, body contains { error: { code, message } }
// =============================================================================

test.describe('Response Body Design Compliance', () => {

  // ── TC-046 (VIOLATION) ─────────────────────────────────────────────────────
  test(
    'TC-046 | [REST VIOLATION] GET /productsList response body must not contain redundant responseCode field',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: Every API response includes a "responseCode" field in the JSON body. ' +
        'This duplicates the HTTP status (which should be the authoritative outcome). ' +
        'Fix: remove "responseCode" from all response bodies. ' +
        'Return HTTP 200 with only the resource payload on success. ' +
        'Return HTTP 4xx/5xx with { "error": { "code": "...", "message": "..." } } on failure.'
      );
      const body = await client.get(ENDPOINTS.PRODUCTS_LIST);
      expect(
        body,
        '"responseCode" field is redundant — HTTP status carries this information'
      ).not.toHaveProperty('responseCode');
    }
  );

  // ── TC-047-supplemental (VIOLATION: all endpoints) ─────────────────────────
  test(
    'TC-047 | [REST VIOLATION] All endpoints embed responseCode in body — enumerated audit',
    async () => {
      test.fail(
        true,
        'KNOWN VIOLATION: All API responses contain "responseCode" in the JSON body. ' +
        'The HTTP status layer is being bypassed — see TC-046 for the full fix description.'
      );
      // Sample three distinct endpoints to confirm the pattern is universal
      const results = await Promise.all([
        client.get(ENDPOINTS.PRODUCTS_LIST),
        client.get(ENDPOINTS.BRANDS_LIST),
        client.post(ENDPOINTS.VERIFY_LOGIN, {
          email: 'probe@test-ae.com',
          password: 'probe',
        }),
      ]);

      for (const body of results) {
        expect.soft(
          body,
          '"responseCode" must not be present in response body'
        ).not.toHaveProperty('responseCode');
      }
    }
  );
});
