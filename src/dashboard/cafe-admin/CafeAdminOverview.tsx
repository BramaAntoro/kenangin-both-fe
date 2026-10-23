import { useEffect, useState } from "react";
import api from "../../lib/client/axios";
import type { CafeRevenue } from "./types";
import type { ApiEnvelope } from "../types";

type CafeAdminCafe = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  cafeSharePercent: number;
  kenanginSharePercent: number;
  isActive: boolean | null;
};

interface CafeAdminOverviewProps {
  revenue: CafeRevenue;
  onRevenueClick: () => void;
  onCafesClick: () => void;
}

const money = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default function CafeAdminOverview({
  revenue,
  onRevenueClick,
  onCafesClick,
}: CafeAdminOverviewProps) {
  const [cafes, setCafes] = useState<CafeAdminCafe[]>([]);
  const [cafesLoading, setCafesLoading] = useState(true);
  const [cafeTotal, setCafeTotal] = useState(0);
  const [cafePage, setCafePage] = useState(1);
  const [cafeTotalPages, setCafeTotalPages] = useState(1);
  const CAFE_LIMIT = 4;

  useEffect(() => {
    const controller = new AbortController();
    setCafesLoading(true);
    api
      .get<ApiEnvelope<{ cafes: CafeAdminCafe[] }>>(
        `/reports/revenue-recap/mine/cafes?page=${cafePage}&limit=${CAFE_LIMIT}`,
        { signal: controller.signal },
      )
      .then((res) => {
        if (res.data?.data?.cafes) {
          setCafes(res.data.data.cafes);
          setCafeTotal(Number(res.data.meta?.totalItems ?? 0));
          setCafeTotalPages(Number(res.data.meta?.totalPages ?? 1));
        }
      })
      .catch(() => {/* silent */})
      .finally(() => {
        if (!controller.signal.aborted) setCafesLoading(false);
      });
    return () => controller.abort();
  }, [cafePage]);

  return (
    <div className="flex w-full flex-col gap-8 pt-6">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ringkasan Kafe Anda
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#594139] sm:text-base">
          Pantau pendapatan bagian kafe dan transaksi yang sudah berhasil dibayarkan.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="flex flex-col justify-between rounded-3xl border border-[#E9E1E6] bg-white p-6 shadow-sm lg:col-span-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#FFF7F2] text-[#FF6B35]">
                <span className="material-symbols-outlined text-2xl">
                  account_balance_wallet
                </span>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#594139]">
                  Bagi Hasil Kafe
                </p>
                <p className="font-display text-lg font-semibold">
                  Total Pendapatan Anda
                </p>
              </div>
            </div>
            <p className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {money(revenue.summary.totalCafeShareRevenue)}
            </p>
            <p className="mt-1 text-sm text-[#594139]">
              Akumulasi bagian kafe dari transaksi yang sudah dibayar.
            </p>
          </div>
          <button
            type="button"
            onClick={onRevenueClick}
            className="mt-5 self-start text-sm font-semibold text-[#FF6B35] hover:underline cursor-pointer"
          >
            Lihat rincian transaksi ↓
          </button>
        </article>

        <article className="rounded-3xl border border-[#E9E1E6] bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#3FB6E0]/15 text-[#147fa3]">
              <span className="material-symbols-outlined text-2xl">
                receipt_long
              </span>
            </span>
            <span className="rounded-full bg-[#3FB6E0]/15 px-2.5 py-1 text-xs font-semibold text-[#147fa3]">
              Settlement
            </span>
          </div>
          <p className="mt-5 text-xs font-medium text-[#594139]">Transaksi berhasil</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {number(revenue.summary.totalTransactions)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#594139]">
            Pembayaran yang sudah terkonfirmasi.
          </p>
        </article>

        <article className="rounded-3xl border border-[#E9E1E6] bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#FFC845]/25 text-[#795900]">
              <span className="material-symbols-outlined text-2xl">
                storefront
              </span>
            </span>
            <span className="rounded-full bg-[#FFC845]/30 px-2.5 py-1 text-xs font-semibold text-[#795900]">
              Mitra
            </span>
          </div>
          <p className="mt-5 text-xs font-medium text-[#594139]">Kafe dikelola</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {number(cafeTotal)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#594139]">
            Lokasi yang terhubung ke akun Anda.
          </p>
        </article>
      </section>

      {/* Cafe list preview */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#FF6B35]" />
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                Kafe yang Anda kelola
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#594139]">
              {cafeTotal > 0 ? `${cafeTotal} lokasi terdaftar.` : "Lokasi mitra yang dapat Anda pantau."}
            </p>
          </div>
          {cafeTotal > 0 && (
            <button
              type="button"
              onClick={onCafesClick}
              className="flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#E85A2A]"
            >
              <span className="material-symbols-outlined text-base">
                open_in_full
              </span>
              Lihat Semua
            </button>
          )}
        </div>

        {cafesLoading ? (
          <div className="grid min-h-32 place-items-center rounded-3xl border border-[#E9E1E6] bg-white p-6 text-sm text-[#594139]">
            <div className="flex items-center gap-2">
              <div className="size-5 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
              Memuat daftar kafe…
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {cafes.map((cafe) => (
                <article
                  key={cafe.id}
                  className="rounded-2xl border border-[#E9E1E6] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFF7F2] text-[#FF6B35]">
                      <span className="material-symbols-outlined">local_cafe</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold truncate">
                          {cafe.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            cafe.isActive
                              ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cafe.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#594139] truncate">{cafe.address}</p>
                      <p className="mt-0.5 text-xs text-[#594139]">{cafe.phone}</p>
                    </div>
                  </div>
                </article>
              ))}
              {cafes.length === 0 && (
                <p className="rounded-2xl border border-[#E9E1E6] bg-white p-6 text-center text-sm text-[#594139] md:col-span-2">
                  Belum ada kafe yang terhubung ke akun ini.
                </p>
              )}
            </div>

            {/* Mini pagination */}
            {cafeTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[#594139]">
                  Halaman {cafePage} dari {cafeTotalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={cafePage <= 1}
                    onClick={() => setCafePage((p) => Math.max(1, p - 1))}
                    className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40 hover:bg-[#FFF7F2]"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(cafeTotalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCafePage(p)}
                      className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                        cafePage === p
                          ? "bg-[#FF6B35] text-white"
                          : "border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={cafePage >= cafeTotalPages}
                    onClick={() => setCafePage((p) => Math.min(cafeTotalPages, p + 1))}
                    className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40 hover:bg-[#FFF7F2]"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

            {/* CTA to full cafes view */}
            {cafeTotal > CAFE_LIMIT && (
              <button
                type="button"
                onClick={onCafesClick}
                className="mt-4 w-full rounded-2xl border border-[#FF6B35]/30 bg-[#FFF7F2] py-3 text-sm font-semibold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
              >
                Lihat semua {cafeTotal} kafe →
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
