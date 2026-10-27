import type { BoothPackage, Frame, FrameLayout } from "./types";

type FrameSelectionStepProps = {
  frames: Frame[];
  selectedPackage: BoothPackage | undefined;
  selectedFrameId: string;
  selectedFrameLayout: FrameLayout | null;
  assetUrl: (url: string) => string;
  onSelect: (frameId: string) => void;
  onBeginCapture: () => void;
};

export default function FrameSelectionStep({
  frames,
  selectedPackage,
  selectedFrameId,
  selectedFrameLayout,
  assetUrl,
  onSelect,
  onBeginCapture,
}: FrameSelectionStepProps) {
  return (
    <section className="grid gap-5 rounded-3xl border border-[#E9E1E6] bg-white p-5 shadow-sm sm:p-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF6B35]">
          Pembayaran berhasil
        </span>
        <h2 className="font-display text-2xl font-semibold">Pilih Frame</h2>
        <p className="mt-1 text-sm text-[#594139]">Pilih bingkai yang akan menyimpan momenmu.</p>
      </div>
      {frames.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {frames.map((frame) => (
            <button
              key={frame.id}
              type="button"
              onClick={() => onSelect(frame.id)}
              aria-pressed={selectedFrameId === frame.id}
              disabled={frame.maxPhotosSlot > (selectedPackage?.photoShotsCount ?? 0)}
              className={`overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${selectedFrameId === frame.id ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" : "border-[#E9E1E6]"}`}
            >
              <span className="grid aspect-[4/3] place-items-center bg-[#FFF7F2] p-4">
                <img
                  src={assetUrl(frame.frameUrl)}
                  alt={frame.title}
                  className="h-full max-w-full object-contain"
                />
              </span>
              <span className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
                <span>
                  {frame.title}
                  <span className="mt-1 block text-xs font-normal text-[#594139]">
                    {frame.maxPhotosSlot} kotak foto
                  </span>
                </span>
                {selectedFrameId === frame.id && (
                  <span className="material-symbols-outlined text-[#2E7D32]">check_circle</span>
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-[#FFF7F2] p-4 text-sm text-[#594139]">
          Belum ada frame yang tersedia untuk cafe ini.
        </p>
      )}
      {selectedPackage &&
        frames.some((frame) => frame.maxPhotosSlot > selectedPackage.photoShotsCount) && (
          <p className="text-xs text-[#594139]">
            Frame yang jumlah kotaknya melebihi jepretan paket tidak dapat dipilih.
          </p>
        )}
      <button
        type="button"
        onClick={onBeginCapture}
        disabled={!selectedFrameLayout}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {selectedFrameLayout ? "Lanjut Ambil Foto" : "Memeriksa slot frame..."}
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </section>
  );
}
