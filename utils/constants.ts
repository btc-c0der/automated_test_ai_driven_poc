import { ResponseCode } from '../types/api.types';

export { ResponseCode };

export const ENDPOINTS = {
  PRODUCTS_LIST: '/productsList',
  BRANDS_LIST: '/brandsList',
  SEARCH_PRODUCT: '/searchProduct',
  VERIFY_LOGIN: '/verifyLogin',
  CREATE_ACCOUNT: '/createAccount',
  DELETE_ACCOUNT: '/deleteAccount',
  UPDATE_ACCOUNT: '/updateAccount',
  GET_USER_DETAIL: '/getUserDetailByEmail',
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];
