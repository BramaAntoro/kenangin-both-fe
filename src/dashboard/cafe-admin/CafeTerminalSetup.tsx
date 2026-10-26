import { useEffect, useRef, useState } from "react";
import api from "../../lib/client/axios";
import { getTerminalCameraStream, startTerminalCamera } from "../../lib/client/terminalCamera";
import type { ApiEnvelope } from "../types";

type Cafe = { id: string; name: string };
type Kiosk = {
  id: string;
  cafeId: string;
  kioskCode: string;
  name: string;
  status: "active" | "maintenance" | "offline" | null;
};

export default function CafeTerminalSetup() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [savedConfig] = useState(() =>
    JSON.parse(
      localStorage.getItem("kenangin-photo-booth-config") ?? "{}",
    ) as { cafeId?: string; kioskId?: string },
  );
  const [cafeId, setCafeId] = useState(savedConfig.cafeId ?? "");
  const [kioskId, setKioskId] = useState(savedConfig.kioskId ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [checkingCamera, setCheckingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(getTerminalCameraStream);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cafeKiosks = kiosks.filter((kiosk) => kiosk.cafeId === cafeId);
  const activeKiosks = cafeKiosks.filter((kiosk) => kiosk.status === "active");

  useEffect(() => {
    const cameraVideo = cameraVideoRef.current;
    if (cameraVideo && cameraStream) {
      cameraVideo.srcObject = cameraStream;
    }
    return () => {
      if (cameraVideo) cameraVideo.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(() => {
    const controller = new AbortController();
    void api
      .get<ApiEnvelope<{ cafes: Cafe[] }>>("/booth/packages", {
        signal: controller.signal,
      })
      .then((response) => setCafes(response.data.data.cafes))
      .catch(() => setError("Daftar cafe gagal dimuat."));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!cafeId) {
      return;
    }
    const controller = new AbortController();
    void api
      .get<ApiEnvelope<{ kiosks: Kiosk[] }>>(`/cafes/kiosks/${cafeId}`, {
        signal: controller.signal,
      })
      .then((response) => setKiosks(response.data.data.kiosks))
      .catch(() => setError("Daftar kiosk gagal dimuat."));
    return () => controller.abort();
  }, [cafeId]);

  function save() {
    const kiosk = activeKiosks.find((item) => item.id === kioskId);
    if (!cafeId || !kiosk || kiosk.cafeId !== cafeId) {
      setError("Pilih cafe dan kiosk aktif yang terhubung.");
      return;
    }
    localStorage.setItem(
      "kenangin-photo-booth-config",
      JSON.stringify({ cafeId, kioskId }),
    );
    setError("");
    setSaved(true);
  }

  async function enableCamera() {
    setCheckingCamera(true);
    setError("");
    setCameraReady(false);
    try {
      const stream = await startTerminalCamera();
      setCameraStream(stream);
      setCameraReady(true);
    } catch {
      setError("Kamera tidak dapat diakses. Periksa izin kamera browser dan pastikan kamera tidak sedang digunakan aplikasi lain.");
    } finally {
      setCheckingCamera(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-16 pt-6">
      <header>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Setup Terminal</h1>
        <p className="mt-1 text-sm text-[#594139]">Konfigurasi dilakukan admin dan berlaku untuk perangkat terminal ini.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{error}</p>}
      {saved && <p role="status" className="rounded-xl border border-[#2E7D32]/20 bg-[#2E7D32]/10 px-4 py-3 text-sm text-[#2E7D32]">Konfigurasi terminal tersimpan.</p>}
      <section className="grid max-w-xl gap-5 rounded-2xl border border-[#E9E1E6] bg-white p-5">
        <label className="grid gap-2 text-sm font-semibold">
          Cafe
          <select value={cafeId} onChange={(event) => { setCafeId(event.target.value); setKioskId(""); setSaved(false); }} className="rounded-xl border border-[#E9E1E6] px-3 py-2.5"><option value="">Pilih cafe</option>{cafes.map((cafe) => <option key={cafe.id} value={cafe.id}>{cafe.name}</option>)}</select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Kiosk
          <select value={kioskId} onChange={(event) => { setKioskId(event.target.value); setSaved(false); }} className="rounded-xl border border-[#E9E1E6] px-3 py-2.5"><option value="">Pilih kiosk aktif</option>{activeKiosks.map((kiosk) => <option key={kiosk.id} value={kiosk.id}>{kiosk.name} · {kiosk.kioskCode}</option>)}</select>
          {cafeKiosks.length > 0 && activeKiosks.length === 0 && <span className="text-xs font-normal text-[#594139]">Belum ada kiosk aktif untuk cafe ini.</span>}
        </label>
        <div className="rounded-xl border border-[#E9E1E6] bg-[#FFF7F2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Kamera terminal</p>
              <p role="status" aria-live="polite" className="mt-1 text-xs font-normal text-[#594139]">
                {cameraReady ? "Kamera aktif dan siap digunakan di Sesi Foto." : "Aktifkan kamera di terminal ini sebelum memulai sesi foto."}
              </p>
            </div>
            <button type="button" onClick={() => void enableCamera()} disabled={checkingCamera} className="inline-flex items-center gap-2 rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold text-[#241435] transition hover:border-[#FF6B35] disabled:cursor-wait disabled:opacity-60">
              <span className="material-symbols-outlined text-lg">{checkingCamera ? "hourglass_top" : cameraReady ? "check_circle" : "photo_camera"}</span>
              {checkingCamera ? "Memeriksa..." : cameraReady ? "Uji Lagi" : "Aktifkan Kamera"}
            </button>
          </div>
          {cameraStream && (
            <video
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              className="mt-4 aspect-video w-full rounded-xl bg-[#241435] object-cover"
              aria-label="Pratinjau kamera terminal"
            />
          )}
        </div>
        <button type="button" onClick={save} className="rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white">Simpan Konfigurasi</button>
      </section>
    </div>
  );
}
