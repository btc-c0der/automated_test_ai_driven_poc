# Playwright API Testing Repository — automationexercise.com
## Implementation Plan & Checklist

> **Target**: `https://automationexercise.com/api` · 14 endpoints · 50 test cases  
> **Stack**: Playwright + TypeScript + @faker-js/faker  
> **Goal**: 100% functional coverage + REST standards audit, parallel-safe, fully isolated tests

---

## ⚠️ Key Gotchas

> **1. HTTP 200 for everything**: This API always returns HTTP 200, even for errors. Functional tests must check `responseCode` in the **response body**, not the HTTP status code. Use `ApiClient.get/post/put/delete()` (returns body only).  
> **2. Form-data bodies**: The API uses `application/x-www-form-urlencoded`, not JSON bodies for POST/PUT/DELETE.  
> **3. REST compliance tests**: Use `ApiClient.*WithStatus()` methods to assert the HTTP status directly. These tests document known design violations (marked `test.fail()`).

---

## API Schema Reference

**Base URL**: `https://automationexercise.com/api`

| # | Method | Endpoint | Auth | Body (form-data) | Query |
|---|--------|----------|------|------------------|-------|
| 1 | GET | `/productsList` | No | — | — |
| 2 | POST | `/productsList` | No | any (→ 405) | — |
| 3 | GET | `/brandsList` | No | — | — |
| 4 | PUT | `/brandsList` | No | any (→ 405) | — |
| 5 | POST | `/searchProduct` | No | `search_product=<term>` | — |
| 6 | POST | `/searchProduct` | No | (missing param → 400) | — |
| 7 | POST | `/verifyLogin` | No | `email`, `password` | — |
| 8 | POST | `/verifyLogin` | No | (missing email → 400) | — |
| 9 | DELETE | `/verifyLogin` | No | — (→ 405) | — |
| 10 | POST | `/verifyLogin` | No | invalid creds (→ 404) | — |
| 11 | POST | `/createAccount` | No | name, email, password, title, birth_date, birth_month, birth_year, firstname, lastname, company, address1, address2, country, zipcode, state, city, mobile_number | — |
| 12 | DELETE | `/deleteAccount` | No | `email`, `password` | — |
| 13 | PUT | `/updateAccount` | No | same as createAccount | — |
| 14 | GET | `/getUserDetailByEmail` | No | — | `?email=` |

### Response Body Schemas

```typescript
// Standard envelope — all responses use this shape
{ responseCode: number, message?: string, products?: Product[], brands?: Brand[], user?: User }

// Product
{ id: number, name: string, price: string, brand: string,
  category: { usertype: { usertype: string }, category: string } }

// Brand
{ id: number, brand: string }

// User
{ id: number, name: string, email: string, title: string,
  birth_date: string, birth_month: string, birth_year: string,
  first_name: string, last_name: string, company: string,
  address1: string, address2: string, country: string,
  state: string, city: string, zipcode: string, mobile_number: string }
```

### Response Codes (in body)
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / missing param |
| 404 | Not found |
| 405 | Method not supported |

---

## Repository Structure

```
taller/
├── docs/
│   ├── plan.md            ← this file
│   ├── api-schema.md      ← endpoint reference (generated)
│   ├── test-cases.md      ← full test case catalogue
│   └── decisions.md       ← architecture decisions
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── tests/
│   ├── api/
│   │   ├── products.spec.ts       ← APIs 1, 2
│   │   ├── brands.spec.ts         ← APIs 3, 4
│   │   ├── search.spec.ts         ← APIs 5, 6
│   │   ├── auth.spec.ts           ← APIs 7, 8, 9, 10
│   │   └── user-account.spec.ts   ← APIs 11, 12, 13, 14
│   └── ui/
│       └── .gitkeep               ← UI scaffold placeholder
├── fixtures/
│   ├── api-client.ts      ← typed HTTP wrapper (uses request.newContext)
│   └── user-factory.ts    ← faker user payload + withCreatedUser fixture
├── types/
│   └── api.types.ts       ← TS interfaces + ApiResponse<T>
├── utils/
│   ├── assertions.ts      ← assertProductShape, assertBrandShape, etc.
│   └── constants.ts       ← ENDPOINTS, RESPONSE_CODES
└── perf/
    └── k6/                ← k6 load/stress/soak scripts
```

