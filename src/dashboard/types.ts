export type KenanginAllocation = {
  operasionalAmount: number;
  maintenanceAmount: number;
  rndAmount: number;
  profitAmount: number;
};

export type RevenueSummary = {
  totalGrossRevenue: number;
  totalCafeShareRevenue: number;
  totalKenanginShareRevenue: number;
  totalTransactions: number;
  averageDailyTransactions: number;
  periodStart: string | null;
  periodEnd: string | null;
};

export type RevenueRecap = {
  summary: RevenueSummary;
  kenanginAllocation: KenanginAllocation;
};

export type CafeConfig = {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  cafeSharePercent: number;
  kenanginSharePercent: number;
  isActive?: boolean | null;
};

export type CafeRevenue = {
  cafeId: string;
  cafeName: string;
  location: string;
  status: string;
  totalGrossRevenue: number;
  totalCafeShareRevenue: number;
  totalKenanginShareRevenue: number;
  totalTransactions: number;
  cafeSharePercent?: number;
  kenanginSharePercent?: number;
};

export type Kiosk = {
  id?: string;
  cafeId?: string;
  kioskCode?: string;
  name?: string;
  status: "active" | "maintenance" | "offline" | null;
};

export type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  data: T;
  meta?: {
    currentPage?: number;
    perPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
};
