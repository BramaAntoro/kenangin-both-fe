import type { CafeRevenue } from "./types";

interface CafeAdminOverviewProps {
  revenue: CafeRevenue;
  onRevenueClick: () => void;
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
}: CafeAdminOverviewProps) {
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
            {number(revenue.cafes.length)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#594139]">
            Lokasi yang terhubung ke akun Anda.
          </p>
        </article>
      </section>
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#FF6B35]" />
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Kafe yang Anda kelola
            </h2>
          </div>
          <p className="mt-1 text-sm text-[#594139]">
            Lokasi mitra yang dapat Anda pantau.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {revenue.cafes.map((cafe) => (
            <article
              key={cafe.id}
              className="rounded-2xl border border-[#E9E1E6] bg-white p-5 shadow-sm"
            >
              <div className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFF7F2] text-[#FF6B35]">
                  <span className="material-symbols-outlined">local_cafe</span>
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{cafe.name}</h3>
                  <p className="mt-1 text-sm text-[#594139]">{cafe.address}</p>
                </div>
              </div>
            </article>
          ))}
          {revenue.cafes.length === 0 && (
            <p className="rounded-2xl border border-[#E9E1E6] bg-white p-6 text-center text-sm text-[#594139] md:col-span-2">
              Belum ada kafe yang terhubung ke akun ini.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
