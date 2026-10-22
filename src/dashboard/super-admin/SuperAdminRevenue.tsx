import type { Dispatch, SetStateAction } from "react";
import type { CafeConfig, CafeRevenue, RevenueRecap } from "../types";
import RevenueSummary from "./RevenueSummary";

interface SuperAdminRevenueProps {
  loading: boolean;
  totalGrossRevenue: number;
  totalCafeShareRevenue: number;
  totalKenanginShareRevenue: number;
  totalTransactions: number;
  activeKiosksCount: number;
  cafeCount: number;
  allocations: RevenueRecap["kenanginAllocation"] | undefined;
  totalAllocation: number;
  cafes: CafeRevenue[];
  cafeConfigs: Record<string, CafeConfig>;
  selectedCafeSum: { cafeShare: number; kenanginShare: number };
  cafePage: number;
  totalCafePages: number;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  setCafePage: Dispatch<SetStateAction<number>>;
}

const money = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default function SuperAdminRevenue(props: SuperAdminRevenueProps) {
  const { loading, totalGrossRevenue, totalCafeShareRevenue, totalKenanginShareRevenue, totalTransactions, activeKiosksCount, cafeCount, allocations, totalAllocation, cafes, cafeConfigs, selectedCafeSum, cafePage, totalCafePages, search, setSearch, setCafePage } = props;
  return <>
            <RevenueSummary
              loading={loading}
              totalGrossRevenue={totalGrossRevenue}
              totalCafeShareRevenue={totalCafeShareRevenue}
              totalKenanginShareRevenue={totalKenanginShareRevenue}
              totalTransactions={totalTransactions}
              activeKiosksCount={activeKiosksCount}
              cafeCount={cafeCount}
            />

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
  </>;
}

