import { useEffect, useState, useMemo, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type Kiosk = {
  id: string;
  cafeId: string;
  kioskCode: string;
  name: string;
  status: "active" | "maintenance" | "offline" | null;
};
type KioskRow = Kiosk & { cafeName: string };
type Cafe = { id: string; name: string };
type KioskForm = {
  cafeId: string;
  name: string;
  status: "active" | "maintenance" | "offline";
};
type ApiErrorResponse = { message?: string; error?: unknown };

const emptyForm: KioskForm = { cafeId: "", name: "", status: "active" };

function formErrorMessages(data?: ApiErrorResponse): string[] {
  const details = data?.error;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const messages = Object.entries(details).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter((message): message is string => typeof message === "string")
        .map((message) => `${field}: ${message}`);
    });
    if (messages.length) return [...new Set(messages)];
  }
  return [data?.message ?? "Gagal menyimpan kiosk."];
}

export default function KioskManagementDashboard() {
  const [kiosks, setKiosks] = useState<KioskRow[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCafes, setLoadingCafes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [form, setForm] = useState<KioskForm>(emptyForm);
  const [editing, setEditing] = useState<KioskRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const totalPages = Math.max(meta.totalPages, 1);

  // Pagination window (maksimal 5 tombol angka di sekitar halaman aktif)
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  async function loadData(pageValue = page, searchValue = search, signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ kiosks: KioskRow[] }>>("/kiosks", {
      params: {
        page: pageValue,
        limit: 5,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
      },
      signal,
    });

    setKiosks(response.data.data.kiosks);
    setMeta({
      currentPage: response.data.meta?.currentPage ?? pageValue,
      totalPages: response.data.meta?.totalPages ?? 1,
      totalItems: response.data.meta?.totalItems ?? 0,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const timeout = window.setTimeout(
      () => {
        loadData(page, search, controller.signal)
          .catch((requestError: unknown) => {
            if (controller.signal.aborted) return;
            if (isAxiosError<ApiErrorResponse>(requestError)) {
              setError(requestError.response?.data?.message ?? "Gagal memuat data kiosk.");
            } else {
              setError("Terjadi kesalahan saat memuat data kiosk.");
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      search ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, search]);

  // Handle tombol escape untuk menutup modal
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isFormOpen && !saving) {
        closeForm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, saving]);

  async function ensureCafesLoaded() {
    if (cafes.length > 0) return;
    setLoadingCafes(true);
    try {
      const response = await api.get<ApiEnvelope<{ cafes: Record<string, Cafe> }>>("/cafes?limit=100");
      setCafes(Object.values(response.data.data.cafes));
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setFormErrors(formErrorMessages(requestError.response?.data));
      } else {
        setFormErrors(["Gagal memuat daftar kafe."]);
      }
    } finally {
      setLoadingCafes(false);
    }
  }

  async function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(true);
    await ensureCafesLoaded();
  }

  async function openEdit(kiosk: KioskRow) {
    setEditing(kiosk);
    setForm({ cafeId: kiosk.cafeId, name: kiosk.name, status: kiosk.status ?? "active" });
    setFormErrors([]);
    setIsFormOpen(true);
    await ensureCafesLoaded();
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(false);
  }

  async function saveKiosk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormErrors([]);
    try {
      if (editing) {
        await api.put(`/kiosks/${editing.id}`, form);
      } else {
        await api.post("/kiosks", form);
      }
      await loadData(1, search);
      setPage(1);
      closeForm();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setFormErrors(formErrorMessages(requestError.response?.data));
      } else {
        setFormErrors(["Gagal menyimpan kiosk."]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteKiosk(kiosk: KioskRow) {
    if (!window.confirm(`Hapus ${kiosk.name}? Data kiosk yang dihapus tidak dapat dipulihkan.`)) return;
    setError("");
    setDeletingId(kiosk.id);
    try {
      await api.delete(`/kiosks/${kiosk.id}`);
      const nextPage = kiosks.length === 1 && page > 1 ? page - 1 : page;
      await loadData(nextPage, search);
      setPage(nextPage);
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setError(requestError.response?.data?.message ?? "Gagal menghapus kiosk.");
      } else {
        setError("Gagal menghapus kiosk.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Kelola Kiosk</h1>
        <p className="mt-1 text-sm text-[#594139]">Unit photo booth dari server.</p>
      </header>

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-xs font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Daftar Kiosk</h2>
            <p className="mt-1 text-sm text-[#594139]">Tambah, ubah, atau hapus unit photo booth.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex min-w-70 items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-lg text-[#594139]">search</span>
              <input
                className="h-11 w-full rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] pl-10 pr-4 text-sm text-[#241435] outline-none transition-colors focus:border-[#FF6B35]"
                placeholder="Cari kiosk, kode, atau kafe..."
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E85A2A]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Tambah Kiosk
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-[#594139]">Memuat data kiosk…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]">
                <tr>
                  <th className="px-6 py-4">Kiosk</th>
                  <th className="px-4 py-4">Kafe</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1E6]">
                {kiosks.map((kiosk) => {
                  const isDeleting = deletingId === kiosk.id;
                  return (
                    <tr key={kiosk.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{kiosk.name}</p>
                        <p className="mt-1 text-xs text-[#594139]">{kiosk.kioskCode}</p>
                      </td>
                      <td className="px-4 py-4">{kiosk.cafeName}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#FFF7F2] px-2.5 py-1 text-xs font-semibold text-[#795900]">
                          {kiosk.status ?? "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => openEdit(kiosk)}
                          className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline disabled:opacity-40"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => void deleteKiosk(kiosk)}
                          className="text-sm font-semibold text-[#D32F2F] hover:underline disabled:opacity-40"
                        >
                          {isDeleting ? "Menghapus…" : "Hapus"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {kiosks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-[#594139]">
                      Belum ada kiosk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col justify-between gap-4 border-t border-[#E9E1E6] bg-[#FFF7F2] p-5 text-sm sm:flex-row sm:items-center sm:px-6">
            <span className="text-xs text-[#594139]">
              Halaman {meta.currentPage} dari {totalPages} ({meta.totalItems} kiosk)
            </span>
            <div className="flex items-center gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] transition-opacity disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((val) => Math.max(1, val - 1))}
                type="button"
                aria-label="Halaman sebelumnya"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              {visiblePages.map((itemPage) => (
                <button
                  key={itemPage}
                  onClick={() => setPage(itemPage)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold transition-colors ${
                    page === itemPage
                      ? "bg-[#FF6B35] text-white shadow-xs"
                      : "border border-[#E9E1E6] bg-white text-[#241435] hover:border-[#FF6B35]"
                  }`}
                  type="button"
                >
                  {itemPage}
                </button>
              ))}

              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] transition-opacity disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((val) => Math.min(totalPages, val + 1))}
                type="button"
                aria-label="Halaman berikutnya"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiosk-form-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) closeForm();
          }}
        >
          <form
            onSubmit={saveKiosk}
            className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"
          >
            <h3 id="kiosk-form-title" className="font-display text-lg font-semibold">
              {editing ? `Ubah ${editing.name}` : "Kiosk Baru"}
            </h3>

            {formErrors.length > 0 && (
              <div className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">
                <p className="font-semibold">Periksa data berikut:</p>
                <ul className="mt-1 list-disc pl-5">
                  {formErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <label className="text-sm font-medium">
              Kafe
              <select
                required
                disabled={loadingCafes || saving}
                value={form.cafeId}
                onChange={(event) => setForm({ ...form, cafeId: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"
              >
                <option value="">{loadingCafes ? "Memuat kafe…" : "Pilih kafe"}</option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Nama Kiosk
              <input
                required
                disabled={saving}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Contoh: Booth Lantai 1"
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"
              />
            </label>

            <label className="text-sm font-medium">
              Status
              <select
                disabled={saving}
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as KioskForm["status"] })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"
              >
                <option value="active">Aktif</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                disabled={saving || loadingCafes}
                type="submit"
                className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button
                disabled={saving}
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-neutral-50"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}