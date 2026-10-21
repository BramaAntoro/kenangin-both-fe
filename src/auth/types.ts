export type UserRole = "super_admin" | "cafe_admin" | string;

export type AuthUser = {
  id?: string;
  email?: string;
  name: string;
  role: UserRole;
};
