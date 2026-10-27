import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import { getTerminalCameraStream } from "../../lib/client/terminalCamera";
import type { ApiEnvelope } from "../types";
import CafePhotoBoothHeader from "./photo-booth/CafePhotoBoothHeader";
import CaptureStep from "./photo-booth/CaptureStep";
import CompletionStep from "./photo-booth/CompletionStep";
import DownloadQrDialog from "./photo-booth/DownloadQrDialog";
import FrameSelectionStep from "./photo-booth/FrameSelectionStep";
import PackageSelectionStep from "./photo-booth/PackageSelectionStep";
import PhotoEditorStep from "./photo-booth/PhotoEditorStep";
import type {
  BoothPackage,
  CafeKiosk,
  DragOverlay,
  EmojiOverlay,
  Frame,
  FrameLayout,
  PhotoFilter,
  Step,
  TextOverlay,
} from "./photo-booth/types";
import {
  assetUrl,
  composeEditedPhoto,
  detectFramePhotoSlots,
  loadMidtransSnap,
  money,
  readTerminalConfig,
} from "./photo-booth/utils";
type TransactionResult = {
  orderId: string;
  grossAmount: number;
  snapToken: string;
};
type TransactionStatus = {
  orderId: string;
  paymentStatus: "pending" | "settlement" | "deny" | "cancel" | "expire" | null;
  sessionCode: string | null;
  softfileUrl: string | null;
};
type ApiErrorResponse = { message?: string };