---

## Implementation Checklist

### Phase 1 — Bootstrap & Config
- [x] `package.json` — deps: `@playwright/test`, `typescript`, `@faker-js/faker`, `dotenv`
- [x] `tsconfig.json` — strict mode, `baseUrl`, path aliases
- [x] `.env.example` — `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
- [x] `playwright.config.ts` — `baseURL`, `fullyParallel: true`, HTML + JUnit reporters, API + UI projects

### Phase 2 — Types & Schema
- [x] `types/api.types.ts` — `Product`, `Brand`, `User`, `ApiResponse<T>`, `ResponseCode` enum

### Phase 3 — Fixtures & Utilities
- [x] `utils/constants.ts` — `ENDPOINTS`, `RESPONSE_CODES`
- [x] `utils/assertions.ts` — `assertProductShape()`, `assertBrandShape()`, `assertUserShape()`, `assertResponseCode()`
- [x] `fixtures/api-client.ts` — `get/post/put/delete` (body only) + `*WithStatus` variants (httpStatus + body) using Node.js native fetch
- [x] `fixtures/user-factory.ts` — `createUserPayload()` with faker + `withCreatedUser` test fixture

### Phase 4 — Test Implementation
- [x] `tests/api/products.spec.ts` — APIs 1 & 2 (TC-001, TC-002, TC-015, TC-023, TC-028, TC-031, TC-035)
- [x] `tests/api/brands.spec.ts` — APIs 3 & 4 (TC-003, TC-004, TC-016, TC-024, TC-034)
- [x] `tests/api/search.spec.ts` — APIs 5 & 6 (TC-005, TC-006, TC-017, TC-021, TC-022)
- [x] `tests/api/auth.spec.ts` — APIs 7–10 (TC-007, TC-008, TC-013, TC-014, TC-029, TC-030)
- [x] `tests/api/user-account.spec.ts` — APIs 11–14 (TC-009–TC-012, TC-018–TC-020, TC-025–TC-027, TC-032, TC-033)
- [x] `tests/api/api-standards.spec.ts` — REST compliance audit (TC-036–TC-049)

### Phase 5 — Documentation
- [ ] `docs/api-schema.md` — full endpoint & response reference
- [ ] `docs/test-cases.md` — printable test case catalogue
- [ ] `docs/decisions.md` — architecture decisions & coverage map

### Phase 6 — UI Readiness
- [x] `tests/ui/.gitkeep` — UI project scaffold (empty, ready)
- [ ] Add Page Object Model base class in `tests/ui/pages/` when UI tests begin

### Phase 7 — Performance (k6)
- [ ] `perf/k6/products-load.js` — 50 VUs × 30s on GET /productsList
- [ ] `perf/k6/stress.js` — ramp to 200 VUs
- [ ] `perf/k6/soak.js` — 10 VUs × 5min

---

## Test Cases Catalogue

### Priority 1 — CRITICAL (12 tests)

#### TC-001 · Products — GET all products returns valid list
| | |
|---|---|
| **Objective** | Verify `/productsList` returns 200 with a non-empty products array conforming to schema |
| **Preconditions** | None |
| **Steps** | 1. GET /productsList<br>2. Assert HTTP 200<br>3. Assert body `responseCode == 200`<br>4. Assert `products.length > 0`<br>5. Assert each product has `id`, `name`, `price`, `brand`, `category` |
| **Expected** | `{ responseCode: 200, products: Product[] }` |
| **Criticality** | 🔴 Critical |

#### TC-002 · Products — POST to products list returns 405
| | |
|---|---|
| **Objective** | Verify unsupported method is correctly rejected |
| **Preconditions** | None |
| **Steps** | 1. POST /productsList with any body<br>2. Assert HTTP 200 (API always wraps in 200)<br>3. Assert body `responseCode == 405`<br>4. Assert message contains "not supported" |
| **Expected** | `{ responseCode: 405, message: "This request method is not supported." }` |
| **Criticality** | 🔴 Critical |

#### TC-003 · Brands — GET all brands returns valid list
| | |
|---|---|
| **Objective** | Verify `/brandsList` returns 200 with a non-empty brands array |
| **Preconditions** | None |
| **Steps** | 1. GET /brandsList<br>2. Assert `responseCode == 200`<br>3. Assert `brands.length > 0`<br>4. Assert each brand has `id` and `brand` |
| **Expected** | `{ responseCode: 200, brands: Brand[] }` |
| **Criticality** | 🔴 Critical |

#### TC-004 · Brands — PUT to brands list returns 405
| | |
|---|---|
| **Objective** | Verify PUT is rejected on brands endpoint |
| **Preconditions** | None |
| **Steps** | 1. PUT /brandsList<br>2. Assert `responseCode == 405` |
| **Expected** | `{ responseCode: 405, message: "This request method is not supported." }` |
| **Criticality** | 🔴 Critical |

#### TC-005 · Search — POST search with valid term returns matching products
| | |
|---|---|
| **Objective** | Verify `/searchProduct` returns filtered results for a known term |
| **Preconditions** | Products list is available |
| **Steps** | 1. POST /searchProduct with `search_product=top`<br>2. Assert `responseCode == 200`<br>3. Assert `products.length > 0` |
| **Expected** | `{ responseCode: 200, products: Product[] }` |
| **Criticality** | 🔴 Critical |

#### TC-006 · Search — POST search without search_product param returns 400
| | |
|---|---|
| **Objective** | Verify missing required param returns bad request |
| **Preconditions** | None |
| **Steps** | 1. POST /searchProduct with empty body<br>2. Assert `responseCode == 400`<br>3. Assert message about missing parameter |
| **Expected** | `{ responseCode: 400, message: "Bad request, search_product parameter is missing in POST request." }` |
| **Criticality** | 🔴 Critical |

#### TC-007 · Auth — POST verifyLogin with valid credentials returns 200
| | |
|---|---|
| **Objective** | Verify a valid user can authenticate |
| **Preconditions** | Test user created via `withCreatedUser` fixture |
| **Steps** | 1. POST /verifyLogin with valid `email` & `password`<br>2. Assert `responseCode == 200`<br>3. Assert `message == "User exists!"` |
| **Expected** | `{ responseCode: 200, message: "User exists!" }` |
| **Criticality** | 🔴 Critical |

#### TC-008 · Auth — POST verifyLogin with invalid credentials returns 404
| | |
|---|---|
| **Objective** | Verify wrong credentials return not found |
| **Preconditions** | None |
| **Steps** | 1. POST /verifyLogin with `email=nonexistent@test.com` & `password=wrong`<br>2. Assert `responseCode == 404`<br>3. Assert `message == "User not found!"` |
| **Expected** | `{ responseCode: 404, message: "User not found!" }` |
| **Criticality** | 🔴 Critical |

#### TC-009 · User Account — POST createAccount registers a new user
| | |
|---|---|
| **Objective** | Verify a new user can be created with all required fields |
| **Preconditions** | Email must not already exist |
| **Steps** | 1. POST /createAccount with full valid payload (faker-generated)<br>2. Assert `responseCode == 201`<br>3. Assert `message == "User created!"` |
| **Teardown** | DELETE /deleteAccount with same credentials |
| **Expected** | `{ responseCode: 201, message: "User created!" }` |
| **Criticality** | 🔴 Critical |

#### TC-010 · User Account — DELETE deleteAccount removes user
| | |
|---|---|
| **Objective** | Verify a user account can be deleted |
| **Preconditions** | User exists (created in `beforeEach`) |
| **Steps** | 1. DELETE /deleteAccount with `email` & `password`<br>2. Assert `responseCode == 200`<br>3. Assert `message == "Account deleted!"` |
| **Expected** | `{ responseCode: 200, message: "Account deleted!" }` |
| **Criticality** | 🔴 Critical |

#### TC-011 · User Account — PUT updateAccount updates existing user details
| | |
|---|---|
| **Objective** | Verify user details can be updated and the change persists |
| **Preconditions** | User exists via `withCreatedUser` fixture |
| **Steps** | 1. PUT /updateAccount with updated `name` (and all required fields)<br>2. Assert `responseCode == 200`<br>3. Assert `message == "User updated!"`<br>4. GET /getUserDetailByEmail → assert `user.name` matches updated value |
| **Expected** | `{ responseCode: 200, message: "User updated!" }` |
| **Criticality** | 🔴 Critical |

#### TC-012 · User Account — GET getUserDetailByEmail returns correct user schema (password not exposed)
| | |
|---|---|
| **Objective** | Verify user data is retrievable by email; password must NOT appear in response |
| **Preconditions** | User exists via `withCreatedUser` fixture |
| **Steps** | 1. GET /getUserDetailByEmail?email=`<test_email>`<br>2. Assert `responseCode == 200`<br>3. Assert `user` object matches expected schema<br>4. Assert `user` does NOT have a `password` field |
| **Expected** | `{ responseCode: 200, user: User }` — no `password` field present |
| **Criticality** | 🔴 Critical |

---

### Priority 2 — HIGH (8 tests)

#### TC-013 · Auth — POST verifyLogin missing email param returns 400
| | |
|---|---|
| **Objective** | Missing email parameter returns bad request |
| **Steps** | POST /verifyLogin with only `password` → assert `responseCode == 400` |
| **Expected** | `{ responseCode: 400 }` |
| **Criticality** | 🟠 High |

#### TC-014 · Auth — DELETE verifyLogin returns 405
| | |
|---|---|
| **Objective** | DELETE method is not supported on verifyLogin |
| **Steps** | DELETE /verifyLogin → assert `responseCode == 405` |
| **Expected** | `{ responseCode: 405 }` |
| **Criticality** | 🟠 High |

#### TC-015 · Products — Response schema: all product field types are correct
| | |
|---|---|
| **Objective** | Validate type of every field in the product schema |
| **Steps** | GET /productsList → for each product assert `id=number`, `name=string`, `price=string`, `brand=string`, `category=object` |
| **Expected** | All products pass type assertions |
| **Criticality** | 🟠 High |

#### TC-016 · Brands — Response schema: all brand field types are correct
| | |
|---|---|
| **Objective** | Validate brand schema field types |
| **Steps** | GET /brandsList → for each brand assert `id=number`, `brand=string` |
| **Expected** | All brands pass type assertions |
| **Criticality** | 🟠 High |

#### TC-017 · Search — POST search with empty string term
| | |
|---|---|
| **Objective** | Verify behavior when `search_product` is an empty string (edge case) |
| **Steps** | POST /searchProduct with `search_product=` → assert no 500; document response |
| **Expected** | `responseCode == 200` or `400`; valid JSON; never 500 |
| **Criticality** | 🟠 High |

#### TC-018 · User Account — POST createAccount with duplicate email returns 400
| | |
|---|---|
| **Objective** | Duplicate registration is rejected |
| **Preconditions** | User already exists via fixture |
| **Steps** | POST /createAccount with existing email → assert `responseCode == 400` |
| **Expected** | `{ responseCode: 400, message: "Email already exist!" }` |
| **Criticality** | 🟠 High |

#### TC-019 · User Account — GET getUserDetailByEmail with non-existent email returns 404
| | |
|---|---|
| **Objective** | Missing user returns not found |
| **Steps** | GET /getUserDetailByEmail?email=ghost@ghost.com → assert `responseCode == 404` |
| **Expected** | `{ responseCode: 404, message: "Account not found with this email, try another email!" }` |
| **Criticality** | 🟠 High |

#### TC-020 · User Account — Full lifecycle: create → login → get → update → delete
| | |
|---|---|
| **Objective** | Verify full CRUD lifecycle end-to-end |
| **Preconditions** | Fresh faker-generated email (no prior state needed) |
| **Steps** | 1. POST /createAccount → `201`<br>2. POST /verifyLogin → `200`<br>3. GET /getUserDetailByEmail → `200`, check fields<br>4. PUT /updateAccount (new name) → `200`<br>5. GET /getUserDetailByEmail → confirm new name<br>6. DELETE /deleteAccount → `200` |
| **Expected** | Each step returns expected responseCode and message |
| **Criticality** | 🟠 High |

---

### Priority 3 — MEDIUM (10 tests)

| ID | Title | Objective | Expected | Criticality |
|----|-------|-----------|----------|-------------|
| TC-021 | Search — XSS payload in search_product | API handles `<script>` without crash | No 500; valid JSON | 🟡 Medium |
| TC-022 | Search — Oversized input (1000+ chars) | Graceful handling of large input | 200 or 400; never 500 | 🟡 Medium |
| TC-023 | Products — GET productsList latency < 2000ms | Performance baseline | Elapsed < 2s | 🟡 Medium |
| TC-024 | Brands — GET brandsList latency < 2000ms | Performance baseline | Elapsed < 2s | 🟡 Medium |
| TC-025 | User Account — PUT updateAccount for non-existent user returns 404 | Updating missing user is rejected | `responseCode == 404` | 🟡 Medium |
| TC-026 | User Account — DELETE deleteAccount with wrong password is rejected | Wrong credentials prevent deletion | Error response; account still exists | 🟡 Medium |
| TC-027 | User Account — createAccount with missing required field returns 400 | Partial payload is rejected | `responseCode == 400` | 🟡 Medium |
| TC-028 | Products — Verify products list has ≥10 items | Data integrity smoke check | `products.length >= 10` | 🟡 Medium |
| TC-029 | Auth — POST verifyLogin with SQL injection payload | API not vulnerable to SQLi via credentials | `responseCode == 404` (not 200) | 🟡 Medium |
| TC-030 | Auth — POST verifyLogin with missing password param | Missing password returns 400 | `responseCode == 400` | 🟡 Medium |

---

### Priority 4 — LOW / EXPLORATORY (5 tests)

| ID | Title | Objective | Criticality |
|----|-------|-----------|-------------|
| TC-031 | Products — GET with unknown query param is ignored | Extra params don't break endpoint | 🔵 Low |
| TC-032 | User Account — createAccount with numeric name | Name field accepts non-standard values without crash | 🔵 Low |
| TC-033 | User Account — createAccount with 255+ char email | Boundary test for email field length | 🔵 Low |
| TC-034 | Brands — Brand IDs are unique | Data integrity check | 🔵 Low |
| TC-035 | Products — Product IDs are unique | Data integrity check | 🔵 Low |

---

## Performance Testing Plan

| Scenario | Tool | Threshold |
|----------|------|-----------|
| GET /productsList p99 latency | Playwright `Date.now()` | < 2s |
| GET /brandsList p99 latency | Playwright `Date.now()` | < 2s |
| POST /searchProduct p99 latency | Playwright `Date.now()` | < 2s |
| Load: 50 VUs × 30s on GET endpoints | k6 (`perf/k6/load.js`) | p95 < 3s, error rate < 1% |
| Stress: ramp to 200 VUs | k6 (`perf/k6/stress.js`) | No 500s |
| Soak: 10 VUs × 5min | k6 (`perf/k6/soak.js`) | No degradation |

---

## Security Testing Plan

| Category | Test Case | Notes |
|----------|-----------|-------|
| XSS in string inputs | TC-021 | `<script>` tag in `search_product` |
| SQL Injection via credentials | TC-029 | `' OR 1=1--` in email |
| Method enforcement | TC-002, TC-004, TC-014 | Unsupported HTTP verbs rejected |
| Auth bypass (missing params) | TC-013, TC-030 | Empty/partial credential payloads |
| Sensitive data exposure | TC-012 | Password NOT returned in user detail |
| Rate limiting | Manual observation | 100 rapid POSTs to /verifyLogin — document finding |
| HTTPS enforcement | Config-level | `baseURL` asserts `https://` |
| Response security headers | Separate assertion | Check X-Frame-Options, CSP, HSTS |

