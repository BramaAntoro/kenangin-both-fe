import { useEffect, useState } from "react";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";
import type { CafeRevenue, CafeRevenueTransaction } from "./types";

interface CafeAdminRevenueProps {
  revenue: CafeRevenue;
}

const money = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const dateTime = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date))
    : "—";

export default function CafeAdminRevenue({ revenue }: CafeAdminRevenueProps) {
  const [transactions, setTransactions] = useState<CafeRevenueTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 10;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .get<ApiEnvelope<{ transactions: CafeRevenueTransaction[] }>>(
          "/reports/revenue-recap/mine/transactions",
          { params: { page, limit }, signal: controller.signal },
        )
        .then((response) => {
          setTransactions(response.data.data.transactions);
          setMeta({
            currentPage: response.data.meta?.currentPage ?? page,
            totalPages: response.data.meta?.totalPages ?? 0,
            totalItems: response.data.meta?.totalItems ?? 0,
          });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError("Gagal memuat riwayat transaksi.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page]);

  const totalPages = Math.max(meta.totalPages, 1);

  return (
    <div className="flex w-full flex-col gap-5">
      <section>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#FF6B35]" />
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            Revenue Recap
          </h2>
        </div>
        <p className="mt-1 text-sm text-[#594139]">
          Riwayat transaksi yang sudah dibayar dari kafe Anda.
        </p>
      </section>
      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E9E1E6] p-5">
          <h3 className="font-display text-lg font-semibold">Riwayat transaksi</h3>
          <span className="text-sm font-semibold text-[#FF6B35]">
            {money(revenue.summary.totalCafeShareRevenue)}
          </span>
        </div>
        {error && <p role="alert" className="p-5 text-sm text-[#ba1a1a]">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#FFF7F2] text-xs uppercase tracking-wide text-[#594139]">
              <tr>
                {[
                  "Tanggal",
                  "Kafe",
                  "Order",
                  "Nilai transaksi",
                  "Bagian kafe",
                  "Pembayaran",
                ].map((label) => (
                  <th key={label} className="px-5 py-3 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E1E6]">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#FFF7F2]">
                  <td className="px-5 py-4 text-[#594139]">
                    {dateTime(transaction.paidAt)}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {transaction.cafeName}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#594139]">
                    {transaction.orderId}
                  </td>
                  <td className="px-5 py-4">{money(transaction.grossAmount)}</td>
                  <td className="px-5 py-4 font-semibold text-[#2E7D32]">
                    {money(transaction.cafeShareAmount)}
                  </td>
                  <td className="px-5 py-4">{transaction.paymentType ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && transactions.length === 0 && (
          <p className="p-8 text-center text-sm text-[#594139]">
            Belum ada transaksi yang sudah dibayar.
          </p>
        )}
        {loading && <p className="p-8 text-center text-sm text-[#594139]">Memuat transaksi…</p>}
        {!loading && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E9E1E6] bg-[#FFF7F2] p-5 sm:flex-row sm:px-6">
            <p className="text-xs text-[#594139]">
              Menampilkan {transactions.length} dari {meta.totalItems} transaksi
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              {Array.from({ length: Math.max(1, Math.min(totalPages, 5)) }, (_, index) => index + 1).map((pageNumber) => (
                <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${page === pageNumber ? "bg-[#FF6B35] text-white" : "border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2]"}`}>
                  {pageNumber}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
