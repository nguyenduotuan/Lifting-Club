import { jsonBody, request } from "./client";
import type { User } from "../types/user";

export function login(username: string, password: string): Promise<User> {
  return request<User>("/auth/login", jsonBody({ username, password }));
}

export function register(username: string, displayName: string, password: string): Promise<User> {
  return request<User>("/auth/register", jsonBody({ username, display_name: displayName, password }));
}

export function getCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

export function logout(): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/logout", { method: "POST" });
}