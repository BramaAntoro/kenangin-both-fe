import type { CafePackage } from "./types";

type CafePackageCardProps = {
  boothPackage: CafePackage;
  formatPrice: (price: number) => string;
  onEdit: (boothPackage: CafePackage) => void;
  onDelete: (boothPackage: CafePackage) => void;
};

export default function CafePackageCard({
  boothPackage,
  formatPrice,
  onEdit,
  onDelete,
}: CafePackageCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-[#E9E1E6] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{boothPackage.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#FF6B35]">
            {formatPrice(boothPackage.price)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            boothPackage.isActive !== false
              ? "bg-[#2E7D32]/10 text-[#2E7D32]"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {boothPackage.isActive !== false ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      {boothPackage.description && (
        <p className="mt-3 text-sm text-[#594139]">{boothPackage.description}</p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#E9E1E6] pt-4 text-sm">
        <dt className="text-[#594139]">Jepretan</dt>
        <dd className="text-right font-medium">{boothPackage.photoShotsCount} foto</dd>
        <dt className="text-[#594139]">Timer</dt>
        <dd className="text-right font-medium">
          {boothPackage.features?.timer_duration ?? 0} detik
        </dd>
        <dt className="text-[#594139]">Filter</dt>
        <dd className="text-right font-medium">
          {boothPackage.features?.allow_filters ? "Tersedia" : "Tidak tersedia"}
        </dd>
        <dt className="text-[#594139]">Cetakan</dt>
        <dd className="text-right font-medium">{boothPackage.printCopiesCount} salinan</dd>
      </dl>
      <div className="mt-auto flex gap-4 pt-5">
        <button
          type="button"
          onClick={() => onEdit(boothPackage)}
          className="text-sm font-semibold text-[#FF6B35] hover:underline"
        >
          Ubah
        </button>
        <button
          type="button"
          onClick={() => onDelete(boothPackage)}
          className="text-sm font-semibold text-[#D32F2F] hover:underline"
        >
          Hapus
        </button>
      </div>
    </article>
  );
}
