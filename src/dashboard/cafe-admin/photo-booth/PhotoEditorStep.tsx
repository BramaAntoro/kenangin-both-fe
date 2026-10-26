import type { RefObject } from "react";
import type {
  DragOverlay,
  EmojiOverlay,
  Frame,
  FrameLayout,
  PhotoFilter,
  TextOverlay,
} from "./types";
import { emojiChoices, photoFilters, textColorChoices } from "./values";

type PhotoEditorStepProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  frame: Frame | undefined;
  frameLayout: FrameLayout | null;
  photoSlotCount: number;
  selectedSlotAssignments: number[];
  captures: string[];
  selectedSlotIndex: number;
  filter: PhotoFilter;
  emojiOverlays: EmojiOverlay[];
  selectedEmojiId: string | null;
  selectedSticker: EmojiOverlay | undefined;
  overlayText: TextOverlay;
  isTextSelected: boolean;
  selectedOverlaySize: number;
  selectedOverlayRotation: number;
  allowFilters: boolean;
  allowEmoji: boolean;
  allowCustomText: boolean;
  retakesUsed: number;
  retakeLimit: number;
  selectedCapture: number;
  loading: boolean;
  assetUrl: (url: string) => string;
  onSelectSlot: (index: number) => void;
  onAssignPhoto: (captureIndex: number) => void;
  onSetFilter: (filter: PhotoFilter) => void;
  onSelectEmoji: (id: string) => void;
  onDeleteEmoji: (id: string) => void;
  onDeleteSelectedEmoji: () => void;
  onAddEmoji: (value: string) => void;
  onSelectText: () => void;
  onSetText: (value: string) => void;
  onStartDragging: (
    event: React.PointerEvent<HTMLElement>,
    overlay: DragOverlay,
  ) => void;
  onMoveOverlay: (event: React.PointerEvent<HTMLElement>) => void;
  onStopDragging: (event: React.PointerEvent<HTMLElement>) => void;
  onDeleteSelectedOverlay: () => void;
  onSetFont: (font: TextOverlay["font"]) => void;
  onSetTextColor: (color: string) => void;
  onUpdateSelectedOverlay: (
    property: "size" | "rotation",
    value: number,
  ) => void;
  onRetake: () => void;
  onSave: () => void;
};

