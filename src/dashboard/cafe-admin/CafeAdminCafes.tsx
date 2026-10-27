import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type CafeAdminCafe = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  cafeSharePercent: number;
  kenanginSharePercent: number;
  isActive: boolean | null;
};

type Kiosk = {
  id: string;
  cafeId: string;
  kioskCode: string;
  name: string;
  status: "active" | "maintenance" | "offline" | null;
  createdAt: string | null;
  updatedAt: string | null;
};

interface CafeAdminCafesProps {
  onBack: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  maintenance: "Maintenance",
  offline: "Offline",
};
const statusColor: Record<string, string> = {
  active: "bg-[#2E7D32]/10 text-[#2E7D32]",
  maintenance: "bg-[#ED6C02]/10 text-[#ED6C02]",
  offline: "bg-gray-100 text-gray-500",
};
const dotColor: Record<string, string> = {
  active: "bg-[#2E7D32] animate-pulse",
  maintenance: "bg-[#ED6C02]",
  offline: "bg-gray-400",
};

// ─── Kiosk Popup ────────────────────────────────────────────────────────────
interface KioskPopupProps {
  cafe: CafeAdminCafe;
  kiosks: Kiosk[];
  loading: boolean;
  error: string;
  onClose: () => void;
}

function KioskPopup({ cafe, kiosks, loading, error, onClose }: KioskPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Popup header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[#E9E1E6]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#FFF7F2] text-[#FF6B35]">
              <span className="material-symbols-outlined text-xl">wifi_tethering</span>
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-[#241435]">
                Kiosk — {cafe.name}
              </h2>
              <p className="mt-0.5 text-xs text-[#594139] line-clamp-1">{cafe.address}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-xl text-[#594139] transition hover:bg-[#FFF7F2] hover:text-[#241435]"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Popup body */}
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-[#594139]">
              <div className="size-8 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
              <span>Memuat kiosk…</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] p-4 text-sm text-[#ba1a1a]">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          ) : kiosks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-[#594139]">
              <span className="material-symbols-outlined text-3xl text-[#E9E1E6]">
                devices_off
              </span>
              <p>Belum ada kiosk yang terdaftar di kafe ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#594139]">
                {kiosks.length} kiosk terdaftar
              </p>
              {kiosks.map((kiosk) => (
                <div
                  key={kiosk.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#FF6B35] border border-[#E9E1E6]">
                      <span className="material-symbols-outlined text-base">
                        photo_camera
                      </span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#241435]">
                        {kiosk.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[#594139]">
                        {kiosk.kioskCode}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColor[kiosk.status ?? "offline"]
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        dotColor[kiosk.status ?? "offline"]
                      }`}
                    />
                    {statusLabel[kiosk.status ?? "offline"] ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popup footer */}
        <div className="border-t border-[#E9E1E6] px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#FFF7F2] px-5 py-2 text-sm font-semibold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CafeAdminCafes({ onBack }: CafeAdminCafesProps) {
  const [cafes, setCafes] = useState<CafeAdminCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Popup state
  const [popupCafe, setPopupCafe] = useState<CafeAdminCafe | null>(null);
  const [kiosks, setKiosks] = useState<Record<string, Kiosk[]>>({});
  const [kioskLoading, setKioskLoading] = useState<Record<string, boolean>>({});
  const [kioskError, setKioskError] = useState<Record<string, string>>({});

  const LIMIT = 5;

  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      setLoading(true);
      api
        .get<ApiEnvelope<{ cafes: CafeAdminCafe[] }>>(
          `/reports/revenue-recap/mine/cafes?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(search.trim())}`,
          { signal: controller.signal },
        )
        .then((res) => {
          if (res.data?.data?.cafes) {
            setCafes(res.data.data.cafes);
            setTotalPages(Number(res.data.meta?.totalPages ?? 1));
            setTotalItems(Number(res.data.meta?.totalItems ?? 0));
          }
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              isAxiosError<{ message?: string }>(err)
                ? (err.response?.data?.message ?? "Gagal memuat data kafe.")
                : "Gagal memuat data kafe.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, search]);

  function openKioskPopup(cafe: CafeAdminCafe) {
    setPopupCafe(cafe);

    // Already fetched — skip
    if (kiosks[cafe.id] !== undefined) return;

    setKioskLoading((prev) => ({ ...prev, [cafe.id]: true }));
    api
      .get<ApiEnvelope<{ kiosks: Kiosk[] }>>(`/cafes/kiosks/${cafe.id}`)
      .then((res) => {
        setKiosks((prev) => ({
          ...prev,
          [cafe.id]: res.data?.data?.kiosks ?? [],
        }));
      })
      .catch(() => {
        setKioskError((prev) => ({
          ...prev,
          [cafe.id]: "Gagal memuat kiosk.",
        }));
      })
      .finally(() => {
        setKioskLoading((prev) => ({ ...prev, [cafe.id]: false }));
      });
  }

  return (
    <>
      {/* Kiosk popup */}
      {popupCafe && (
        <KioskPopup
          cafe={popupCafe}
          kiosks={kiosks[popupCafe.id] ?? []}
          loading={kioskLoading[popupCafe.id] ?? false}
          error={kioskError[popupCafe.id] ?? ""}
          onClose={() => setPopupCafe(null)}
        />
      )}

      <div className="flex w-full flex-col gap-6 pt-6">
        {/* Header */}
        <section>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-1 text-xs font-semibold text-[#FF6B35] hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Kembali ke Dashboard
          </button>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Kelola Kafe
          </h1>
          <p className="mt-1 text-sm text-[#594139]">
            Daftar kafe yang Anda kelola beserta detail kiosk di setiap lokasi.
          </p>
        </section>

        {/* Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#594139] text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau alamat kafe..."
            className="h-11 w-full rounded-2xl border border-[#E9E1E6] bg-white pl-10 pr-4 text-sm text-[#241435] outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] p-4 text-sm text-[#ba1a1a]"
          >
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-3xl border border-[#E9E1E6] bg-white p-8 text-sm text-[#594139]">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-[#FF6B35] border-t-transparent" />
              <span>Memuat daftar kafe…</span>
            </div>
          </div>
        ) : cafes.length === 0 ? (
          <div className="rounded-3xl border border-[#E9E1E6] bg-white p-10 text-center text-sm text-[#594139]">
            {search
              ? `Tidak ada kafe yang cocok dengan "${search}".`
              : "Belum ada kafe yang terhubung ke akun Anda."}
          </div>
        ) : (
          <>
            {/* Cafe list */}
            <div className="flex flex-col gap-4">
              {cafes.map((cafe) => (
                <article
                  key={cafe.id}
                  className="rounded-3xl border border-[#E9E1E6] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFF7F2] text-[#FF6B35]">
                        <span className="material-symbols-outlined text-xl">
                          local_cafe
                        </span>
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-base font-semibold truncate">
                            {cafe.name}
                          </h2>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              cafe.isActive
                                ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {cafe.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#594139] truncate">
                          {cafe.address}
                        </p>
                        <p className="mt-0.5 text-xs text-[#594139]">{cafe.phone}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden rounded-full border border-[#E9E1E6] bg-[#FFF7F2] px-3 py-1 text-xs font-medium sm:inline-flex">
                        Bagi Hasil:{" "}
                        <span className="ml-1 font-semibold text-[#795900]">
                          {cafe.cafeSharePercent}%
                        </span>{" "}
                        /{" "}
                        <span className="font-semibold text-[#FF6B35]">
                          {cafe.kenanginSharePercent}%
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openKioskPopup(cafe)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#FFF7F2] px-3 py-2 text-xs font-semibold text-[#FF6B35] transition hover:bg-[#FF6B35] hover:text-white"
                      >
                        <span className="material-symbols-outlined text-base">
                          wifi_tethering
                        </span>
                        Kiosk
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[#594139]">
                  Menampilkan {cafes.length} dari {totalItems} kafe
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40 hover:bg-[#FFF7F2]"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                          page === p
                            ? "bg-[#FF6B35] text-white"
                            : "border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2]"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40 hover:bg-[#FFF7F2]"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