---

## Playwright Best Practices Applied

- `fullyParallel: true` — all tests run in parallel by default
- `withCreatedUser` fixture — creates a fresh user in `beforeEach`, deletes in `afterEach`; tests never share mutable state
- `request.newContext()` per test — no shared cookies or sessions
- All user data from `@faker-js/faker` via `createUserPayload()` — zero hardcoded emails
- `expect.soft()` for multi-assertion schema validation — collects all failures before stopping
- `test.describe` grouping per resource domain (Products, Brands, Search, Auth, Users)
- `test.beforeAll` for read-only shared data (product/brand lists loaded once per file)
- HTML + JUnit XML reporters for CI integration

---

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| All 14 documented API endpoints | Full UI test suite (scaffold only) |
| Functional, contract, negative, edge case tests | JWT/token auth (API uses form-data creds) |
| Performance baselines (Playwright latency assertions) | Third-party integrations |
| Load/stress/soak (k6 — separate from Playwright) | Database-level testing |
| Security smoke tests (XSS, SQLi, method enforcement) | Destructive security testing |
| REST standards compliance audit (TC-036–TC-049) | Modifying or patching the live API |
| UI Playwright project (config scaffold) | — |

---

## REST API Standards Compliance Audit

> **File**: `tests/api/api-standards.spec.ts`  
> **Count**: 15 tests (TC-036 – TC-049), 3 compliant baselines + 12 documented violations  
> **Pattern**: Violations use `test.fail()` — suite stays green while violations are tracked. Remove `test.fail()` once the API is fixed.