export default function PhotoEditorStep({
  editorRef,
  frame,
  frameLayout,
  photoSlotCount,
  selectedSlotAssignments,
  captures,
  selectedSlotIndex,
  filter,
  emojiOverlays,
  selectedEmojiId,
  selectedSticker,
  overlayText,
  isTextSelected,
  selectedOverlaySize,
  selectedOverlayRotation,
  allowFilters,
  allowEmoji,
  allowCustomText,
  retakesUsed,
  retakeLimit,
  selectedCapture,
  loading,
  assetUrl,
  onSelectSlot,
  onAssignPhoto,
  onSetFilter,
  onSelectEmoji,
  onDeleteEmoji,
  onDeleteSelectedEmoji,
  onAddEmoji,
  onSelectText,
  onSetText,
  onStartDragging,
  onMoveOverlay,
  onStopDragging,
  onDeleteSelectedOverlay,
  onSetFont,
  onSetTextColor,
  onUpdateSelectedOverlay,
  onRetake,
  onSave,
}: PhotoEditorStepProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid content-start gap-4 rounded-3xl border border-[#E9E1E6] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Atur kenanganmu</h2>
            <p className="mt-1 text-sm text-[#594139]">
              Foto langsung menyatu dengan frame pilihanmu.
            </p>
          </div>
          <span className="rounded-full bg-[#FFC845]/30 px-3 py-1.5 text-xs font-semibold text-[#594139]">
            {frame?.title}
          </span>
        </div>
        <div
          ref={editorRef}
          className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl bg-[#FFF7F2]"
          style={{ aspectRatio: frameLayout?.aspectRatio ?? 4 / 5 }}
        >
          {frameLayout?.slots.map((slot, index) => {
            const captureIndex = selectedSlotAssignments[index];
            const capture =
              captureIndex === undefined ? undefined : captures[captureIndex];
            return (
              <div
                key={`photo-slot-${index}`}
                role="button"
                tabIndex={0}
                aria-label={`Pilih kotak frame ${index + 1}`}
                onClick={() => onSelectSlot(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectSlot(index);
                  }
                }}
                className={`absolute cursor-pointer overflow-hidden ${capture ? "" : "grid place-items-center bg-[#FFF7F2]"} ${selectedSlotIndex === index ? "z-10 ring-4 ring-inset ring-[#FFC845]" : ""}`}
                style={{
                  left: `${slot.x * 100}%`,
                  top: `${slot.y * 100}%`,
                  width: `${slot.width * 100}%`,
                  height: `${slot.height * 100}%`,
                }}
              >
                {capture ? (
                  <img
                    src={capture}
                    alt={`Foto ${captureIndex! + 1} pada kotak ${index + 1}`}
                    className="size-full object-cover"
                    style={{ filter: photoFilters.find((item) => item.id === filter)?.css }}
                  />
                ) : (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#594139]">
                    Kotak {index + 1}
                  </span>
                )}
                <span className="absolute left-1 top-1 rounded-full bg-[#241435]/75 px-2 py-1 text-[10px] font-bold text-white">
                  Kotak {index + 1}
                </span>
              </div>
            );
          })}
          {frame && (
            <img
              src={assetUrl(frame.frameUrl)}
              alt={`Pratinjau frame ${frame.title}`}
              className="pointer-events-none absolute inset-0 size-full object-fill"
            />
          )}
          {emojiOverlays.map((sticker) => (
            <span
              key={sticker.id}
              role="button"
              tabIndex={0}
              aria-label={`Emoji ${sticker.value}, geser untuk memindahkan`}
              onClick={() => onSelectEmoji(sticker.id)}
              onPointerDown={(event) =>
                onStartDragging(event, { type: "emoji", id: sticker.id })
              }
              onPointerMove={onMoveOverlay}
              onPointerUp={onStopDragging}
              onPointerCancel={onStopDragging}
              onKeyDown={(event) => {
                if (
                  event.key === "Delete" || event.key === "Backspace"
                ) {
                  onDeleteEmoji(sticker.id);
                }
              }}
              className={`absolute z-20 cursor-grab touch-none select-none drop-shadow-md active:cursor-grabbing ${selectedEmojiId === sticker.id ? "rounded-lg outline outline-2 outline-[#FF6B35]" : ""}`}
              style={{
                left: `${sticker.x * 100}%`,
                top: `${sticker.y * 100}%`,
                fontSize: `${sticker.size * 3}rem`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
              }}
            >
              {sticker.value}
            </span>
          ))}
          {overlayText.value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Tulisan foto, geser untuk memindahkan"
              onClick={onSelectText}
              onPointerDown={(event) =>
                onStartDragging(event, { type: "text", id: "caption" })
              }
              onPointerMove={onMoveOverlay}
              onPointerUp={onStopDragging}
              onPointerCancel={onStopDragging}
              className={`absolute z-20 max-w-[85%] cursor-grab touch-none truncate text-center font-semibold text-white active:cursor-grabbing ${isTextSelected ? "outline outline-2 outline-[#FF6B35] outline-offset-2" : ""}`}
              style={{
                left: `${overlayText.x * 100}%`,
                top: `${overlayText.y * 100}%`,
                fontSize: `${14 * overlayText.size}px`,
                fontFamily:
                  overlayText.font === "fredoka"
                    ? "Fredoka, sans-serif"
                    : '"Plus Jakarta Sans", sans-serif',
                color: overlayText.color,
                textShadow: "1px 2px 5px rgba(36, 20, 53, 0.9)",
                transform: `translate(-50%, -50%) rotate(${overlayText.rotation}deg)`,
              }}
            >
              {overlayText.value}
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#594139] shadow-sm">
            Pratinjau hasil
          </span>
        </div>
      </div>

      <aside className="grid content-start gap-5 rounded-3xl border border-[#E9E1E6] bg-white p-5 shadow-sm sm:p-6">
        <section>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pilih foto untuk kotak</h3>
            <span className="text-xs font-medium text-[#594139]">
              {selectedSlotIndex + 1}/{photoSlotCount}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#594139]">
            Pilih kotak di pratinjau, lalu pilih jepretan yang ingin ditampilkan di sana.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {frameLayout?.slots.slice(0, photoSlotCount).map((_, index) => (
              <button
                key={`slot-choice-${index}`}
                type="button"
                onClick={() => onSelectSlot(index)}
                aria-pressed={selectedSlotIndex === index}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold ${selectedSlotIndex === index ? "border-[#FF6B35] bg-[#FFF7F2] text-[#FF6B35]" : "border-[#E9E1E6]"}`}
              >
                Kotak {index + 1} · Foto {(selectedSlotAssignments[index] ?? index) + 1}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {captures.map((capture, index) => (
              <button
                key={capture}
                type="button"
                onClick={() => onAssignPhoto(index)}
                aria-label={`Tampilkan jepretan ${index + 1} di kotak ${selectedSlotIndex + 1}`}
                aria-pressed={selectedSlotAssignments[selectedSlotIndex] === index}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-[#FFF7F2] transition ${selectedSlotAssignments[selectedSlotIndex] === index ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" : "border-transparent hover:border-[#FFC845]"}`}
              >
                <img src={capture} alt="" className="size-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-[#241435]">
                  Foto {index + 1}
                </span>
              </button>
            ))}
          </div>
        </section>

        {allowFilters && (
          <section className="border-t border-[#E9E1E6] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pilih filter</h3>
              <span className="text-xs text-[#594139]">{photoFilters.length} pilihan</span>
            </div>
            <p className="mt-1 text-xs text-[#594139]">Filter diterapkan ke semua foto.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photoFilters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSetFilter(option.id)}
                  aria-pressed={filter === option.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${filter === option.id ? "border-[#FF6B35] bg-[#FFF7F2] text-[#FF6B35]" : "border-[#E9E1E6] hover:border-[#FFC845]"}`}
                >
                  <span>{option.label}</span>
                  {filter === option.id && (
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {allowEmoji && (
          <section className="border-t border-[#E9E1E6] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tambahkan emoji</h3>
              {selectedEmojiId && (
                <button
                  type="button"
                  onClick={onDeleteSelectedEmoji}
                  className="text-xs font-semibold text-[#FF6B35]"
                >
                  Hapus pilihan
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-[#594139]">
              Tekan emoji berkali-kali untuk menambahkannya. Geser emoji pada foto untuk
              mengatur posisi.
            </p>
            <div className="mt-3 grid grid-cols-8 gap-1.5">
              {emojiChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => onAddEmoji(choice)}
                  aria-label={`Pilih emoji ${choice}`}
                  className="grid aspect-square place-items-center rounded-lg bg-[#FFF7F2] text-xl transition hover:bg-[#FFC845]/30"
                >
                  {choice}
                </button>
              ))}
            </div>
          </section>
        )}

        {allowCustomText && (
          <label className="grid gap-2 border-t border-[#E9E1E6] pt-4 text-sm font-semibold">
            Tambahkan tulisan
            <input
              value={overlayText.value}
              onFocus={onSelectText}
              onChange={(event) => onSetText(event.target.value)}
              maxLength={30}
              placeholder="Tulis pesan singkat..."
              className="w-full rounded-xl border border-[#E9E1E6] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#FF6B35]"
            />
            <span className="text-xs font-normal text-[#594139]">
              Geser tulisan langsung di pratinjau untuk mengatur posisinya.
            </span>
          </label>
        )}

        {(selectedSticker || (isTextSelected && overlayText.value)) && (
          <section className="grid gap-3 border-t border-[#E9E1E6] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {selectedSticker ? "Atur emoji" : "Atur tulisan"}
              </h3>
              <button
                type="button"
                onClick={onDeleteSelectedOverlay}
                className="text-xs font-semibold text-[#FF6B35]"
              >
                Hapus
              </button>
            </div>
            {isTextSelected && overlayText.value && (
              <>
                <div className="grid gap-2">
                  <span className="text-xs text-[#594139]">Jenis huruf</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSetFont("fredoka")}
                      aria-pressed={overlayText.font === "fredoka"}
                      className={`rounded-xl border px-3 py-2 text-sm font-display font-semibold ${overlayText.font === "fredoka" ? "border-[#FF6B35] bg-[#FFF7F2] text-[#FF6B35]" : "border-[#E9E1E6]"}`}
                    >
                      Fredoka
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetFont("jakarta")}
                      aria-pressed={overlayText.font === "jakarta"}
                      className={`rounded-xl border px-3 py-2 text-sm font-sans font-semibold ${overlayText.font === "jakarta" ? "border-[#FF6B35] bg-[#FFF7F2] text-[#FF6B35]" : "border-[#E9E1E6]"}`}
                    >
                      Plus Jakarta Sans
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <span className="text-xs text-[#594139]">Warna tulisan</span>
                  <div className="flex flex-wrap gap-2">
                    {textColorChoices.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => onSetTextColor(color.value)}
                        aria-label={`Warna ${color.label}`}
                        aria-pressed={overlayText.color === color.value}
                        className={`size-8 rounded-full border-2 ${overlayText.color === color.value ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" : "border-[#E9E1E6]"}`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
            <label className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-xs text-[#594139]">
              <span>Ukuran</span>
              <span>{Math.round(selectedOverlaySize * 100)}%</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={selectedOverlaySize}
                onChange={(event) =>
                  onUpdateSelectedOverlay("size", Number(event.target.value))
                }
                aria-label="Ubah ukuran emoji atau tulisan"
                className="col-span-2 w-full accent-[#FF6B35]"
              />
            </label>
            <label className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-xs text-[#594139]">
              <span>Rotasi</span>
              <span>{selectedOverlayRotation}°</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedOverlayRotation}
                onChange={(event) =>
                  onUpdateSelectedOverlay("rotation", Number(event.target.value))
                }
                aria-label="Ubah rotasi emoji atau tulisan"
                className="col-span-2 w-full accent-[#FF6B35]"
              />
            </label>
          </section>
        )}

        <div className="grid gap-2 border-t border-[#E9E1E6] pt-4">
          <p className="text-xs text-[#594139]">
            Retake terpakai: {retakesUsed}/{retakeLimit}
          </p>
          <button
            type="button"
            disabled={retakesUsed >= retakeLimit}
            onClick={onRetake}
            className="w-full rounded-xl border border-[#E9E1E6] px-4 py-2.5 text-sm font-semibold text-[#241435] transition hover:bg-[#FFF7F2] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ulangi Foto Kotak {selectedCapture + 1}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="w-full rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A] disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Hasil Foto"}
          </button>
        </div>
      </aside>
    </section>
  );
}
