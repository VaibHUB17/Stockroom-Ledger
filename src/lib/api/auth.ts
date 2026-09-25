import { http } from "../http";
import { AuthUser } from "../types";

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await http.post<AuthUser>("/auth/login", credentials);
  return response.data;
}