---

### Guidance: How to Fix These Violations

#### 1. HTTP Status Codes (RFC 7231)

The API currently returns **HTTP 200 for every response**, even errors. The HTTP status code is the protocol-level contract — it tells clients whether a request succeeded or failed without parsing the body.

**Violated rule**: Use appropriate HTTP status codes at the transport layer.

| Current behaviour | Correct HTTP status | Standard ref |
|-------------------|--------------------|-|
| HTTP 200, body `responseCode:405` | **HTTP 405** Method Not Allowed | RFC 7231 §6.5.5 |
| HTTP 200, body `responseCode:400` | **HTTP 400** Bad Request | RFC 7231 §6.5.1 |
| HTTP 200, body `responseCode:404` | **HTTP 404** Not Found | RFC 7231 §6.5.4 |
| HTTP 200, body `responseCode:201` on create | **HTTP 201** Created | RFC 7231 §6.3.2 |
| HTTP 200, body `responseCode:404` on failed auth | **HTTP 401** Unauthorized | RFC 7235 §3.1 |

#### 2. Remove `responseCode` from Response Bodies

Once HTTP status codes carry the outcome, the `responseCode` field in the body is **redundant** and creates confusion (especially when HTTP 200 wraps a body-level 404).

**Target response structure:**

```jsonc
// Success — HTTP 200
{ "products": [ ... ] }

// Resource created — HTTP 201
{ "user": { ... } }

// Error — HTTP 400 / 401 / 404 / 405
{ "error": { "code": "MISSING_PARAMETER", "message": "search_product is required" } }
```

