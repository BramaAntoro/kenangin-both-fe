import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { AuthUser } from "../../auth/types";
import type { ApiEnvelope, CafeConfig, CafeRevenue, Kiosk, RevenueRecap } from "../types";
import CafeManagementDashboard from "./CafeManagementDashboard";
import CafeAdminManagementDashboard from "./CafeAdminManagementDashboard";
import KioskManagementDashboard from "./KioskManagementDashboard";
import SystemSettingsDashboard from "./SystemSettingsDashboard";
import FrameManagementDashboard from "./FrameManagementDashboard";
import SuperAdminSidebar, { type SuperAdminDashboardView } from "./SuperAdminSidebar";
import SuperAdminRevenue from "./SuperAdminRevenue";

interface SuperAdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const [recap, setRecap] = useState<RevenueRecap | null>(null);
  const [cafes, setCafes] = useState<CafeRevenue[]>([]);
  const [cafeConfigs, setCafeConfigs] = useState<Record<string, CafeConfig>>({});
  const [cafeCount, setCafeCount] = useState<number>(0);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Search for Cafe Revenue (strictly supported by API)
  const [cafePage, setCafePage] = useState(1);
  const [totalCafePages, setTotalCafePages] = useState(1);
  const [search, setSearch] = useState("");

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [dashboardView, setDashboardView] = useState<SuperAdminDashboardView>("revenue");

  // Initial load for revenue recap, cafes revenue, kiosks, and cafe configs
  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.get<ApiEnvelope<RevenueRecap>>("/reports/revenue-recap", { signal: controller.signal }),
      api.get<ApiEnvelope<{ cafes: CafeRevenue[] }>>("/reports/revenue-recap/cafe?page=1&limit=6", {
        signal: controller.signal,
      }),
      api.get<ApiEnvelope<Record<string, Kiosk[]>>>("/kiosks", { signal: controller.signal }),
      api.get<ApiEnvelope<{ cafes: Record<string, CafeConfig> }>>("/cafes", { signal: controller.signal }).catch(() => null),
    ])
      .then(([recapRes, cafeRes, kioskRes, cafesConfigRes]) => {
        if (recapRes.data?.data) {
          setRecap(recapRes.data.data);
        }

        if (cafeRes.data?.data?.cafes) {
          setCafes(cafeRes.data.data.cafes);
          setCafeCount(Number(cafeRes.data.meta?.totalItems ?? cafeRes.data.data.cafes.length));
          setTotalCafePages(Number(cafeRes.data.meta?.totalPages ?? 1));
        }

        if (kioskRes.data?.data) {
          const flatKiosks = Object.values(kioskRes.data.data).flat();
          setKiosks(flatKiosks);
        }

        if (cafesConfigRes?.data?.data?.cafes) {
          const rawCafes = cafesConfigRes.data.data.cafes;
          const mapped: Record<string, CafeConfig> = {};
          Object.values(rawCafes).forEach((c) => {
            if (c.id) mapped[c.id] = c;
            if (c.name) mapped[c.name.toLowerCase()] = c;
          });
          setCafeConfigs(mapped);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && isAxiosError<{ message?: string }>(err)) {
          setError(err.response?.data?.message ?? "Gagal memuat data dari server.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Search & pagination effect (strictly queries the backend API)
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      api
        .get<ApiEnvelope<{ cafes: CafeRevenue[] }>>(
          `/reports/revenue-recap/cafe?page=${cafePage}&limit=6&search=${encodeURIComponent(search.trim())}`,
          { signal: controller.signal },
        )
        .then((res) => {
          if (res.data?.data?.cafes) {
            setCafes(res.data.data.cafes);
            setCafeCount(Number(res.data.meta?.totalItems ?? res.data.data.cafes.length));
            setTotalCafePages(Number(res.data.meta?.totalPages ?? 1));
          }
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted && isAxiosError<{ message?: string }>(err)) {
            setError(err.response?.data?.message ?? "Gagal mencari data mitra kafe.");
          }
        });
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cafePage, search]);

  const summary = recap?.summary;
  const allocations = recap?.kenanginAllocation;

  const totalGrossRevenue = summary?.totalGrossRevenue ?? 0;
  const totalCafeShareRevenue = summary?.totalCafeShareRevenue ?? 0;
  const totalKenanginShareRevenue = summary?.totalKenanginShareRevenue ?? 0;
  const totalTransactions = summary?.totalTransactions ?? 0;

  const activeKiosksCount = kiosks.filter((k) => k.status === "active").length;

  const totalAllocation = allocations
    ? allocations.operasionalAmount +
      allocations.maintenanceAmount +
      allocations.rndAmount +
      allocations.profitAmount
    : 0;

  const selectedCafeSum = useMemo(() => {
    return cafes.reduce(
      (acc, curr) => {
        acc.cafeShare += curr.totalCafeShareRevenue;
        acc.kenanginShare += curr.totalKenanginShareRevenue;
        return acc;
      },
      { cafeShare: 0, kenanginShare: 0 }
    );
  }, [cafes]);

  return (
    <div className="bg-[#FFF7F2] font-sans text-[#241435] antialiased min-h-screen">
      <SuperAdminSidebar view={dashboardView} isOpen={isMobileNavOpen} onNavigate={(view) => {
        setDashboardView(view);
        setIsMobileNavOpen(false);
      }} />

      {/* Main Page Content Wrapper */}
      <div className="lg:pl-72">
        {/* Top Fixed Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#FFF7F2]/90 backdrop-blur-md border-b border-[#E9E1E6] z-40 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl bg-white text-[#241435] hover:bg-[#f7e9ff] transition-colors border border-[#E9E1E6]"
              aria-label="Toggle Navigation"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#594139]">
              <span className="font-semibold text-[#FF6B35]">Kenangin</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-[#241435] font-medium">{dashboardView === "cafes" ? "Kelola Kafe" : dashboardView === "cafe-admins" ? "Kelola Admin Kafe" : dashboardView === "kiosks" ? "Kelola Kiosk" : dashboardView === "system-settings" ? "Pengaturan Sistem" : dashboardView === "frames" ? "Kelola Frame" : "Ringkasan Finansial & Bagi Hasil"}</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-[#241435] leading-tight">{user.email ?? user.name}</span>
                <span className="text-[11px] text-[#594139]">{user.role}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Keluar Akun"
                className="p-2 rounded-xl text-[#594139] hover:text-[#D32F2F] hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full pt-16 px-4 lg:px-8 bg-[#FFF7F2] min-h-screen">
          {dashboardView === "cafes" ? (
            <CafeManagementDashboard />
          ) : dashboardView === "cafe-admins" ? (
            <CafeAdminManagementDashboard />
          ) : dashboardView === "kiosks" ? (
            <KioskManagementDashboard />
          ) : dashboardView === "system-settings" ? (
            <SystemSettingsDashboard />
          ) : dashboardView === "frames" ? (
            <FrameManagementDashboard />
          ) : (
          <div className="flex flex-col w-full pb-16 pt-6">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-sm flex items-center gap-2 border border-[#ba1a1a]/20">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            <SuperAdminRevenue
              loading={loading}
              totalGrossRevenue={totalGrossRevenue}
              totalCafeShareRevenue={totalCafeShareRevenue}
              totalKenanginShareRevenue={totalKenanginShareRevenue}
              totalTransactions={totalTransactions}
              activeKiosksCount={activeKiosksCount}
              cafeCount={cafeCount}
              allocations={allocations}
              totalAllocation={totalAllocation}
              cafes={cafes}
              cafeConfigs={cafeConfigs}
              selectedCafeSum={selectedCafeSum}
              cafePage={cafePage}
              totalCafePages={totalCafePages}
              search={search}
              setSearch={setSearch}
              setCafePage={setCafePage}
            />
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