export default function CafePhotoBooth() {
  const [step, setStep] = useState<Step>("packages");
  const [packages, setPackages] = useState<BoothPackage[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameLayout, setFrameLayout] = useState<FrameLayout | null>(null);
  const [terminalConfig] = useState(readTerminalConfig);
  const [selectedCafeId] = useState(terminalConfig.cafeId ?? "");
  const [selectedKioskId] = useState(terminalConfig.kioskId ?? "");
  const isTerminalConfigured = Boolean(selectedCafeId && selectedKioskId);
  const [terminalCafeName, setTerminalCafeName] = useState("");
  const [terminalKioskName, setTerminalKioskName] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedFrameId, setSelectedFrameId] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [captures, setCaptures] = useState<string[]>([]);
  const [selectedCapture, setSelectedCapture] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [slotAssignments, setSlotAssignments] = useState<number[]>([]);
  const [retakingCaptureIndex, setRetakingCaptureIndex] = useState<
    number | null
  >(null);
  const [retakesUsed, setRetakesUsed] = useState(0);
  const [filter, setFilter] = useState<PhotoFilter>("natural");
  const [overlayText, setOverlayText] = useState<TextOverlay>({
    value: "",
    x: 0.5,
    y: 0.9,
    size: 1,
    rotation: 0,
    color: "#FFF7F2",
    font: "fredoka",
  });
  const [emojiOverlays, setEmojiOverlays] = useState<EmojiOverlay[]>([]);
  const [selectedEmojiId, setSelectedEmojiId] = useState<string | null>(null);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDownloadQr, setShowDownloadQr] = useState(false);
  const [error, setError] = useState("");
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [finishCountdown, setFinishCountdown] = useState(60);
  const [cameraReady, setCameraReady] = useState(false);
  const [showCaptureFeedback, setShowCaptureFeedback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const draggingOverlayRef = useRef<
    (DragOverlay & { pointerId: number }) | null
  >(null);

  useEffect(() => {
    if (!showCaptureFeedback) return;
    const timeout = window.setTimeout(() => setShowCaptureFeedback(false), 650);
    return () => window.clearTimeout(timeout);
  }, [showCaptureFeedback]);

  const selectedPackage = packages.find(
    (item) => item.id === selectedPackageId,
  );
  const selectedFrame = frames.find((item) => item.id === selectedFrameId);
  const selectedFrameLayout =
    frameLayout?.frameId === selectedFrame?.id ? frameLayout : null;
  const photoSlotCount =
    selectedFrame && selectedPackage
      ? Math.min(
          selectedFrame.maxPhotosSlot,
          selectedPackage.photoShotsCount,
          selectedFrameLayout?.slots.length ?? 0,
        )
      : 0;
  const photoShotCount = selectedPackage?.photoShotsCount ?? 0;
  const retakeLimit = selectedPackage?.features?.retake_limit ?? 0;
  const selectedSlotAssignments = Array.from(
    { length: photoSlotCount },
    (_, index) => slotAssignments[index] ?? index,
  );
  const selectedSticker = emojiOverlays.find(
    (sticker) => sticker.id === selectedEmojiId,
  );
  const selectedOverlaySize = selectedSticker?.size ?? overlayText.size;
  const selectedOverlayRotation =
    selectedSticker?.rotation ?? overlayText.rotation;
  const timerDuration = selectedPackage?.features?.timer_duration ?? 0;

  const capturePhoto = useCallback(() => {
    setCaptureCountdown(null);
    const video = videoRef.current;
    if (!video || !selectedPackage) return;
    if (!cameraReady || video.videoWidth === 0 || video.videoHeight === 0) {
      setError(
        "Kamera sedang disiapkan. Tunggu hingga kamera siap untuk mengambil foto.",
      );
      return;
    }
    if (!selectedFrame || !selectedFrameLayout) {
      setError("Frame belum siap. Pilih frame lain atau coba lagi.");
      return;
    }
    if (captures.length >= photoShotCount && retakingCaptureIndex === null) {
      setError("Jatah jepretan paket sudah habis.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const nextCapture = canvas.toDataURL("image/jpeg", 0.92);
    setShowCaptureFeedback(true);
    if (retakingCaptureIndex !== null) {
      setCaptures((current) =>
        current.map((capture, index) =>
          index === retakingCaptureIndex ? nextCapture : capture,
        ),
      );
      setRetakesUsed((current) => current + 1);
      setRetakingCaptureIndex(null);
      setCaptureCountdown(null);
      setCameraReady(false);
      setStep("edit");
      return;
    }

    setCaptures((current) => [...current, nextCapture]);
    setCaptureCountdown(null);
  }, [
    cameraReady,
    captures.length,
    photoShotCount,
    retakingCaptureIndex,
    selectedFrame,
    selectedFrameLayout,
    selectedPackage,
  ]);

  function startCaptureCountdown() {
    if (timerDuration > 0) {
      setCaptureCountdown(Math.max(1, Math.ceil(timerDuration)));
      return;
    }
    capturePhoto();
  }

  const finishSession = useCallback(() => {
    setSelectedPackageId("");
    setSelectedFrameId("");
    setSessionCode("");
    setCaptures([]);
    setSelectedCapture(0);
    setSelectedSlotIndex(0);
    setSlotAssignments([]);
    setRetakingCaptureIndex(null);
    setRetakesUsed(0);
    setFilter("natural");
    setOverlayText({
      value: "",
      x: 0.5,
      y: 0.9,
      size: 1,
      rotation: 0,
      color: "#FFF7F2",
      font: "fredoka",
    });
    setEmojiOverlays([]);
    setSelectedEmojiId(null);
    setIsTextSelected(false);
    setShowDownloadQr(false);
    setCaptureCountdown(null);
    setFinishCountdown(60);
    setCameraReady(false);
    setError("");
    setStep("packages");
  }, []);

  useEffect(() => {
    if (!selectedFrame) return;
    let cancelled = false;
    void detectFramePhotoSlots(
      selectedFrame.frameUrl,
      selectedFrame.maxPhotosSlot,
    )
      .then((layout) => {
        if (!cancelled)
          setFrameLayout({ ...layout, frameId: selectedFrame.id });
      })
      .catch((layoutError: unknown) => {
        if (!cancelled) {
          setError(
            layoutError instanceof Error
              ? layoutError.message
              : "Slot frame gagal dibaca.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFrame]);

  useEffect(() => {
    if (!selectedCafeId) return;
    const controller = new AbortController();
    void Promise.all([
      api.get<
        ApiEnvelope<{ cafe: { name: string; packages: BoothPackage[] } }>
      >(`/cafes/packages/${selectedCafeId}`, { signal: controller.signal }),
      api.get<
        ApiEnvelope<{
          frames: {
            global: Frame[];
            cafes: { cafeId: string; frames: Frame[] }[];
          };
        }>
      >(`/booth/frames?cafe_id=${selectedCafeId}`, {
        signal: controller.signal,
      }),
      api.get<ApiEnvelope<{ kiosks: (CafeKiosk & { cafeId: string })[] }>>(
        `/cafes/kiosks/${selectedCafeId}`,
        { signal: controller.signal },
      ),
    ])
      .then(([packageResponse, frameResponse, kioskResponse]) => {
        const cafeFrames = frameResponse.data.data.frames.cafes.find(
          (group) => group.cafeId === selectedCafeId,
        );
        setTerminalCafeName(packageResponse.data.data.cafe.name);
        setTerminalKioskName(
          kioskResponse.data.data.kiosks.find(
            (kiosk) => kiosk.id === selectedKioskId,
          )?.name ?? "",
        );
        setPackages(packageResponse.data.data.cafe.packages);
        setFrames([
          ...frameResponse.data.data.frames.global,
          ...(cafeFrames?.frames ?? []),
        ]);
        setSelectedPackageId("");
        setSelectedFrameId("");
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            isAxiosError<ApiErrorResponse>(requestError)
              ? (requestError.response?.data?.message ??
                  "Gagal memuat data sesi.")
              : "Gagal memuat data sesi.",
          );
        }
      });
    return () => controller.abort();
  }, [selectedCafeId, selectedKioskId]);

  useEffect(() => {
    if (step !== "capture") {
      return;
    }

    const video = videoRef.current;
    const stream = getTerminalCameraStream();
    if (!stream) {
      return;
    }
    if (video) video.srcObject = stream;

    return () => {
      if (video) video.srcObject = null;
    };
  }, [step]);

  useEffect(() => {
    if (step !== "capture" || !cameraReady || captureCountdown === null) return;
    if (captureCountdown === 0) {
      const timer = window.setTimeout(capturePhoto, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setCaptureCountdown((current) =>
        current === null ? null : Math.max(0, current - 1),
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [step, cameraReady, captureCountdown, capturePhoto]);

  useEffect(() => {
    if (step !== "complete") return;
    let remaining = 60;
    const timer = window.setInterval(() => {
      remaining -= 1;
      setFinishCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        finishSession();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, finishSession]);

  async function startPayment() {
    if (!selectedCafeId || !selectedKioskId || !selectedPackageId) {
      setError("Konfigurasi terminal belum lengkap atau paket belum dipilih.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post<ApiEnvelope<TransactionResult>>(
        "/booth/transaction/initiate",
        {
          packageId: selectedPackageId,
          kioskId: selectedKioskId,
        },
      );
      const nextTransaction = response.data.data;
      await openPayment(nextTransaction);
    } catch (requestError: unknown) {
      setError(
        isAxiosError<ApiErrorResponse>(requestError)
          ? (requestError.response?.data?.message ??
              "Pembayaran gagal dimulai.")
          : "Pembayaran gagal dimulai.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function pollTransaction(orderId: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await api.get<
        ApiEnvelope<{ transaction: TransactionStatus }>
      >(`/booth/transaction/${encodeURIComponent(orderId)}`);
      const status = response.data.data.transaction;
      if (status.paymentStatus === "settlement" && status.sessionCode) {
        setSessionCode(status.sessionCode);
        setError("");
        setStep("frame");
        return;
      }
      if (status.paymentStatus !== "pending")
        throw new Error("Pembayaran belum berhasil.");
      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
    throw new Error("Pembayaran masih diproses. Silakan ulangi pemeriksaan.");
  }

  async function checkPaymentStatus(orderId: string) {
    try {
      await pollTransaction(orderId);
    } catch (paymentError: unknown) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Pembayaran belum selesai.",
      );
    }
  }

  async function openPayment(payment: TransactionResult) {
    await loadMidtransSnap();
    const snap = (
      window as Window & {
        snap?: { pay: (token: string, options: unknown) => void };
      }
    ).snap;
    if (!snap) {
      throw new Error("Midtrans Snap belum tersedia.");
    }
    snap.pay(payment.snapToken, {
      onSuccess: () => void checkPaymentStatus(payment.orderId),
      onPending: () => {
        setError(
          "Pembayaran masih menunggu penyelesaian. Status akan diperiksa kembali.",
        );
        void checkPaymentStatus(payment.orderId);
      },
      onError: () => setError("Pembayaran gagal."),
      onClose: () => setError("Pembayaran dibatalkan sebelum selesai."),
    });
  }

  async function saveSession() {
    if (
      !selectedFrameId ||
      !selectedFrame ||
      !selectedFrameLayout ||
      !sessionCode
    ) {
      setError("Pilih frame terlebih dahulu.");
      return;
    }
    if (captures.length < photoShotCount) {
      setError(
        `Selesaikan ${photoShotCount} jepretan sesuai paket terlebih dahulu.`,
      );
      return;
    }
    if (
      selectedSlotAssignments.some(
        (captureIndex) => captureIndex >= captures.length,
      )
    ) {
      setError("Pilih foto untuk setiap kotak frame.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("frameId", selectedFrameId);
      if (!selectedFrame) throw new Error("Pilih frame terlebih dahulu.");
      const photo = await composeEditedPhoto(
        selectedSlotAssignments.map((captureIndex) => captures[captureIndex]!),
        selectedFrame.frameUrl,
        selectedFrameLayout.slots,
        filter,
        emojiOverlays,
        overlayText,
      );
      payload.append("file", photo, `${sessionCode}.jpg`);
      await api.patch(`/booth/sessions/${sessionCode}`, payload);
      setShowDownloadQr(false);
      setFinishCountdown(60);
      setStep("complete");
    } catch (requestError: unknown) {
      setError(
        isAxiosError<ApiErrorResponse>(requestError)
          ? (requestError.response?.data?.message ??
              "Hasil foto gagal disimpan.")
          : requestError instanceof Error
            ? requestError.message
            : "Hasil foto gagal disimpan.",
      );
    } finally {
      setLoading(false);
    }
  }

  const downloadUrl = sessionCode
    ? `${window.location.origin}/session/${sessionCode}`
    : "";

  const photoUrl = sessionCode
    ? new URL(
        `/uploads/photos/${encodeURIComponent(sessionCode)}.jpg`,
        api.defaults.baseURL,
      ).toString()
    : "";

  function addEmoji(value: string) {
    const sticker = {
      id: crypto.randomUUID(),
      value,
      x: 0.38 + (emojiOverlays.length % 4) * 0.08,
      y: 0.42 + (emojiOverlays.length % 3) * 0.08,
      size: 1,
      rotation: 0,
    };
    setEmojiOverlays((current) => [...current, sticker]);
    setSelectedEmojiId(sticker.id);
    setIsTextSelected(false);
  }

  function continueToEdit() {
    if (captures.length < photoShotCount) {
      setError(
        `Paket ini memiliki ${photoShotCount} jepretan. Selesaikan semuanya dahulu.`,
      );
      return;
    }
    setSlotAssignments(
      Array.from({ length: photoSlotCount }, (_, index) => index),
    );
    setSelectedSlotIndex(0);
    setSelectedCapture(0);
    setStep("edit");
  }

  function assignPhotoToSlot(captureIndex: number) {
    setSlotAssignments((current) => {
      const next = Array.from(
        { length: photoSlotCount },
        (_, index) => current[index] ?? index,
      );
      next[selectedSlotIndex] = captureIndex;
      return next;
    });
    setSelectedCapture(captureIndex);
  }

  function moveOverlay(event: ReactPointerEvent<HTMLElement>) {
    const drag = draggingOverlayRef.current;
    const bounds = editorRef.current?.getBoundingClientRect();
    if (!drag || !bounds || drag.pointerId !== event.pointerId) return;
    const x = Math.max(
      0.03,
      Math.min(0.97, (event.clientX - bounds.left) / bounds.width),
    );
    const y = Math.max(
      0.03,
      Math.min(0.97, (event.clientY - bounds.top) / bounds.height),
    );
    if (drag.type === "emoji") {
      setEmojiOverlays((current) =>
        current.map((sticker) =>
          sticker.id === drag.id ? { ...sticker, x, y } : sticker,
        ),
      );
    } else {
      setOverlayText((current) => ({ ...current, x, y }));
    }
  }

  function beginCapture() {
    if (!getTerminalCameraStream()) {
      setError("Aktifkan kamera terlebih dahulu melalui Setup Terminal.");
      return;
    }
    setError("");
    setCameraReady(false);
    setCaptureCountdown(null);
    setStep("capture");
  }

  function startDraggingOverlay(
    event: ReactPointerEvent<HTMLElement>,
    overlay: DragOverlay,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingOverlayRef.current = { ...overlay, pointerId: event.pointerId };
    if (overlay.type === "emoji") {
      setSelectedEmojiId(overlay.id);
      setIsTextSelected(false);
    } else {
      setSelectedEmojiId(null);
      setIsTextSelected(true);
    }
  }

  function updateSelectedOverlay(property: "size" | "rotation", value: number) {
    if (selectedEmojiId) {
      setEmojiOverlays((current) =>
        current.map((sticker) =>
          sticker.id === selectedEmojiId
            ? { ...sticker, [property]: value }
            : sticker,
        ),
      );
    } else if (isTextSelected) {
      setOverlayText((current) => ({ ...current, [property]: value }));
    }
  }

  function stopDraggingOverlay(event: ReactPointerEvent<HTMLElement>) {
    if (draggingOverlayRef.current?.pointerId === event.pointerId) {
      draggingOverlayRef.current = null;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16 pt-6">
      <CafePhotoBoothHeader
        step={step}
        cafeName={terminalCafeName}
        kioskName={terminalKioskName}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"
        >
          {error}
        </p>
      )}

      {!isTerminalConfigured ? (
        <section
          role="alert"
          className="rounded-3xl border border-[#FFC845]/50 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFC845]/25 text-[#795900]">
              <span className="material-symbols-outlined text-2xl">
                settings
              </span>
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">
                Terminal belum di-setup
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#594139]">
                Sesi foto belum dapat dimulai. Buka Dashboard, pilih Setup
                Terminal, lalu pilih kafe dan kiosk aktif dan simpan
                konfigurasinya.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {step === "packages" && (
            <PackageSelectionStep
          packages={packages}
          selectedPackageId={selectedPackageId}
          loading={loading}
          canPay={isTerminalConfigured}
          formatPrice={money}
          onSelect={setSelectedPackageId}
          onStartPayment={() => void startPayment()}
            />
          )}

          {step === "frame" && (
            <FrameSelectionStep
          frames={frames}
          selectedPackage={selectedPackage}
          selectedFrameId={selectedFrameId}
          selectedFrameLayout={selectedFrameLayout}
          assetUrl={assetUrl}
          onSelect={setSelectedFrameId}
          onBeginCapture={beginCapture}
            />
          )}

          {step === "capture" && (
            <CaptureStep
          videoRef={videoRef}
          frame={selectedFrame}
          frameLayout={selectedFrameLayout}
          cameraReady={cameraReady}
          captures={captures}
          photoShotCount={photoShotCount}
          photoSlotCount={photoSlotCount}
          retakeLimit={retakeLimit}
          retakesUsed={retakesUsed}
          retakingCaptureIndex={retakingCaptureIndex}
          captureCountdown={captureCountdown}
          showCaptureFeedback={showCaptureFeedback}
          timerDuration={timerDuration}
          onVideoLoaded={() => {
            setCameraReady(true);
            setError("");
          }}
          onStartCaptureCountdown={startCaptureCountdown}
          onContinueToEdit={continueToEdit}
            />
          )}

          {step === "edit" && (
            <PhotoEditorStep
          editorRef={editorRef}
          frame={selectedFrame}
          frameLayout={selectedFrameLayout}
          photoSlotCount={photoSlotCount}
          selectedSlotAssignments={selectedSlotAssignments}
          captures={captures}
          selectedSlotIndex={selectedSlotIndex}
          filter={filter}
          emojiOverlays={emojiOverlays}
          selectedEmojiId={selectedEmojiId}
          selectedSticker={selectedSticker}
          overlayText={overlayText}
          isTextSelected={isTextSelected}
          selectedOverlaySize={selectedOverlaySize}
          selectedOverlayRotation={selectedOverlayRotation}
          allowFilters={selectedPackage?.features?.allow_filters === true}
          allowEmoji={selectedPackage?.features?.allow_emoji === true}
          allowCustomText={
            selectedPackage?.features?.allow_custom_text === true
          }
          retakesUsed={retakesUsed}
          retakeLimit={retakeLimit}
          selectedCapture={selectedCapture}
          loading={loading}
          assetUrl={assetUrl}
          onSelectSlot={setSelectedSlotIndex}
          onAssignPhoto={assignPhotoToSlot}
          onSetFilter={setFilter}
          onSelectEmoji={(id) => {
            setSelectedEmojiId(id);
            setIsTextSelected(false);
          }}
          onDeleteEmoji={(id) => {
            setEmojiOverlays((current) =>
              current.filter((item) => item.id !== id),
            );
            setSelectedEmojiId(null);
          }}
          onDeleteSelectedEmoji={() => {
            setEmojiOverlays((current) =>
              current.filter((item) => item.id !== selectedEmojiId),
            );
            setSelectedEmojiId(null);
          }}
          onAddEmoji={addEmoji}
          onSelectText={() => {
            setSelectedEmojiId(null);
            setIsTextSelected(true);
          }}
          onSetText={(value) => {
            setOverlayText((current) => ({ ...current, value }));
            setSelectedEmojiId(null);
            setIsTextSelected(true);
          }}
          onStartDragging={startDraggingOverlay}
          onMoveOverlay={moveOverlay}
          onStopDragging={stopDraggingOverlay}
          onDeleteSelectedOverlay={() => {
            if (selectedEmojiId) {
              setEmojiOverlays((current) =>
                current.filter((sticker) => sticker.id !== selectedEmojiId),
              );
              setSelectedEmojiId(null);
            } else if (isTextSelected) {
              setOverlayText((current) => ({ ...current, value: "" }));
              setIsTextSelected(false);
            }
          }}
          onSetFont={(font) =>
            setOverlayText((current) => ({ ...current, font }))
          }
          onSetTextColor={(color) =>
            setOverlayText((current) => ({ ...current, color }))
          }
          onUpdateSelectedOverlay={updateSelectedOverlay}
          onRetake={() => {
            setRetakingCaptureIndex(selectedCapture);
            beginCapture();
          }}
          onSave={() => void saveSession()}
            />
          )}

          {step === "complete" && (
            <CompletionStep
          photoUrl={photoUrl}
          finishCountdown={finishCountdown}
          onShowDownloadQr={() => setShowDownloadQr(true)}
          onFinish={finishSession}
            />
          )}

          {step === "complete" && showDownloadQr && sessionCode && (
            <DownloadQrDialog
          downloadUrl={downloadUrl}
          onClose={() => setShowDownloadQr(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
