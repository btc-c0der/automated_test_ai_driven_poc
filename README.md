# Automated Test AI Driven POC

Playwright-based test suite for two public practice applications:

- `https://automationexercise.com/api` for API testing
- `https://www.saucedemo.com` for UI testing

The repository contains a fully implemented API suite, a UI POM layer, and focused UI tests that document real defects using seeded users such as `problem_user` and `performance_glitch_user`.

## What’s in this repo

- API contract, negative, edge-case, and REST-standards tests for Automation Exercise
- UI Page Object Model foundation for Sauce Demo
- Seeded-user defect tests for `problem_user`
- Native-fetch API client to bypass Cloudflare TLS fingerprinting issues
- Shared fixtures for isolated, parallel-safe tests
- Planning and findings documentation in `docs/`

## Quick Start

### Install dependencies

```bash
npm install
```

### Run all tests

```bash
npm test
```

### Run only API tests

```bash
npm run test:api
```

### Run only UI tests

```bash
npm run test:ui
```

### Open the HTML report

```bash
npm run report
```

### Debug a failing test

```bash
npm run test:debug
```

### Run UI tests headed

```bash
npm run test:headed
```

## Environment Variables

Copy `.env.example` to `.env` when you want to override defaults.

### Automation Exercise API

- `BASE_URL` - base API URL, defaults to `https://automationexercise.com/api`
- `TEST_USER_EMAIL` - optional fallback test user email
- `TEST_USER_PASSWORD` - optional fallback test user password

### Sauce Demo UI

- `UI_BASE_URL` - defaults to `https://www.saucedemo.com`
- `SAUCE_STANDARD_USER` - defaults to `standard_user`
- `SAUCE_PASSWORD` - defaults to `secret_sauce`
- `SAUCE_PROBLEM_USER` - defaults to `problem_user`
- `SAUCE_PERF_USER` - defaults to `performance_glitch_user`

## Project Structure

```text
.
├── docs/
│   ├── plan.md
│   └── findings_and_prompts.md
├── fixtures/
│   ├── api-client.ts
│   ├── ui-fixtures.ts
│   └── user-factory.ts
├── tests/
│   ├── api/
│   │   ├── api-standards.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── brands.spec.ts
│   │   ├── products.spec.ts
│   │   ├── search.spec.ts
│   │   └── user-account.spec.ts
│   └── ui/
│       ├── pages/
│       │   ├── BasePage.ts
│       │   ├── CartPage.ts
│       │   ├── CheckoutPage.ts
│       │   ├── InventoryPage.ts
│       │   └── LoginPage.ts
│       └── problem-user.spec.ts
├── types/
│   ├── api.types.ts
│   └── ui.types.ts
├── utils/
│   ├── assertions.ts
│   └── constants.ts
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

## Test Coverage

### Automation Exercise API

The API suite covers all 14 documented endpoints with functional, negative, edge, and REST-compliance checks.

Key coverage areas:

- Products list retrieval and method rejection
- Brands list retrieval and method rejection
- Search behavior and missing parameter handling
- Login success/failure and auth edge cases
- Create, update, delete, and lookup user flows
- REST standards audit for status codes, endpoint naming, and response design

### Sauce Demo UI

The UI suite focuses on critical flows and seeded defects.

Key coverage areas:

- Standard user login and baseline happy paths
- `problem_user` image defects
- `problem_user` wrong-product navigation defects
- Checkout form defects
- Sort-order correctness
- Cart add/remove basics
- Performance-oriented user scaffolding (`performance_glitch_user`)

## Important Findings

### Automation Exercise API findings

The API does not behave like a standard REST service in several places.

- It returns HTTP 200 for all outcomes and places the real code in `responseCode`
- It repeats `responseCode` in the JSON body, which is redundant and misleading
- Several endpoints use camelCase and verb-style paths
- Search is implemented as POST with a form body instead of GET with a query parameter
- `GET /getUserDetailByEmail` returns `birth_day` instead of `birth_date`
- `mobile_number` is not returned by the user-detail response

### Sauce Demo UI findings

The `problem_user` account intentionally exposes defects.

- All inventory images use the same placeholder asset
- Product links navigate to the wrong detail page
- Checkout `lastName` does not retain input properly
- Sort order is incorrect for problem-user flows

## Reports and Documentation

- [docs/plan.md](docs/plan.md) - implementation checklist, test case catalogue, REST guidance
- [docs/findings_and_prompts.md](docs/findings_and_prompts.md) - session prompts and bug/findings log

## Running Specific Test Files

### API examples

```bash
npx playwright test tests/api/products.spec.ts
npx playwright test tests/api/user-account.spec.ts
npx playwright test --project=api tests/api/api-standards.spec.ts
```

### UI examples

```bash
npx playwright test --project=ui tests/ui/problem-user.spec.ts
npx playwright test --project=ui tests/ui/problem-user.spec.ts --grep "broken images"
```

## Design Notes

- API tests use native `fetch` instead of Playwright `APIRequestContext` because the Automation Exercise site is Cloudflare-protected and blocks the Playwright request fingerprint.
- API tests assert body `responseCode` for functional coverage and HTTP status for REST compliance coverage.
- UI tests are organized with a Page Object Model so selectors and flows are reusable.
- Shared fixtures keep test data isolated and parallel-safe.

## Verification

Current suite state when this README was added:

- API tests: 50/50 passing
- UI tests: 23/23 passing
- Total: 73/73 passing

## Notes for Contributors

- Keep new API tests independent and parallel-safe.
- Prefer typed helpers in `fixtures/` and `types/` over repeating selectors or payload shapes.
- If the public API or UI behavior changes, update both the test and the findings documentation.
- Do not commit generated reports, local environment files, or `node_modules/`.

## License

This project is a proof-of-concept test automation repository for public practice applications. No separate license has been added.
