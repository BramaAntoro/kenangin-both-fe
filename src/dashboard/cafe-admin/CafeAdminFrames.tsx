import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type Cafe = { id: string; name: string };
type Frame = {
  id: string;
  cafeId: string | null;
  title: string;
  frameUrl: string;
  maxPhotosSlot: number;
  isActive: boolean | null;
};
type FramesResponse = {
  frames: {
    global: Frame[];
    cafes: { cafeId: string; cafeName: string; frames: Frame[] }[];
  };
};
type FrameForm = {
  title: string;
  maxPhotosSlot: string;
  isActive: boolean;
  file: File | null;
};
type ApiErrorResponse = { message?: string };

const emptyForm: FrameForm = {
  title: "",
  maxPhotosSlot: "3",
  isActive: true,
  file: null,
};

function getErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message ?? fallback
    : fallback;
}

function frameImageUrl(frameUrl: string) {
  return frameUrl.startsWith("http")
    ? frameUrl
    : new URL(frameUrl, api.defaults.baseURL).toString();
}

async function fetchCafeFrames(cafeId: string, page: number, signal?: AbortSignal) {
  const response = await api.get<ApiEnvelope<FramesResponse>>(
    `/booth/frames?cafe_id=${encodeURIComponent(cafeId)}&page=${page}&limit=5`,
    { signal },
  );
  const { global, cafes: cafeGroups } = response.data.data.frames;
  const cafeFrames =
    cafeGroups.find((cafe) => cafe.cafeId === cafeId)?.frames ?? [];
  return {
    frames: [...global, ...cafeFrames],
    totalItems: response.data.meta?.totalItems ?? 0,
    totalPages: response.data.meta?.totalPages ?? 0,
  };
}

