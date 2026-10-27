import { useEffect, useState } from "react";
import { useParams } from "react-router";
import api from "../lib/client/axios";
import type { ApiEnvelope } from "../dashboard/types";

type PublicSession = {
  softfileUrl: string | null;
  printStatus: string | null;
};

export default function PhotoDownloadPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [session, setSession] = useState<PublicSession | null>(null);
  const [error, setError] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [notice, setNotice] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;
    const controller = new AbortController();
    void api
      .get<ApiEnvelope<{ session: PublicSession }>>(
        `/booth/sessions/${encodeURIComponent(sessionCode)}`,
        { signal: controller.signal },
      )
      .then((response) => setSession(response.data.data.session))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Hasil foto belum tersedia atau tautan sudah tidak berlaku.");
        }
      });
    return () => controller.abort();
  }, [sessionCode]);

  useEffect(() => {
    if (!zoomed) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomed]);

  const photoUrl = session?.softfileUrl
    ? session.softfileUrl.startsWith("http")
      ? session.softfileUrl
      : new URL(session.softfileUrl, api.defaults.baseURL).toString()
    : "";

  async function downloadPhoto() {
    if (!photoUrl || downloading) return;
    setDownloading(true);
    setNotice("");
    try {
      const response = await api.get<Blob>(photoUrl, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${sessionCode ?? "kenangin"}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice("Foto berhasil diunduh.");
    } catch {
      setNotice("Foto gagal diunduh. Periksa koneksi lalu coba lagi.");
    } finally {
      setDownloading(false);
    }
    window.setTimeout(() => setNotice(""), 3000);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF7F2] px-4 py-8 font-sans text-[#241435] sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 size-56 rounded-full bg-[#FFC845]/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-72 size-64 rounded-full bg-[#3FB6E0]/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <img src="/wordmarks/wordmark-removebg-preview.webp" alt="Kenangin" className="h-10 w-auto" />
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Simpan momen
              <span className="block text-[#FF6B35]">favoritmu!</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#594139] lg:mx-0">
              Foto ini sudah dibingkai khusus untukmu. Unduh dan simpan ceritanya kapan saja.
            </p>
            {sessionCode && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E9E1E6] bg-white/80 px-4 py-2 text-xs font-semibold text-[#594139]">
                <span className="material-symbols-outlined text-base text-[#3FB6E0]">confirmation_number</span>
                Kenangan #{sessionCode}
              </p>
            )}

            {error && (
              <p role="alert" className="mx-auto mt-6 max-w-md rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a] lg:mx-0">
                <span className="material-symbols-outlined mr-2 align-middle">error</span>
                {error}
              </p>
            )}
            {!error && !session && (
              <div role="status" className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-[#E9E1E6] bg-white p-4 text-left text-sm text-[#594139] lg:mx-0">
                <span className="material-symbols-outlined animate-pulse text-2xl text-[#FF6B35]">photo_camera</span>
                Sebentar, kenanganmu sedang disiapkan…
              </div>
            )}
            {session && !photoUrl && !error && (
              <p role="status" className="mx-auto mt-6 max-w-md rounded-2xl border border-[#FFC845]/60 bg-[#FFC845]/20 px-4 py-3 text-sm text-[#594139] lg:mx-0">
                Foto digitalnya belum tersedia. Coba buka kembali tautan ini sebentar lagi, ya.
              </p>
            )}
            {notice && <p role="status" className="mt-4 text-sm font-semibold text-[#2E7D32]">{notice}</p>}
          </div>

            <div className="order-1 mx-auto grid min-h-72 w-full max-w-lg place-items-center lg:order-2 lg:min-h-[520px]">
              {!imageLoaded && photoUrl && (
                <span className="text-sm text-[#594139]">
                  <span className="material-symbols-outlined mr-2 animate-pulse align-middle text-[#FF6B35]">hourglass_top</span>
                  Memuat foto…
                </span>
              )}
              {photoUrl && (
                <button type="button" onClick={() => setZoomed(true)} className="group grid max-h-[72vh] max-w-full place-items-center" aria-label="Perbesar hasil foto">
                  <img
                    src={photoUrl}
                    alt="Foto kenangan dengan frame"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setError("Foto gagal dimuat. Periksa koneksi lalu coba lagi.")}
                    className={`max-h-[72vh] max-w-full rotate-[1.5deg] object-contain shadow-[0_24px_70px_rgba(36,20,53,0.2)] transition duration-300 group-hover:rotate-0 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  />
                </button>
              )}
              {!photoUrl && !session && (
                <span className="grid size-20 place-items-center rounded-full bg-white text-[#FF6B35] shadow-sm">
                  <span className="material-symbols-outlined animate-pulse text-4xl">photo_camera</span>
                </span>
              )}
              {!photoUrl && error && (
                <span className="grid size-20 place-items-center rounded-full bg-white text-[#D32F2F] shadow-sm">
                  <span className="material-symbols-outlined text-4xl">broken_image</span>
                </span>
              )}
            </div>
        </section>

        {photoUrl && (
          <section className="mx-auto mt-4 max-w-3xl rounded-3xl border border-[#E9E1E6] bg-white/90 p-5 shadow-sm sm:p-7">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="font-display text-xl font-semibold">Bawa pulang kenangannya</h2>
                <p className="mt-1 text-sm text-[#594139]">Simpan foto kenangan ini ke perangkatmu.</p>
              </div>
              <button type="button" onClick={() => void downloadPhoto()} disabled={downloading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,107,53,0.22)] transition hover:-translate-y-0.5 hover:bg-[#E85A2A] disabled:cursor-wait disabled:opacity-70 sm:w-auto">
                <span className="material-symbols-outlined">{downloading ? "hourglass_top" : "download"}</span>
                {downloading ? "Mengunduh…" : "Unduh Foto"}
              </button>
            </div>
          </section>
        )}

      </div>

      {zoomed && photoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto kenangan"
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomed(false);
          }}
          className="fixed inset-0 z-50 grid place-items-center bg-[#241435]/90 p-4 backdrop-blur-sm"
        >
          <button type="button" onClick={() => setZoomed(false)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25" aria-label="Tutup foto">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={photoUrl} alt="Foto kenangan diperbesar" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </main>
  );
}