#### 3. Endpoint Naming (RFC 3986 + REST conventions)

| Rule | Violation example | Compliant replacement |
|------|-------------------|-----------------------|
| Lowercase only, no camelCase | `/productsList` | `/products` |
| Hyphens for multi-word segments | `/getUserDetailByEmail` | `/users` (with `?email=` param) |
| Plural nouns for collections | `/productsList` | `/products` |
| HTTP method expresses action — no verbs in path | `/createAccount`, `/deleteAccount` | `POST /users`, `DELETE /users/{id}` |
| Safe + idempotent reads use GET + query params | `POST /searchProduct` body `search_product=` | `GET /products?q=` |

**Full endpoint mapping:**

| Current | Method | REST-compliant replacement | Method |
|---------|--------|---------------------------|--------|
| `/productsList` | GET | `/products` | GET |
| `/brandsList` | GET | `/brands` | GET |
| `/searchProduct` | POST (body param) | `/products?q={term}` | GET |
| `/verifyLogin` | POST | `/auth/sessions` | POST |
| `/createAccount` | POST | `/users` | POST |
| `/deleteAccount` | DELETE | `/users/{id}` | DELETE |
| `/updateAccount` | PUT | `/users/{id}` | PUT / PATCH |
| `/getUserDetailByEmail` | GET (query param) | `/users?email={email}` | GET |

