import type { Cookbook, CookbookRole } from "../../types/types";

export function isWritableCookbookRole(role?: CookbookRole | Cookbook["current_user_role"]) {
  return role === "owner" || role === "contributor";
}

export function getWritableCookbooks(cookbooks: Cookbook[]) {
  return cookbooks.filter((cookbook) => isWritableCookbookRole(cookbook.current_user_role));
}
