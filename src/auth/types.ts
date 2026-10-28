export type UserRole = "super_admin" | "cafe_admin" | string;

export type AuthUser = {
  id?: string;
  email?: string;
  accountNumber?: string | null;
  bankName?: string | null;
  name: string;
  role: UserRole;
};