export default function CafeAdminFrames() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [cafesLoading, setCafesLoading] = useState(true);
  const [framesLoading, setFramesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formCafeId, setFormCafeId] = useState("");
  const [form, setForm] = useState<FrameForm>(emptyForm);
  const [editing, setEditing] = useState<Frame | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const firstPage = await api.get<ApiEnvelope<{ cafes: Cafe[] }>>(
          "/reports/revenue-recap/mine/cafes?page=1&limit=50",
          { signal: controller.signal },
        );
        const allCafes = [...firstPage.data.data.cafes];
        const totalPages = firstPage.data.meta?.totalPages ?? 1;
        for (let page = 2; page <= totalPages; page += 1) {
          const response = await api.get<ApiEnvelope<{ cafes: Cafe[] }>>(
            `/reports/revenue-recap/mine/cafes?page=${page}&limit=50`,
            { signal: controller.signal },
          );
          allCafes.push(...response.data.data.cafes);
        }
        if (!controller.signal.aborted) {
          setCafes(allCafes);
          setSelectedCafeId(allCafes[0]?.id ?? "");
        }
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, "Gagal memuat daftar kafe."));
        }
      } finally {
        if (!controller.signal.aborted) setCafesLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCafeId) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setFramesLoading(true);
      setError("");
      void fetchCafeFrames(selectedCafeId, page, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setFrames(result.frames);
            setTotalItems(result.totalItems);
            setTotalPages(Math.max(result.totalPages, 1));
          }
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(getErrorMessage(requestError, "Gagal memuat frame kafe."));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setFramesLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedCafeId, page]);

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(false);
  }

  function openCreate() {
    setError("");
    setFormError("");
    setEditing(null);
    setFormCafeId(selectedCafeId);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEdit(frame: Frame) {
    setError("");
    setFormError("");
    setEditing(frame);
    setForm({
      title: frame.title,
      maxPhotosSlot: String(frame.maxPhotosSlot),
      isActive: frame.isActive !== false,
      file: null,
    });
    setIsFormOpen(true);
  }

  async function saveFrame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing && !form.file) {
      setFormError("File PNG frame wajib dipilih.");
      return;
    }
    const targetCafeId = editing ? selectedCafeId : formCafeId;
    if (!targetCafeId) {
      setFormError("Pilih kafe untuk frame ini.");
      return;
    }

    setSaving(true);
    setFormError("");
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("maxPhotosSlot", form.maxPhotosSlot);
    if (editing) {
      payload.append("is_active", String(form.isActive));
    } else {
      payload.append("cafeId", targetCafeId);
    }
    if (form.file) payload.append("file", form.file);

    try {
      if (editing) {
        await api.put(`/booth/frames/${editing.id}`, payload);
      } else {
        await api.post("/booth/frames", payload);
      }
      closeForm();
      if (targetCafeId !== selectedCafeId) {
        setPage(1);
        setSelectedCafeId(targetCafeId);
      } else {
        const result = await fetchCafeFrames(targetCafeId, page);
        setFrames(result.frames);
        setTotalItems(result.totalItems);
        setTotalPages(Math.max(result.totalPages, 1));
      }
    } catch (requestError: unknown) {
      setFormError(getErrorMessage(requestError, "Gagal menyimpan frame."));
    } finally {
      setSaving(false);
    }
  }

  async function deactivateFrame(frame: Frame) {
    if (!window.confirm(`Nonaktifkan frame ${frame.title}?`)) return;
    setError("");
    try {
      await api.delete(`/booth/frames/${frame.id}`);
      const result = await fetchCafeFrames(selectedCafeId, page);
      setFrames(result.frames);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Gagal menonaktifkan frame."));
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-16 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Kelola Frame
          </h1>
          <p className="mt-1 text-sm text-[#594139]">
            Atur variasi overlay foto untuk kafe Anda.
          </p>
        </div>
        <label className="grid gap-1.5 text-xs font-semibold text-[#594139]">
          Lokasi Kafe
          <select
            value={selectedCafeId}
            disabled={cafesLoading || cafes.length === 0 || isFormOpen}
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
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"
        >
          {error}
        </p>
      )}

      {cafesLoading ? (
        <p className="rounded-2xl border border-[#E9E1E6] bg-white p-8 text-center text-sm text-[#594139]">
          Memuat kafe…
        </p>
      ) : cafes.length === 0 ? (
        <p className="rounded-2xl border border-[#E9E1E6] bg-white p-8 text-center text-sm text-[#594139]">
          Belum ada kafe yang terhubung ke akun Anda.
        </p>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#E9E1E6] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9E1E6] p-5">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Frame Global & Kafe
              </h2>
              <p className="mt-1 text-sm text-[#594139]">
                PNG transparan, maksimal 5 MB.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              disabled={!selectedCafeId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Tambah Frame
            </button>
          </div>

          {framesLoading ? (
            <p className="p-8 text-center text-sm text-[#594139]">
              Memuat frame…
            </p>
          ) : (
            <>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {frames.map((frame) => (
                <article
                  key={frame.id}
                  className="overflow-hidden rounded-xl border border-[#E9E1E6]"
                >
                  <div className="grid aspect-[4/3] place-items-center bg-[#FFF7F2] p-4">
                    <img
                      src={frameImageUrl(frame.frameUrl)}
                      alt={`Pratinjau ${frame.title}`}
                      className="h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="border-t border-[#E9E1E6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold">
                          {frame.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#594139]">
                          {frame.maxPhotosSlot} slot foto
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          frame.isActive !== false
                            ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {frame.isActive !== false ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-4">
                      {frame.cafeId === null ? (
                        <span className="text-xs text-[#594139]">
                          Frame global
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(frame)}
                            className="text-sm font-semibold text-[#FF6B35] hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => void deactivateFrame(frame)}
                            disabled={frame.isActive === false}
                            className="text-sm font-semibold text-[#D32F2F] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nonaktifkan
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {frames.length === 0 && (
                <p className="py-10 text-center text-sm text-[#594139] sm:col-span-2 lg:col-span-3">
                  Belum ada frame global atau kafe untuk lokasi ini.
                </p>
              )}
            </div>
            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E9E1E6] bg-[#FFF7F2] p-5 sm:flex-row sm:px-6">
              <p className="text-xs text-[#594139]">
                Menampilkan {frames.length} dari {totalItems} frame
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || framesLoading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                {Array.from({ length: Math.max(1, Math.min(totalPages, 5)) }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    disabled={framesLoading}
                    onClick={() => setPage(pageNumber)}
                    className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                      page === pageNumber
                        ? "bg-[#FF6B35] text-white"
                        : "border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages || framesLoading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
            </>
          )}
        </section>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cafe-frame-form-title"
        >
          <form
            onSubmit={saveFrame}
            className="grid w-full max-w-xl gap-4 rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"
          >
            <h2
              id="cafe-frame-form-title"
              className="font-display text-xl font-semibold"
            >
              {editing ? `Ubah ${editing.title}` : "Frame Baru"}
            </h2>
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"
              >
                {formError}
              </p>
            )}
            {!editing && (
              <label className="text-sm font-medium">
                Lokasi Kafe
                <select
                  required
                  value={formCafeId}
                  onChange={(event) => setFormCafeId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                >
                  <option value="">Pilih kafe</option>
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm font-medium">
              Judul Frame
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            <label className="text-sm font-medium">
              Jumlah Slot Foto
              <input
                required
                min="1"
                step="1"
                type="number"
                value={form.maxPhotosSlot}
                onChange={(event) =>
                  setForm({ ...form, maxPhotosSlot: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
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
                Frame aktif
              </label>
            )}
            <label className="text-sm font-medium">
              File PNG {editing && <span className="font-normal">(opsional)</span>}
              <input
                required={!editing}
                accept="image/png"
                type="file"
                onChange={(event) =>
                  setForm({
                    ...form,
                    file: event.target.files?.[0] ?? null,
                  })
                }
                className="mt-1.5 block w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#FFF7F2] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#FF6B35]"
              />
            </label>
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