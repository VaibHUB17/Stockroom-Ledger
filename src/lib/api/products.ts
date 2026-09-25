import { http } from "../http";
import { Product, ProductListResponse, SortField, SortOrder } from "../types";

export interface FetchProductsOptions {
  limit: number;
  skip: number;
  sortBy?: SortField;
  order?: SortOrder;
  signal?: AbortSignal;
}

export interface SearchProductsOptions extends FetchProductsOptions {
  q: string;
}

export interface CategoryProductsOptions extends FetchProductsOptions {
  category: string;
}

export interface ProductInput {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  brand?: string;
  thumbnail?: string;
}

export async function getProducts(options: FetchProductsOptions): Promise<ProductListResponse> {
  const { limit, skip, sortBy, order, signal } = options;
  const params: Record<string, string | number> = { limit, skip };
  if (sortBy) params.sortBy = sortBy;
  if (order) params.order = order;

  const response = await http.get<ProductListResponse>("/products", {
    params,
    signal,
  });
  return response.data;
}

export async function searchProducts(options: SearchProductsOptions): Promise<ProductListResponse> {
  const { q, limit, skip, sortBy, order, signal } = options;
  const params: Record<string, string | number> = { q, limit, skip };
  if (sortBy) params.sortBy = sortBy;
  if (order) params.order = order;

  const response = await http.get<ProductListResponse>("/products/search", {
    params,
    signal,
  });
  return response.data;
}

export async function getProductsByCategory(options: CategoryProductsOptions): Promise<ProductListResponse> {
  const { category, limit, skip, sortBy, order, signal } = options;
  const params: Record<string, string | number> = { limit, skip };
  if (sortBy) params.sortBy = sortBy;
  if (order) params.order = order;

  const response = await http.get<ProductListResponse>(
    `/products/category/${encodeURIComponent(category)}`,
    { params, signal }
  );
  return response.data;
}

export async function getProductById(id: number | string, signal?: AbortSignal): Promise<Product> {
  const response = await http.get<Product>(`/products/${id}`, { signal });
  return response.data;
}

export async function addProduct(payload: ProductInput): Promise<Product> {
  const response = await http.post<Product>("/products/add", payload);
  return response.data;
}

export async function updateProduct(id: number, payload: Partial<ProductInput>): Promise<Product> {
  const response = await http.put<Product>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: number): Promise<{ id: number; isDeleted: boolean }> {
  const response = await http.delete<{ id: number; isDeleted: boolean }>(`/products/${id}`);
  return response.data;
}
