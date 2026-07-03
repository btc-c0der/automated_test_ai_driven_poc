import { faker } from '@faker-js/faker';
import { test as base } from '@playwright/test';
import { ApiClient } from './api-client';
import { ENDPOINTS, ResponseCode } from '../utils/constants';
import type { UserPayload } from '../types/api.types';

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Generate a unique, fully-populated user payload.
 * Every call produces a different email — safe for parallel test execution.
 */
export function createUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName, provider: 'test-ae.com' }).toLowerCase(),
    password: faker.internet.password({ length: 12, memorable: false }),
    title: faker.helpers.arrayElement(['Mr', 'Mrs'] as const),
    birth_date: String(faker.number.int({ min: 1, max: 28 })).padStart(2, '0'),
    birth_month: String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0'),
    birth_year: String(faker.number.int({ min: 1960, max: 2000 })),
    firstname: firstName,
    lastname: lastName,
    company: faker.company.name(),
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    country: 'United States',
    zipcode: faker.location.zipCode('#####'),
    state: faker.location.state(),
    city: faker.location.city(),
    mobile_number: faker.phone.number(),
    ...overrides,
  };
}

// ─── Fixture ──────────────────────────────────────────────────────────────────

/**
 * Additional fixture types for tests that need a live user.
 */
export interface UserFixtures {
  /**
   * An API client instance isolated per test.
   */
  apiClient: ApiClient;

  /**
   * A user that has been created before the test and will be deleted after.
   * The payload (including password) is available for auth assertions.
   */
  createdUser: UserPayload;
}

/**
 * Extended test with `apiClient` and `createdUser` fixtures.
 *
 * Usage in a spec file:
 * ```ts
 * import { test } from '../../fixtures/user-factory';
 * test('my test', async ({ createdUser, apiClient }) => { ... });
 * ```
 */
export const test = base.extend<UserFixtures>({
  // ApiClient uses native fetch — no Playwright request context needed.
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await use(client);
    // No dispose — stateless client, nothing to clean up.
  },

  createdUser: async ({ apiClient }, use) => {
    const payload = createUserPayload();

    const created = await apiClient.post(ENDPOINTS.CREATE_ACCOUNT, payload as unknown as Record<string, string>);

    if (created.responseCode !== ResponseCode.CREATED) {
      throw new Error(
        `[createdUser fixture] Failed to create test user (${payload.email}): ` +
        `responseCode=${created.responseCode}, message=${created.message}`
      );
    }

    await use(payload);

    // Teardown — always runs even if the test fails
    await apiClient.delete(ENDPOINTS.DELETE_ACCOUNT, {
      email: payload.email,
      password: payload.password,
    });
  },
});

export { expect } from '@playwright/test';
