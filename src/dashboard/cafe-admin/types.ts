export type CafeAdminView =
  | "dashboard"
  | "revenue"
  | "cafes"
  | "frames"
  | "packages"
  | "photo-booth"
  | "terminal-setup";

export type CafeRevenue = {
  summary: { totalCafeShareRevenue: number; totalTransactions: number };
};

export type CafeRevenueTransaction = {
  id: string;
  orderId: string;
  cafeName: string;
  grossAmount: number;
  cafeShareAmount: number;
  paymentType: string | null;
  paidAt: string | null;
};
