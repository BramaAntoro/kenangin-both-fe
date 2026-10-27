import type { BoothPackage } from "./types";

type PackageSelectionStepProps = {
  packages: BoothPackage[];
  selectedPackageId: string;
  loading: boolean;
  canPay: boolean;
  formatPrice: (price: number) => string;
  onSelect: (packageId: string) => void;
  onStartPayment: () => void;
};

export default function PackageSelectionStep({
  packages,
  selectedPackageId,
  loading,
  canPay,
  formatPrice,
  onSelect,
  onStartPayment,
}: PackageSelectionStepProps) {
  return (
    <section className="grid gap-5 rounded-3xl border border-[#E9E1E6] bg-white p-5 shadow-sm sm:p-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF6B35]">
          Mulai dari sini
        </span>
        <h2 className="mt-1 font-display text-2xl font-semibold">Pilih paket foto</h2>
        <p className="mt-1 text-sm text-[#594139]">Pilih yang paling pas untuk momenmu.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {packages.map((item, index) => {
          const features = item.features;
          const benefits = [
            { icon: "photo_camera", label: `${item.photoShotsCount} jepretan` },
            { icon: "timer", label: `${features?.timer_duration ?? 0} detik`, available: (features?.timer_duration ?? 0) > 0 },
            { icon: "replay", label: `${features?.retake_limit ?? 0} retake`, available: (features?.retake_limit ?? 0) > 0 },
            { icon: "print", label: `${item.printCopiesCount} cetak` },
            { icon: "tune", label: "Filter", available: features?.allow_filters === true },
            { icon: "mood", label: "Emoji", available: features?.allow_emoji === true },
            { icon: "title", label: "Teks kustom", available: features?.allow_custom_text === true },
          ];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedPackageId === item.id ? "border-[#FF6B35] bg-[#FFFCFA] ring-2 ring-[#FF6B35]/15" : "border-[#E9E1E6] hover:border-[#FFC845]"}`}
            >
              <span className={`absolute inset-x-0 top-0 h-1.5 ${index % 3 === 0 ? "bg-[#FF6B35]" : index % 3 === 1 ? "bg-[#FFC845]" : "bg-[#3FB6E0]"}`} />
              <div className="flex items-start justify-between gap-3 pt-1">
                <span className="grid size-11 place-items-center rounded-xl bg-[#FFF7F2] text-[#FF6B35]">
                  <span className="material-symbols-outlined">photo_library</span>
                </span>
                {selectedPackageId === item.id && (
                  <span className="rounded-full bg-[#2E7D32]/10 px-2.5 py-1 text-xs font-bold text-[#2E7D32]">
                    Dipilih
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-[#241435]">{item.name}</h3>
              <p className="mt-1 border-b border-dashed border-[#E9E1E6] pb-4 font-display text-2xl font-semibold text-[#FF6B35]">
                {formatPrice(item.price)}
              </p>
              <ul className="mt-4 grid gap-2">
                {benefits.map((benefit) => (
                  <li
                    key={benefit.label}
                    className={`flex items-center gap-2 text-sm ${benefit.available === false ? "text-[#594139]/45 line-through" : "text-[#241435]"}`}
                  >
                    <span className={`material-symbols-outlined text-lg ${benefit.available === false ? "text-gray-300" : "text-[#FF6B35]"}`}>
                      {benefit.available === false ? "remove" : benefit.icon}
                    </span>
                    <span className="font-medium">{benefit.label}</span>
                    {benefit.available !== false && (
                      <span className="material-symbols-outlined ml-auto text-base text-[#2E7D32]">
                        check_circle
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E9E1E6] pt-5">
        <p className="text-xs text-[#594139]">Semua momen, dari semua sudut.</p>
        <button
          type="button"
          onClick={onStartPayment}
          disabled={loading || !canPay}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Lanjut ke Pembayaran"}
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
