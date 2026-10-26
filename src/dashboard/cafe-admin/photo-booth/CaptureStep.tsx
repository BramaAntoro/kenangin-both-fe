import type { RefObject } from "react";
import type { Frame, FrameLayout } from "./types";

type CaptureStepProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  frame: Frame | undefined;
  frameLayout: FrameLayout | null;
  cameraReady: boolean;
  captures: string[];
  photoShotCount: number;
  photoSlotCount: number;
  retakeLimit: number;
  retakesUsed: number;
  retakingCaptureIndex: number | null;
  captureCountdown: number | null;
  showCaptureFeedback: boolean;
  timerDuration: number;
  onVideoLoaded: () => void;
  onStartCaptureCountdown: () => void;
  onContinueToEdit: () => void;
};

export default function CaptureStep({
  videoRef,
  frame,
  frameLayout,
  cameraReady,
  captures,
  photoShotCount,
  photoSlotCount,
  retakeLimit,
  retakesUsed,
  retakingCaptureIndex,
  captureCountdown,
  showCaptureFeedback,
  timerDuration,
  onVideoLoaded,
  onStartCaptureCountdown,
  onContinueToEdit,
}: CaptureStepProps) {
  return (
    <section className="grid gap-5 rounded-3xl border border-[#E9E1E6] bg-white p-3 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-[#241435] shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedData={onVideoLoaded}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-[#241435]/60 to-transparent p-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#241435]">
            <span
              className={`size-2 rounded-full ${cameraReady ? "bg-[#2E7D32]" : "animate-pulse bg-[#ED6C02]"}`}
            />
            {cameraReady ? "KAMERA SIAP" : "MENYIAPKAN"}
          </span>
          <span className="rounded-full bg-[#241435]/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            Foto {Math.min(captures.length + 1, photoShotCount)} / {photoShotCount}
          </span>
        </div>
        {captureCountdown !== null && cameraReady && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center bg-[#241435]/25 backdrop-blur-[2px]"
            role="timer"
            aria-live="assertive"
            aria-label={`Foto diambil dalam ${captureCountdown} detik`}
          >
            <div className="grid size-32 place-items-center rounded-full border-4 border-white/80 bg-[#241435]/75 text-center text-white shadow-xl sm:size-40">
              <div>
                <span className="block font-display text-6xl font-semibold leading-none sm:text-7xl">
                  {captureCountdown}
                </span>
                <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.16em]">
                  Bersiap
                </span>
              </div>
            </div>
          </div>
        )}
        {showCaptureFeedback && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center"
            role="status"
            aria-live="polite"
          >
            <div className="camera-lens-aperture absolute inset-0 bg-black/90" />
            <span className="z-10 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#241435] shadow-lg">
              ✓ Jepretan tersimpan
            </span>
          </div>
        )}
      </div>
      <aside className="flex flex-col rounded-2xl bg-[#FFF7F2] p-5 sm:p-6">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF6B35]">
          Sesi berlangsung
        </span>
        <h2 className="mt-1 font-display text-xl font-semibold">
          {frame?.title ?? "Pilih frame"}
        </h2>
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="font-display text-3xl font-semibold text-[#241435]">
            {captures.length}
            <span className="text-lg text-[#594139]/60">/{photoShotCount}</span>
          </p>
          <span className="pb-1 text-xs font-medium text-[#594139]">jepretan tersimpan</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#FF6B35] transition-all"
            style={{
              width: `${photoShotCount > 0 ? Math.min(100, (captures.length / photoShotCount) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="mt-3 text-xs text-[#594139]">
          {photoSlotCount} kotak frame · {retakeLimit - retakesUsed} retake tersisa
        </p>
        <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-[#E9E1E6] bg-white px-3 py-3 text-sm font-medium leading-5 text-[#594139]">
          {!cameraReady
            ? "Menyiapkan kamera…"
            : captureCountdown !== null
              ? "Berdiri di posisi nyaman, foto akan diambil otomatis."
              : captures.length >= photoShotCount
                ? "Semua jepretan selesai"
                : timerDuration <= 0
                  ? "Timer otomatis tidak aktif · jepret manual"
                  : `Tekan jepret untuk memulai timer ${timerDuration} detik`}
        </p>
        {retakingCaptureIndex !== null && (
          <p className="mt-3 rounded-xl bg-[#FFC845]/35 px-3 py-2 text-xs font-semibold text-[#594139]">
            Mengulang jepretan {retakingCaptureIndex + 1} · retake {retakesUsed + 1}/{retakeLimit}
          </p>
        )}
        <div className="mt-auto grid gap-2 pt-5">
          <button
            type="button"
            onClick={onStartCaptureCountdown}
            disabled={
              !cameraReady ||
              captureCountdown !== null ||
              (captures.length >= photoShotCount && retakingCaptureIndex === null) ||
              !frameLayout
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {captureCountdown !== null ? "hourglass_top" : "photo_camera"}
            </span>
            {captureCountdown !== null
              ? `Menunggu ${captureCountdown} detik…`
              : retakingCaptureIndex !== null
                ? `Ulangi Jepretan ${retakingCaptureIndex + 1}`
                : captures.length >= photoShotCount
                  ? "Jatah Jepretan Habis"
                  : `Ambil Foto ${captures.length + 1}`}
          </button>
          {captures.length === photoShotCount && photoShotCount > 0 && (
            <button
              type="button"
              onClick={onContinueToEdit}
              className="w-full rounded-xl border border-[#241435]/15 bg-white px-4 py-3 text-sm font-semibold text-[#241435] transition hover:bg-[#241435] hover:text-white"
            >
              Pilih Foto untuk Frame
            </button>
          )}
        </div>
      </aside>
    </section>
  );
}
