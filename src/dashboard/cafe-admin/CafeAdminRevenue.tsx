import type { CafeRevenue } from "./types";

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
          100 transaksi terbaru yang sudah dibayar dari kafe Anda.
        </p>
      </section>
      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E9E1E6] p-5">
          <h3 className="font-display text-lg font-semibold">Riwayat transaksi</h3>
          <span className="text-sm font-semibold text-[#FF6B35]">
            {money(revenue.summary.totalCafeShareRevenue)}
          </span>
        </div>
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
              {revenue.transactions.map((transaction) => (
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
        {revenue.transactions.length === 0 && (
          <p className="p-8 text-center text-sm text-[#594139]">
            Belum ada transaksi yang sudah dibayar.
          </p>
        )}
      </section>
    </div>
  );
}
