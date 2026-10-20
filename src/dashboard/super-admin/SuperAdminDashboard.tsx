import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { AuthUser } from "../../auth/types";
import type { ApiEnvelope, CafeConfig, CafeRevenue, Kiosk, RevenueRecap } from "../types";
import CafeManagementDashboard from "./CafeManagementDashboard";
import CafeAdminManagementDashboard from "./CafeAdminManagementDashboard";
import KioskManagementDashboard from "./KioskManagementDashboard";

const money = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);

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
  const [dashboardView, setDashboardView] = useState<"revenue" | "cafes" | "cafe-admins" | "kiosks">("revenue");

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
      {/* Sidebar Navigation - Warm Midnight Plum */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#241435] text-[#fff7ff] z-50 flex flex-col justify-between p-6 shadow-md transition-transform duration-300 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="px-1 pt-1">
            <img src="/lockups/lockup-removebg-preview.webp" alt="Kenangin" className="w-40" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-2">
            <a
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                dashboardView === "revenue" ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#fff7ff] hover:bg-white/10"
              }`}
              href="#revenue"
              onClick={() => {
                setDashboardView("revenue");
                setIsMobileNavOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-xl">payments</span>
              <span className="text-sm">Revenue &amp; Bagi Hasil</span>
            </a>
            <button
              type="button"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                dashboardView === "cafes" ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#fff7ff] hover:bg-white/10"
              }`}
              onClick={() => {
                setDashboardView("cafes");
                setIsMobileNavOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-xl">storefront</span>
              <span className="text-sm">Kelola Kafe</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                dashboardView === "cafe-admins" ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#fff7ff] hover:bg-white/10"
              }`}
              onClick={() => {
                setDashboardView("cafe-admins");
                setIsMobileNavOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
              <span className="text-sm">Kelola Admin Kafe</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                dashboardView === "kiosks" ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#fff7ff] hover:bg-white/10"
              }`}
              onClick={() => {
                setDashboardView("kiosks");
                setIsMobileNavOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
              <span className="text-sm">Kelola Kiosk</span>
            </button>
          </nav>
        </div>
      </aside>

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
              <span className="text-[#241435] font-medium">{dashboardView === "cafes" ? "Kelola Kafe" : dashboardView === "cafe-admins" ? "Kelola Admin Kafe" : dashboardView === "kiosks" ? "Kelola Kiosk" : "Ringkasan Finansial & Bagi Hasil"}</span>
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
          ) : (
          <div className="flex flex-col w-full pb-16 pt-6">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-sm flex items-center gap-2 border border-[#ba1a1a]/20">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: dashboard#revenue (Hero GMV & Bagi Hasil) */}
            <section id="revenue" className="mb-8">
              {/* Header Title */}
              <div className="mb-6">
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl text-[#241435] font-semibold tracking-tight">
                    Ringkasan Pendapatan &amp; Bagi Hasil
                  </h1>
                  <p className="font-sans text-sm sm:text-base text-[#594139] mt-1 leading-relaxed max-w-2xl">
                    Pantau akumulasi pendapatan dari transaksi sesi foto seluruh booth kiosk dengan persentase bagi hasil dinamis sesuai kontrak masing-masing kafe.
                  </p>
                </div>
              </div>

              {/* Loading State or Bento Cards */}
              {loading ? (
                <div className="grid min-h-64 place-items-center rounded-3xl bg-white p-8 border border-[#E9E1E6] shadow-xs text-[#594139]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-3 border-[#FF6B35] border-t-transparent animate-spin"></div>
                    <span className="text-sm font-medium">Memuat data revenue dari server…</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Card 1: Total Gross Merchandise Value (GMV) */}
                  <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-11 h-11 rounded-2xl bg-[#FFF7F2] flex items-center justify-center text-[#FF6B35]">
                            <span className="material-symbols-outlined text-2xl">point_of_sale</span>
                          </span>
                          <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-[#594139]">
                              Gross Merchandise Value (GMV)
                            </span>
                            <p className="font-display text-lg text-[#241435] font-semibold">Total Nilai Transaksi</p>
                          </div>
                        </div>
                      </div>

                      <div className="my-2">
                        <span className="font-display text-3xl sm:text-4xl text-[#241435] font-semibold tracking-tight">
                          {money(totalGrossRevenue)}
                        </span>
                        <p className="text-xs sm:text-sm text-[#594139] mt-1">
                          Dari total <strong>{number(totalTransactions)} sesi foto</strong> di {activeKiosksCount} kiosk aktif se-Indonesia.
                        </p>
                      </div>

                      {/* Visual Breakdown Progress Bar */}
                      <div className="mt-5 pt-3 border-t border-[#E9E1E6]/60">
                        <div className="flex justify-between items-center text-xs mb-2 flex-wrap gap-2">
                          <span className="text-[#795900] font-semibold flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#FFC845]"></span>
                            Bagian Mitra Kafe: {money(totalCafeShareRevenue)}
                          </span>
                          <span className="text-[#ab3500] font-semibold flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#FF6B35]"></span>
                            Bagian Kenangin: {money(totalKenanginShareRevenue)}
                          </span>
                        </div>
                        <div className="w-full h-3.5 bg-[#fbf0ff] rounded-full overflow-hidden flex shadow-inner">
                          <div
                            className="h-full bg-[#FFC845] transition-all duration-700"
                            style={{
                              width:
                                totalGrossRevenue > 0
                                  ? `${(totalCafeShareRevenue / totalGrossRevenue) * 100}%`
                                  : "50%",
                            }}
                          ></div>
                          <div
                            className="h-full bg-[#FF6B35] transition-all duration-700"
                            style={{
                              width:
                                totalGrossRevenue > 0
                                  ? `${(totalKenanginShareRevenue / totalGrossRevenue) * 100}%`
                                  : "50%",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Bagi Hasil Mitra Kafe */}
                  <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#ffdf9e]/40 text-[#795900] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">storefront</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#FFC845]/30 text-[#795900] text-xs font-semibold">
                          Mitra Kafe
                        </span>
                      </div>
                      <span className="text-xs text-[#594139] font-medium">Total Bagian Mitra Kafe</span>
                      <div className="font-display text-2xl sm:text-3xl text-[#241435] font-semibold tracking-tight mt-1">
                        {money(totalCafeShareRevenue)}
                      </div>
                      <p className="text-xs text-[#594139] mt-2 leading-relaxed">
                        Akumulasi bagian mitra dari seluruh transaksi selesai, dihitung otomatis sesuai persentase kontrak tiap kafe.
                      </p>
                    </div>
                    <div className="bg-[#FFF7F2] p-3 rounded-2xl flex items-center justify-between mt-5 border border-[#E9E1E6]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#2E7D32] text-base">check_circle</span>
                        <span className="text-xs font-medium text-[#241435]">{cafeCount} Mitra Terdaftar</span>
                      </div>
                      <a href="#mitra" className="text-xs font-semibold text-[#FF6B35] hover:underline">
                        Lihat Kafe
                      </a>
                    </div>
                  </div>

                  {/* Card 3: Porsi Platform Kenangin */}
                  <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#ffdbd0] text-[#FF6B35] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#FF6B35]/15 text-[#ab3500] text-xs font-semibold">
                          Platform
                        </span>
                      </div>
                      <span className="text-xs text-[#594139] font-medium">Total Bagian Kenangin</span>
                      <div className="font-display text-2xl sm:text-3xl text-[#FF6B35] font-semibold tracking-tight mt-1">
                        {money(totalKenanginShareRevenue)}
                      </div>
                      <p className="text-xs text-[#594139] mt-2 leading-relaxed">
                        Total pendapatan bruto Kenangin untuk operasional sistem, cadangan suku cadang booth, dan laba bersih.
                      </p>
                    </div>
                    <div className="bg-[#FFF7F2] p-3 rounded-2xl flex items-center justify-between mt-5 border border-[#E9E1E6]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#3FB6E0] text-base">pie_chart</span>
                        <span className="text-xs font-medium text-[#241435]">4 Pos Alokasi</span>
                      </div>
                      <a href="#alokasi" className="text-xs font-semibold text-[#FF6B35] hover:underline">
                        Lihat Rincian
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: dashboard#alokasi (Internal 4 Allocations Grid) */}
            <section id="alokasi" className="mb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]"></span>
                    <h2 className="font-display text-xl sm:text-2xl text-[#241435] font-semibold">
                      Alokasi Finansial Internal Kenangin ({money(totalKenanginShareRevenue)})
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#594139] mt-1">
                    Distribusi anggaran operasional, cadangan suku cadang, riset frame, dan keuntungan bersih Kenangin.
                  </p>
                </div>
                <span className="text-xs text-[#594139] px-3 py-1 rounded-full bg-white border border-[#E9E1E6] self-start md:self-auto font-medium">
                  Alokasi internal Kenangin dari transaksi settlement
                </span>
              </div>

              {/* 4 Cards Grid - sourced directly from API kenanginAllocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Pos 1: Operasional Platform */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF7F2] flex items-center justify-center text-[#FF6B35] mb-3">
                      <span className="material-symbols-outlined text-xl">settings_suggest</span>
                    </div>
                    <span className="text-xs text-[#594139] font-medium">Operasional Platform</span>
                    <div className="font-display text-2xl text-[#241435] font-semibold mt-1 mb-2">
                      {money(allocations?.operasionalAmount ?? 0)}
                    </div>
                    <p className="text-xs text-[#594139] leading-relaxed">
                      Biaya infrastruktur server cloud, konsumabel kertas &amp; ribbon foto, serta pemeliharaan sistem.
                    </p>
                  </div>
                  <div className="mt-5 pt-2">
                    <div className="w-full h-1.5 rounded-full bg-[#FFF7F2] overflow-hidden">
                      <div
                        className="h-full bg-[#FF6B35] rounded-full"
                        style={{
                          width: `${
                            totalAllocation > 0
                              ? Math.min(((allocations?.operasionalAmount ?? 0) / totalAllocation) * 100, 100)
                              : 25
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Pos 2: Maintenance & Hardware */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#ffdf9e]/30 flex items-center justify-center text-[#795900] mb-3">
                      <span className="material-symbols-outlined text-xl">build_circle</span>
                    </div>
                    <span className="text-xs text-[#594139] font-medium">Perawatan &amp; Hardware</span>
                    <div className="font-display text-2xl text-[#241435] font-semibold mt-1 mb-2">
                      {money(allocations?.maintenanceAmount ?? 0)}
                    </div>
                    <p className="text-xs text-[#594139] leading-relaxed">
                      Cadangan biaya penggantian suku cadang printer, kamera DSLR, layar kiosk, dan teknisi on-site.
                    </p>
                  </div>
                  <div className="mt-5 pt-2">
                    <div className="w-full h-1.5 rounded-full bg-[#FFF7F2] overflow-hidden">
                      <div
                        className="h-full bg-[#FFC845] rounded-full"
                        style={{
                          width: `${
                            totalAllocation > 0
                              ? Math.min(((allocations?.maintenanceAmount ?? 0) / totalAllocation) * 100, 100)
                              : 25
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Pos 3: Riset & Desain Frame */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E9E1E6] flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#3FB6E0]/15 flex items-center justify-center text-[#006783] mb-3">
                      <span className="material-symbols-outlined text-xl">palette</span>
                    </div>
                    <span className="text-xs text-[#594139] font-medium">Riset &amp; Pengembangan</span>
                    <div className="font-display text-2xl text-[#241435] font-semibold mt-1 mb-2">
                      {money(allocations?.rndAmount ?? 0)}
                    </div>
                    <p className="text-xs text-[#594139] leading-relaxed">
                      Pengembangan fitur software web booth, perancangan desain template frame tematik, dan aset visual.
                    </p>
                  </div>
                  <div className="mt-5 pt-2">
                    <div className="w-full h-1.5 rounded-full bg-[#FFF7F2] overflow-hidden">
                      <div
                        className="h-full bg-[#3FB6E0] rounded-full"
                        style={{
                          width: `${
                            totalAllocation > 0
                              ? Math.min(((allocations?.rndAmount ?? 0) / totalAllocation) * 100, 100)
                              : 25
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Pos 4: Keuntungan Bersih */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E9E1E6] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2E7D32]"></div>
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32] mb-3">
                      <span className="material-symbols-outlined text-xl">savings</span>
                    </div>
                    <span className="text-xs text-[#594139] font-medium">Keuntungan Bersih</span>
                    <div className="font-display text-2xl text-[#2E7D32] font-semibold mt-1 mb-2">
                      {money(allocations?.profitAmount ?? 0)}
                    </div>
                    <p className="text-xs text-[#594139] leading-relaxed">
                      Laba bersih platform Kenangin dari seluruh transaksi booth yang telah terkonfirmasi settlement.
                    </p>
                  </div>
                  <div className="mt-5 pt-2">
                    <div className="w-full h-1.5 rounded-full bg-[#FFF7F2] overflow-hidden">
                      <div
                        className="h-full bg-[#2E7D32] rounded-full"
                        style={{
                          width: `${
                            totalAllocation > 0
                              ? Math.min(((allocations?.profitAmount ?? 0) / totalAllocation) * 100, 100)
                              : 25
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: dashboard#mitra (Tabel Bagi Hasil Dinamis per Kafe) */}
            <section id="mitra" className="bg-white rounded-3xl shadow-xs border border-[#E9E1E6] flex flex-col overflow-hidden">
              {/* Table Header & Search Bar */}
              <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E9E1E6]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl sm:text-2xl text-[#241435] font-semibold">
                      Daftar Mitra Kafe &amp; Bagi Hasil Dinamis
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFC845]/30 text-[#795900] text-xs font-semibold">
                      {cafeCount} Mitra Terdaftar
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#594139]">
                    Setiap mitra kafe memiliki persentase pembagian hasil yang disesuaikan dalam kontrak kerja sama.
                  </p>
                </div>

                {/* Real-time API Search */}
                <div className="relative flex items-center min-w-[280px]">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#594139] text-lg">search</span>
                  <input
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#FFF7F2] text-[#241435] text-xs sm:text-sm focus:outline-none border border-[#E9E1E6] focus:border-[#FF6B35] transition-colors"
                    placeholder="Cari nama kafe atau alamat..."
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCafePage(1);
                    }}
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139] border-b border-[#E9E1E6]">
                      <th className="py-4 px-6 font-semibold">Mitra Kafe &amp; Lokasi</th>
                      <th className="py-4 px-4 font-semibold text-center">Status</th>
                      <th className="py-4 px-4 font-semibold text-center">Skema Bagi Hasil</th>
                      <th className="py-4 px-4 font-semibold text-right">Total Sesi</th>
                      <th className="py-4 px-4 font-semibold text-right">Total GMV</th>
                      <th className="py-4 px-4 font-semibold text-right text-[#795900]">Bagian Kafe</th>
                      <th className="py-4 px-6 font-semibold text-right text-[#ab3500]">Bagian Kenangin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E1E6]/60 text-xs sm:text-sm text-[#241435]">
                    {cafes.map((cafe, index) => {
                      const config = cafeConfigs[cafe.cafeId] || cafeConfigs[cafe.cafeName.toLowerCase()];
                      const cafeSharePct = config
                        ? config.cafeSharePercent
                        : cafe.totalGrossRevenue > 0
                        ? Math.round((cafe.totalCafeShareRevenue / cafe.totalGrossRevenue) * 100)
                        : null;
                      const kenanginSharePct = config
                        ? config.kenanginSharePercent
                        : cafe.totalGrossRevenue > 0 && cafeSharePct !== null
                        ? 100 - cafeSharePct
                        : null;

                      return (
                        <tr
                          key={cafe.cafeId}
                          className={`hover:bg-[#FFF7F2]/60 transition-colors ${
                            index % 2 === 1 ? "bg-[#FFF7F2]/25" : ""
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-[#FFF7F2] border border-[#E9E1E6] flex items-center justify-center text-[#FF6B35] shrink-0">
                                <span className="material-symbols-outlined text-xl">local_cafe</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-[#241435]">{cafe.cafeName}</span>
                                <span className="text-xs text-[#594139] line-clamp-1 max-w-sm">
                                  {cafe.location || "Alamat belum tercatat"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                cafe.status === "active"
                                  ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  cafe.status === "active" ? "bg-[#2E7D32] animate-pulse" : "bg-gray-400"
                                }`}
                              ></span>
                              {cafe.status === "active" ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {cafeSharePct !== null && kenanginSharePct !== null ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF7F2] border border-[#E9E1E6] text-xs font-medium">
                                <span className="font-semibold text-[#795900]">{cafeSharePct}% Kafe</span>
                                <span className="text-[#E9E1E6]">/</span>
                                <span className="font-semibold text-[#FF6B35]">{kenanginSharePct}% Kenangin</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[#594139] font-medium">Dinamis</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right font-medium">{number(cafe.totalTransactions)} sesi</td>
                          <td className="py-4 px-4 text-right font-semibold">{money(cafe.totalGrossRevenue)}</td>
                          <td className="py-4 px-4 text-right font-semibold text-[#795900]">
                            {money(cafe.totalCafeShareRevenue)}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-[#FF6B35]">
                            {money(cafe.totalKenanginShareRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                    {cafes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 px-6 text-center text-[#594139] text-sm">
                          Tidak ada data mitra kafe yang sesuai dengan kata kunci pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary & Pagination */}
              <div className="p-6 bg-[#FFF7F2] border-t border-[#E9E1E6] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF6B35] text-lg">account_balance</span>
                  <div>
                    <strong>Total Halaman Ini ({cafes.length} Kafe):</strong>
                    <span className="text-[#795900] ml-1 font-semibold">
                      {money(selectedCafeSum.cafeShare)} Bagian Kafe
                    </span>
                    <span className="mx-1 text-[#E9E1E6]">|</span>
                    <span className="text-[#FF6B35] font-semibold">
                      {money(selectedCafeSum.kenanginShare)} Bagian Kenangin
                    </span>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#594139]">
                    Halaman {cafePage} dari {totalCafePages} ({cafeCount} mitra)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="w-8 h-8 rounded-xl bg-white hover:bg-[#fbf0ff] flex items-center justify-center text-[#241435] border border-[#E9E1E6] shadow-2xs disabled:opacity-40"
                      disabled={cafePage <= 1}
                      onClick={() => setCafePage((p) => Math.max(1, p - 1))}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(totalCafePages, 5) }, (_, idx) => idx + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCafePage(p)}
                        className={`w-8 h-8 rounded-xl font-semibold text-xs flex items-center justify-center transition-all ${
                          cafePage === p
                            ? "bg-[#FF6B35] text-white shadow-xs"
                            : "bg-white hover:bg-[#fbf0ff] text-[#241435] border border-[#E9E1E6]"
                        }`}
                        type="button"
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="w-8 h-8 rounded-xl bg-white hover:bg-[#fbf0ff] flex items-center justify-center text-[#241435] border border-[#E9E1E6] shadow-2xs disabled:opacity-40"
                      disabled={cafePage >= totalCafePages}
                      onClick={() => setCafePage((p) => Math.min(totalCafePages, p + 1))}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