---

### Priority 1 — CRITICAL REST Violations (HTTP Status Codes)

#### TC-036 · [REST VIOLATION] POST /productsList should return HTTP 405
| | |
|---|---|
| **Objective** | Verify the HTTP transport layer returns 405, not 200 |
| **Steps** | POST /productsList → assert `httpStatus == 405` |
| **Expected (compliant)** | HTTP 405 Method Not Allowed |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 405, message: "..." }` |
| **Fix** | Return HTTP 405; remove `responseCode` from body |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-037 · [REST VIOLATION] PUT /brandsList should return HTTP 405
| | |
|---|---|
| **Objective** | Verify the HTTP transport layer returns 405, not 200 |
| **Steps** | PUT /brandsList → assert `httpStatus == 405` |
| **Expected (compliant)** | HTTP 405 |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 405 }` |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-038 · [REST VIOLATION] POST /searchProduct (missing param) should return HTTP 400
| | |
|---|---|
| **Objective** | Verify the HTTP transport layer returns 400 for bad requests |
| **Steps** | POST /searchProduct with no body → assert `httpStatus == 400` |
| **Expected (compliant)** | HTTP 400 Bad Request |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 400 }` |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-039 · [REST VIOLATION] POST /verifyLogin with invalid credentials should return HTTP 401
| | |
|---|---|
| **Objective** | Verify authentication failure returns HTTP 401, not 200 |
| **Steps** | POST /verifyLogin with wrong creds → assert `httpStatus == 401` |
| **Expected (compliant)** | HTTP 401 Unauthorized |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 404 }` (also wrong code — 404 implies resource not found; 401 is the correct auth failure code) |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-040 · [REST VIOLATION] DELETE /verifyLogin should return HTTP 405
| | |
|---|---|
| **Objective** | Verify HTTP 405 is returned at transport level |
| **Steps** | DELETE /verifyLogin → assert `httpStatus == 405` |
| **Expected (compliant)** | HTTP 405 |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 405 }` |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-041 · [REST VIOLATION] POST /createAccount success should return HTTP 201
| | |
|---|---|
| **Objective** | Verify resource creation returns HTTP 201 Created |
| **Steps** | POST /createAccount with valid payload → assert `httpStatus == 201` |
| **Expected (compliant)** | HTTP 201 Created |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 201 }` |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-042 · [REST VIOLATION] GET /getUserDetailByEmail (not found) should return HTTP 404
| | |
|---|---|
| **Objective** | Verify not-found cases return HTTP 404 at transport level |
| **Steps** | GET /getUserDetailByEmail?email=nobody@ghost.com → assert `httpStatus == 404` |
| **Expected (compliant)** | HTTP 404 Not Found |
| **Actual (violation)** | HTTP 200, body `{ responseCode: 404 }` |
| **Criticality** | 🔴 Critical |
| **Status** | ⚠️ Known violation — `test.fail()` active |

