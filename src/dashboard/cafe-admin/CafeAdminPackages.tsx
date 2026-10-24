import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type PackageFeatures = {
  timer_duration?: number;
  allow_filters?: boolean;
  retake_limit?: number;
  allow_emoji?: boolean;
  allow_custom_text?: boolean;
};
type CafePackage = {
  id: string;
  cafeId: string;
  name: string;
  price: number;
  photoShotsCount: number;
  printCopiesCount: number;
  features: PackageFeatures | null;
  description: string | null;
  isActive: boolean | null;
};
type Cafe = { id: string; name: string };
type CafeListResponse = { cafes: Cafe[] };
type CafePackagesResponse = {
  cafe: { id: string; name: string; packages: CafePackage[] };
};
type PackageForm = {
  cafeId: string;
  name: string;
  price: string;
  photoShotsCount: string;
  timerDuration: string;
  allowFilters: boolean;
  printCopiesCount: string;
  description: string;
  isActive: boolean;
};
type ApiErrorResponse = { message?: string };

const emptyForm: PackageForm = {
  cafeId: "",
  name: "",
  price: "",
  photoShotsCount: "3",
  timerDuration: "5",
  allowFilters: true,
  printCopiesCount: "1",
  description: "",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message ?? fallback
    : fallback;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

async function fetchCafePackages(cafeId: string, page: number, signal?: AbortSignal) {
  return api.get<ApiEnvelope<CafePackagesResponse>>(
    `/booth/packages/${encodeURIComponent(cafeId)}`,
    { params: { page, limit: 5 }, signal },
  );
}

export default function CafeAdminPackages() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [packages, setPackages] = useState<CafePackage[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [editing, setEditing] = useState<CafePackage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await api.get<ApiEnvelope<CafeListResponse>>(
          "/reports/revenue-recap/mine/cafes?page=1&limit=50",
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setCafes(response.data.data.cafes);
          setSelectedCafeId(response.data.data.cafes[0]?.id ?? "");
        }
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, "Gagal memuat paket foto."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCafeId) {
      setPackages([]);
      setPageMeta({ totalItems: 0, totalPages: 0 });
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetchCafePackages(selectedCafeId, page, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setPackages(response.data.data.cafe.packages);
        setPageMeta({
          totalItems: response.data.meta?.totalItems ?? 0,
          totalPages: response.data.meta?.totalPages ?? 0,
        });
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, "Gagal memuat paket foto."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedCafeId, page]);

  const selectedCafe = cafes.find((cafe) => cafe.id === selectedCafeId);

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  function openCreate() {
    setError("");
    setEditing(null);
    setForm({ ...emptyForm, cafeId: selectedCafeId });
    setIsFormOpen(true);
  }

  function openEdit(boothPackage: CafePackage) {
    setError("");
    setEditing(boothPackage);
    setForm({
      cafeId: boothPackage.cafeId,
      name: boothPackage.name,
      price: String(boothPackage.price),
      photoShotsCount: String(boothPackage.photoShotsCount),
      timerDuration: String(boothPackage.features?.timer_duration ?? 0),
      allowFilters: boothPackage.features?.allow_filters ?? false,
      printCopiesCount: String(boothPackage.printCopiesCount),
      description: boothPackage.description ?? "",
      isActive: boothPackage.isActive !== false,
    });
    setIsFormOpen(true);
  }

  async function refreshPackages(cafeId = selectedCafeId, pageValue = page) {
    const response = await fetchCafePackages(cafeId, pageValue);
    setPackages(response.data.data.cafe.packages);
    const totalItems = response.data.meta?.totalItems ?? 0;
    const totalPages = response.data.meta?.totalPages ?? 0;
    setPageMeta({ totalItems, totalPages });
    if (pageValue > Math.max(totalPages, 1)) {
      setPage(Math.max(totalPages, 1));
    }
  }

  async function savePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.cafeId) {
      setError("Pilih lokasi kafe untuk paket ini.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      cafeId: form.cafeId,
      name: form.name.trim(),
      price: Number(form.price),
      photoShotsCount: Number(form.photoShotsCount),
      printCopiesCount: Number(form.printCopiesCount),
      features: {
        timer_duration: Number(form.timerDuration),
        allow_filters: form.allowFilters,
      },
      description: form.description.trim() || undefined,
      ...(editing ? { isActive: form.isActive } : {}),
    };

    try {
      if (editing) {
        await api.put(`/booth/packages/${editing.id}`, payload);
      } else {
        await api.post("/booth/packages", payload);
      }
      closeForm();
      setSelectedCafeId(form.cafeId);
      setPage(1);
      await refreshPackages(form.cafeId, 1);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Gagal menyimpan paket."));
    } finally {
      setSaving(false);
    }
  }

  async function deletePackage(boothPackage: CafePackage) {
    if (
      !window.confirm(
        `Hapus paket ${boothPackage.name}? Paket yang dihapus tidak dapat dipulihkan.`,
      )
    ) {
      return;
    }
    setError("");
    try {
      await api.delete(`/booth/packages/${boothPackage.id}`);
      await refreshPackages();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Gagal menghapus paket."));
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-16 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Kelola Paket Foto
          </h1>
          <p className="mt-1 text-sm text-[#594139]">
            Atur harga dan fitur sesi foto di kafe Anda.
          </p>
        </div>
        {cafes.length > 1 && (
          <label className="grid gap-1.5 text-xs font-semibold text-[#594139]">
            Lokasi Kafe
            <select
              value={selectedCafeId}
              disabled={loading || isFormOpen}
              onChange={(event) => {
                setSelectedCafeId(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-56 rounded-xl border border-[#E9E1E6] bg-white px-3 text-sm text-[#241435] outline-none focus:border-[#FF6B35] disabled:opacity-60"
            >
              {cafes.map((cafe) => (
                <option key={cafe.id} value={cafe.id}>
                  {cafe.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error && !isFormOpen && (
        <p
          role="alert"
          className="rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="rounded-2xl border border-[#E9E1E6] bg-white p-8 text-center text-sm text-[#594139]">
          Memuat paket foto…
        </p>
      ) : !selectedCafe ? (
        <p className="rounded-2xl border border-[#E9E1E6] bg-white p-8 text-center text-sm text-[#594139]">
          Belum ada kafe yang terhubung ke akun Anda.
        </p>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#E9E1E6] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9E1E6] p-5">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {selectedCafe.name}
              </h2>
              <p className="mt-1 text-sm text-[#594139]">
                {pageMeta.totalItems} paket terdaftar
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Tambah Paket
            </button>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((boothPackage) => (
              <article
                key={boothPackage.id}
                className="flex flex-col rounded-xl border border-[#E9E1E6] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {boothPackage.name}
                    </h3>
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
                  <p className="mt-3 text-sm text-[#594139]">
                    {boothPackage.description}
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#E9E1E6] pt-4 text-sm">
                  <dt className="text-[#594139]">Jepretan</dt>
                  <dd className="text-right font-medium">
                    {boothPackage.photoShotsCount} foto
                  </dd>
                  <dt className="text-[#594139]">Timer</dt>
                  <dd className="text-right font-medium">
                    {boothPackage.features?.timer_duration ?? 0} detik
                  </dd>
                  <dt className="text-[#594139]">Filter</dt>
                  <dd className="text-right font-medium">
                    {boothPackage.features?.allow_filters ? "Tersedia" : "Tidak tersedia"}
                  </dd>
                  <dt className="text-[#594139]">Cetakan</dt>
                  <dd className="text-right font-medium">
                    {boothPackage.printCopiesCount} salinan
                  </dd>
                </dl>
                <div className="mt-auto flex gap-4 pt-5">
                  <button
                    type="button"
                    onClick={() => openEdit(boothPackage)}
                    className="text-sm font-semibold text-[#FF6B35] hover:underline"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePackage(boothPackage)}
                    className="text-sm font-semibold text-[#D32F2F] hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
            {packages.length === 0 && (
              <p className="py-10 text-center text-sm text-[#594139] sm:col-span-2 xl:col-span-3">
                Belum ada paket foto di lokasi ini.
              </p>
            )}
          </div>
          {pageMeta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E9E1E6] px-5 py-4">
              <p className="text-sm text-[#594139]">
                Halaman {page} dari {pageMeta.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-[#E9E1E6] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= pageMeta.totalPages || loading}
                  onClick={() => setPage((current) => Math.min(pageMeta.totalPages, current + 1))}
                  className="rounded-lg border border-[#E9E1E6] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-form-title"
        >
          <form
            onSubmit={savePackage}
            className="my-auto grid w-full max-w-xl gap-4 rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"
          >
            <h2
              id="package-form-title"
              className="font-display text-xl font-semibold"
            >
              {editing ? `Ubah ${editing.name}` : "Paket Foto Baru"}
            </h2>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"
              >
                {error}
              </p>
            )}
            <label className="text-sm font-medium">
              Lokasi Kafe
              <select
                required
                disabled={saving}
                value={form.cafeId}
                onChange={(event) =>
                  setForm({ ...form, cafeId: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"
              >
                <option value="">Pilih kafe</option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Nama Paket
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            <label className="text-sm font-medium">
              Harga
              <div className="mt-1.5 flex h-10 items-center rounded-xl border border-[#E9E1E6] bg-white focus-within:border-[#FF6B35]">
                <span className="pl-3 text-sm font-semibold text-[#594139]">
                  Rp
                </span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  value={
                    form.price
                      ? new Intl.NumberFormat("id-ID").format(Number(form.price))
                      : ""
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="h-full w-full rounded-r-xl bg-transparent px-2 text-sm outline-none"
                />
              </div>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Jumlah Jepretan
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={form.photoShotsCount}
                  onChange={(event) =>
                    setForm({ ...form, photoShotsCount: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              <label className="text-sm font-medium">
                Durasi Timer (detik)
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={form.timerDuration}
                  onChange={(event) =>
                    setForm({ ...form, timerDuration: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Jumlah Cetakan
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={form.printCopiesCount}
                  onChange={(event) =>
                    setForm({ ...form, printCopiesCount: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.allowFilters}
                  onChange={(event) =>
                    setForm({ ...form, allowFilters: event.target.checked })
                  }
                  className="size-4 accent-[#FF6B35]"
                />
                Filter foto tersedia
              </label>
            </div>
            <label className="text-sm font-medium">
              Deskripsi <span className="font-normal text-[#594139]">(opsional)</span>
              <textarea
                maxLength={500}
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className="mt-1.5 w-full resize-y rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm({ ...form, isActive: event.target.checked })
                  }
                  className="size-4 accent-[#FF6B35]"
                />
                Paket aktif
              </label>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-[#E9E1E6] px-4 py-2 text-sm font-semibold text-[#594139]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}