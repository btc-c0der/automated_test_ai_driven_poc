// ─── Response code enum ───────────────────────────────────────────────────────

export enum ResponseCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
}

// ─── Domain models ────────────────────────────────────────────────────────────

export interface UserType {
  usertype: string;
}

export interface Category {
  usertype: UserType;
  category: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: Category;
}

export interface Brand {
  id: number;
  brand: string;
}

/**
 * Shape of a user as returned by GET /getUserDetailByEmail (API 14).
 *
 * ⚠️  KNOWN API BUGS (confirmed against live API):
 *   1. Field name inconsistency: createAccount/updateAccount accept `birth_date`,
 *      but getUserDetailByEmail returns `birth_day` (different field name).
 *   2. Missing field: `mobile_number` is accepted on create/update but is NOT
 *      returned in the user detail response.
 *
 * Note: `password` is intentionally absent — the API must NOT expose it.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  title: string;
  birth_day: string;    // ⚠️  NOTE: `birth_day`, not `birth_date` (API inconsistency)
  birth_month: string;
  birth_year: string;
  first_name: string;
  last_name: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  // mobile_number is NOT returned by the API (omitted from GET response)
}

/**
 * Payload required to create or update a user account (APIs 11 & 13).
 * All fields are required by the API unless noted.
 */
export interface UserPayload {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birth_date: string;    // "DD"
  birth_month: string;   // "MM"
  birth_year: string;    // "YYYY"
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

// ─── API response envelope ────────────────────────────────────────────────────

/**
 * Generic API response wrapper.
 * This API always returns HTTP 200; the actual outcome is in `responseCode`.
 */
export interface ApiResponse<T = Record<string, unknown>> {
  responseCode: number;
  message?: string;
  products?: Product[];
  brands?: Brand[];
  user?: User;
}

export interface ProductsResponse extends ApiResponse {
  products: Product[];
}

export interface BrandsResponse extends ApiResponse {
  brands: Brand[];
}

export interface UserDetailResponse extends ApiResponse {
  user: User;
}