---

### Priority 2 — HIGH REST Violations (Endpoint Naming + Body Design)

#### TC-043 · [REST VIOLATION] Endpoint paths must not contain camelCase
| | |
|---|---|
| **Objective** | All endpoint paths must use lowercase only (kebab-case for multi-word) |
| **Violation list** | `/productsList`, `/brandsList`, `/searchProduct`, `/verifyLogin`, `/createAccount`, `/deleteAccount`, `/updateAccount`, `/getUserDetailByEmail` |
| **Fix** | Rename all to lowercase, hyphen-separated resource nouns (see mapping table above) |
| **Criticality** | 🟠 High |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-044 · [REST VIOLATION] Endpoint paths must not use verb prefixes
| | |
|---|---|
| **Objective** | HTTP methods (GET/POST/PUT/DELETE) express the action; paths name the resource |
| **Violation list** | `/createAccount` (→ POST /users), `/deleteAccount` (→ DELETE /users/{id}), `/updateAccount` (→ PUT /users/{id}), `/getUserDetailByEmail` (→ GET /users?email=), `/verifyLogin` (→ POST /auth/sessions), `/searchProduct` (→ GET /products?q=) |
| **Criticality** | 🟠 High |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-045 · [REST VIOLATION] Search must use GET with query params, not POST with body
| | |
|---|---|
| **Objective** | Search is safe + idempotent → must use GET, not POST |
| **Steps** | GET /searchProduct?q=top → asserts body `responseCode == 200` (fails; API requires POST body `search_product=`) |
| **Expected (compliant)** | `GET /products?q=top` returns HTTP 200 with matching products |
| **Actual (violation)** | `GET /searchProduct?q=top` returns body `responseCode: 400` (missing `search_product` body field) |
| **Fix** | Support `GET /products?q={term}` — remove POST body requirement |
| **Criticality** | 🟠 High |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-046 · [REST VIOLATION] Response body must not contain redundant responseCode field
| | |
|---|---|
| **Objective** | HTTP status codes are authoritative; `responseCode` in body is redundant and misleading |
| **Steps** | GET /productsList → assert body does NOT have `responseCode` property |
| **Expected (compliant)** | Body: `{ "products": [ ... ] }` — no `responseCode` |
| **Actual (violation)** | Body always includes `{ "responseCode": 200, "products": [ ... ] }` |
| **Criticality** | 🟠 High |
| **Status** | ⚠️ Known violation — `test.fail()` active |

