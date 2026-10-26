import type { SetStateAction } from "react";
import CafePackageCard from "./CafePackageCard";
import type { Cafe, CafePackage } from "./types";

type CafePackageListProps = {
  cafe: Cafe;
  packages: CafePackage[];
  page: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  onCreate: () => void;
  onEdit: (boothPackage: CafePackage) => void;
  onDelete: (boothPackage: CafePackage) => void;
  onPageChange: (page: SetStateAction<number>) => void;
  formatPrice: (price: number) => string;
};

export default function CafePackageList({
  cafe,
  packages,
  page,
  totalItems,
  totalPages,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onPageChange,
  formatPrice,
}: CafePackageListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E9E1E6] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9E1E6] p-5">
        <div>
          <h2 className="font-display text-xl font-semibold">{cafe.name}</h2>
          <p className="mt-1 text-sm text-[#594139]">{totalItems} paket terdaftar</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Tambah Paket
        </button>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {packages.map((boothPackage) => (
          <CafePackageCard
            key={boothPackage.id}
            boothPackage={boothPackage}
            formatPrice={formatPrice}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {packages.length === 0 && (
          <p className="py-10 text-center text-sm text-[#594139] sm:col-span-2 xl:col-span-3">
            Belum ada paket foto di lokasi ini.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E9E1E6] px-5 py-4">
          <p className="text-sm text-[#594139]">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() =>
                onPageChange((current) => Math.max(1, current - 1))
              }
              className="rounded-lg border border-[#E9E1E6] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                onPageChange((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-lg border border-[#E9E1E6] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
