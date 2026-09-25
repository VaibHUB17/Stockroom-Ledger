import { FilterParams, PageLimit, SortField, SortOrder } from "./types";

const VALID_LIMITS: PageLimit[] = [10, 20, 50];
const VALID_SORT_FIELDS: SortField[] = ["title", "price", "rating"];
const VALID_ORDERS: SortOrder[] = ["asc", "desc"];

export function parseUrlParams(searchParams: URLSearchParams): FilterParams {
  // Page number sanitisation: NaN or <= 0 -> 1
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // Limit sanitisation: only 10, 20, 50 allowed; default 10
  const rawLimit = parseInt(searchParams.get("limit") || "10", 10) as PageLimit;
  const limit = VALID_LIMITS.includes(rawLimit) ? rawLimit : 10;

  const rawQ = (searchParams.get("q") || "").trim();
  const rawCategory = (searchParams.get("category") || "").trim();

  // Search and Category mutual exclusivity:
  // If search query is present, category is cleared
  const q = rawQ;
  const category = q ? "" : rawCategory;

  // Sort field and order sanitisation
  const rawSortBy = searchParams.get("sortBy") as SortField;
  const sortBy = VALID_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "title";

  const rawOrder = searchParams.get("order") as SortOrder;
  const order = VALID_ORDERS.includes(rawOrder) ? rawOrder : "asc";

  return {
    page,
    limit,
    q,
    category,
    sortBy,
    order,
  };
}

export function buildQueryString(params: Partial<FilterParams>): string {
  const searchParams = new URLSearchParams();

  if (params.page && params.page > 1) {
    searchParams.set("page", params.page.toString());
  }

  if (params.limit && params.limit !== 10) {
    searchParams.set("limit", params.limit.toString());
  }

  if (params.q) {
    searchParams.set("q", params.q);
  } else if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.sortBy && params.sortBy !== "title") {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.order && params.order !== "asc") {
    searchParams.set("order", params.order);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function calculateMaxPage(total: number, limit: number): number {
  if (total <= 0) return 1;
  return Math.ceil(total / limit);
}
