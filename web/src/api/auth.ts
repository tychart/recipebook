import type { User } from "../../types/types";

const BASE_URL = "http://localhost:8000/api/auth";


/* =========================
   Register
========================= */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to register");
  return res.json();
}

/* =========================
   Login
========================= */
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to login");
  return res.json();
}

/* =========================
   Logout
========================= */
export async function logout(token: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to logout");
  return res.json();
}

/* =========================
   Get current user
========================= */
export async function getCurrentUser(token: string): Promise<{ user: User }> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}