import { http } from "../http";
import { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const response = await http.get<Category[]>("/products/categories");
  return response.data;
}
