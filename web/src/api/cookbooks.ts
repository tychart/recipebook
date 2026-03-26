import type { Cookbook } from "../../types/types";
import { authFetch } from "./client";

const BASE_URL = "/api/cookbook";

/* =========================
   Get Single Cookbook
========================= */
export async function getCookbook(id: number): Promise<Cookbook> {
  const res = await authFetch(`${BASE_URL}/get/${id}`);
  if (!res.ok) throw new Error("Failed to fetch cookbook");
  return res.json();
}

/* =========================
   List Cookbooks by Owner
========================= */
export async function listCookbooks(ownerId: number): Promise<Cookbook[]> {
  const res = await authFetch(`${BASE_URL}/list?owner_id=${ownerId}`);
  if (!res.ok) throw new Error("Failed to fetch cookbooks");
  return res.json();
}

/* =========================
   Create Cookbook
========================= */
export async function createCookbook(data: Omit<Cookbook, "id" | "created_at">): Promise<{ message: string; cookbook: Cookbook }> {
  const res = await authFetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create cookbook");
  return res.json();
}

/* =========================
   Edit Cookbook
========================= */
export async function editCookbook(data: Cookbook): Promise<{ message: string; cookbook: Cookbook }> {
  const res = await authFetch(`${BASE_URL}/edit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to edit cookbook");
  return res.json();
}

/* =========================
   Delete Cookbook
========================= */
export async function deleteCookbook(id: number): Promise<{ message: string }> {
  const res = await authFetch(`${BASE_URL}/delete/${id}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to delete cookbook");
  return res.json();
}

/* =========================
   Share Cookbook
========================= */
export type CookbookRole = "viewer" | "contributor";

export interface ShareCookbookRequest {
  book_id: number;
  email: string;
  role: CookbookRole;
}

export async function shareCookbook(data: ShareCookbookRequest): Promise<{ message: string; book_id: number; user_id: number; role: CookbookRole }> {
  const res = await authFetch(`${BASE_URL}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to share cookbook");
  return res.json();
}

/* =========================
   Remove Cookbook User
========================= */
export interface RemoveCookbookUserRequest {
  book_id: number;
  user_id: number;
}

export async function removeCookbookUser(data: RemoveCookbookUserRequest): Promise<{ message: string }> {
  const res = await authFetch(`${BASE_URL}/remove-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to remove user from cookbook");
  return res.json();
}