#### TC-047 · [REST VIOLATION] All endpoints embed responseCode in body (enumerated audit)
| | |
|---|---|
| **Objective** | Confirm the redundant `responseCode` pattern is universal — not isolated |
| **Steps** | Sample GET /productsList, GET /brandsList, POST /verifyLogin → assert none have `responseCode` in body |
| **Criticality** | 🟠 High |
| **Status** | ⚠️ Known violation — `test.fail()` active |

---

### Compliant Baselines (pass without `test.fail()`)

| ID | Title | Expected HTTP Status | Result |
|----|-------|---------------------|--------|
| TC-047 | GET /productsList returns HTTP 200 | 200 | ✅ Compliant |
| TC-048 | GET /brandsList returns HTTP 200 | 200 | ✅ Compliant |
| TC-049 | DELETE /deleteAccount success returns HTTP 200 | 200 | ✅ Compliant |

---

### Known API Bugs Found During Testing

| Bug | Endpoint | Description | Severity |
|-----|----------|-------------|----------|
| BUG-001 | `GET /getUserDetailByEmail` | Returns `birth_day`, not `birth_date` — field name changes between write (createAccount) and read (getUserDetailByEmail) | High |
| BUG-002 | `GET /getUserDetailByEmail` | `mobile_number` accepted on create/update but never returned in GET response | Medium |
| BUG-003 | All endpoints | HTTP status is always 200, even for 400/401/404/405/201 outcomes | Critical |
| BUG-004 | All endpoints | `responseCode` in body duplicates (and contradicts) the HTTP status code | High |
| BUG-005 | All endpoints | camelCase endpoint names violate REST URL conventions | Medium |
| BUG-006 | `/searchProduct` | Search uses POST + body param instead of GET + query param | Medium |
| BUG-007 | `/verifyLogin` | Returns body `responseCode:404` for auth failure; correct code is 401 Unauthorized | High |
