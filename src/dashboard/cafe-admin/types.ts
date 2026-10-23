export type CafeAdminView = "dashboard" | "revenue" | "cafes";

export type CafeRevenue = {
  summary: { totalCafeShareRevenue: number; totalTransactions: number };
  transactions: {
    id: string;
    orderId: string;
    cafeName: string;
    grossAmount: number;
    cafeShareAmount: number;
    paymentType: string | null;
    paidAt: string | null;
  }[];
  cafes: { id: string; name: string; address: string }[];
};
