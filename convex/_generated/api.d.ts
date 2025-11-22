/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as products from "../products.js";
import type * as purchases from "../purchases.js";
import type * as reset from "../reset.js";
import type * as router from "../router.js";
import type * as sales from "../sales.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  customers: typeof customers;
  dashboard: typeof dashboard;
  http: typeof http;
  migrations: typeof migrations;
  products: typeof products;
  purchases: typeof purchases;
  reset: typeof reset;
  router: typeof router;
  sales: typeof sales;
  suppliers: typeof suppliers;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
