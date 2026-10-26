import type { Step } from "./types";

type CafePhotoBoothHeaderProps = {
  step: Step;
  cafeName: string;
  kioskName: string;
};

const steps: { label: string; value: Step }[] = [
  { label: "Paket", value: "packages" },
  { label: "Frame", value: "frame" },
  { label: "Foto", value: "capture" },
  { label: "Edit", value: "edit" },
];
const stepOrder: Step[] = ["packages", "frame", "capture", "edit", "complete"];

export default function CafePhotoBoothHeader({
  step,
  cafeName,
  kioskName,
}: CafePhotoBoothHeaderProps) {
  const currentIndex = stepOrder.indexOf(step);
  return (
    <header className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-6 sm:px-8 sm:py-7">
        <div>
          <img
            src="/lockups/lockup-removebg-preview.webp"
            alt="Kenangin"
            className="h-auto w-44 sm:w-52"
          />
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Sesi Foto
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#594139]">
            Pilih paket, abadikan momen, lalu bawa pulang kenangannya.
          </p>
        </div>
        {(cafeName || kioskName) && (
          <div className="flex flex-wrap gap-2 self-end">
            {cafeName && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E9E1E6] bg-white px-3 py-1.5 text-xs font-semibold text-[#594139]">
                <span className="material-symbols-outlined text-base text-[#FF6B35]">
                  storefront
                </span>
                {cafeName}
              </span>
            )}
            {kioskName && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E9E1E6] bg-white px-3 py-1.5 text-xs font-semibold text-[#594139]">
                <span className="material-symbols-outlined text-base text-[#3FB6E0]">
                  photo_camera
                </span>
                {kioskName}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 border-t border-[#E9E1E6] bg-[#FFFCFA] px-3 py-4 sm:px-8">
        {steps.map((item, index) => {
          const active = item.value === step;
          const complete = currentIndex > index;
          return (
            <div
              key={item.value}
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm ${active ? "text-[#FF6B35]" : complete ? "text-[#2E7D32]" : "text-[#594139]/55"}`}
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border ${active ? "border-[#FF6B35] bg-[#FF6B35] text-white shadow-sm" : complete ? "border-[#2E7D32]/20 bg-[#2E7D32]/10 text-[#2E7D32]" : "border-[#E9E1E6] bg-white"}`}
              >
                {complete ? (
                  <span className="material-symbols-outlined text-base">check</span>
                ) : (
                  index + 1
                )}
              </span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
