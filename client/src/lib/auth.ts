import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  department?: string;
}

export interface LoginRequest {
  id: string;
  password: string;
}

export async function login(credentials: LoginRequest): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/login", credentials);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/logout");
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest("GET", "/api/me");
  return response.json();
}
