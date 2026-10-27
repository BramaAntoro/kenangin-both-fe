import { useCallback, useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type Frame = {
  id: string;
  cafeId: string | null;
  title: string;
  locationName: string;
  frameUrl: string;
  maxPhotosSlot: number;
  isActive: boolean | null;
};

type FrameForm = {
  title: string;
  maxPhotosSlot: string;
  isActive: boolean;
  file: File | null;
};

type FramesResponse = {
  frames: { global: Frame[]; cafes: { cafeId: string; cafeName: string; frames: Frame[] }[] };
  locations?: { id: string; name: string }[];
};

type ApiErrorResponse = { message?: string };

const emptyForm: FrameForm = { title: "", maxPhotosSlot: "3", isActive: true, file: null };

function frameImageUrl(frameUrl: string) {
  return frameUrl.startsWith("http") ? frameUrl : new URL(frameUrl, api.defaults.baseURL).toString();
}

export default function FrameManagementDashboard() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [cafeLocations, setCafeLocations] = useState<
    { id: string; name: string }[]
  >([]);
  const [locationFilter, setLocationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FrameForm>(emptyForm);
  const [editing, setEditing] = useState<Frame | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadFrames = useCallback(async (
    pageValue: number,
    locationValue: string,
    signal?: AbortSignal,
  ) => {
    const response = await api.get<ApiEnvelope<FramesResponse>>("/booth/frames", {
      params: { page: pageValue, limit: 6, location: locationValue },
      signal,
    });
    const { global, cafes } = response.data.data.frames;
    setCafeLocations(
      response.data.data.locations ?? cafes.map(({ cafeId, cafeName }) => ({ id: cafeId, name: cafeName })),
    );
    setFrames([
      ...global.map((frame) => ({
        ...frame,
        locationName: "Frame Global",
      })),
      ...cafes.flatMap(({ cafeName, frames: cafeFrames }) =>
        cafeFrames.map((frame) => ({
          ...frame,
          locationName: cafeName,
        })),
      ),
    ]);
    const totalPages = response.data.meta?.totalPages ?? 0;
    setMeta({
      currentPage: response.data.meta?.currentPage ?? pageValue,
      totalPages,
      totalItems: response.data.meta?.totalItems ?? 0,
    });
    setPage((currentPage) =>
      currentPage > Math.max(totalPages, 1) ? Math.max(totalPages, 1) : currentPage,
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        await loadFrames(page, locationFilter, controller.signal);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted && isAxiosError<ApiErrorResponse>(requestError)) {
          setError(requestError.response?.data?.message ?? "Gagal memuat frame.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [loadFrames, locationFilter, page]);

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  function openCreate() {
    setError("");
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEdit(frame: Frame) {
    setError("");
    setEditing(frame);
    setForm({ title: frame.title, maxPhotosSlot: String(frame.maxPhotosSlot), isActive: frame.isActive !== false, file: null });
    setIsFormOpen(true);
  }

  async function saveFrame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing && !form.file) {
      setError("File PNG frame wajib dipilih.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("maxPhotosSlot", form.maxPhotosSlot);
    if (editing) payload.append("is_active", String(form.isActive));
    if (form.file) payload.append("file", form.file);

    try {
      if (editing) {
        await api.put(`/booth/frames/${editing.id}`, payload);
      } else {
        await api.post("/booth/frames", payload);
      }
      await loadFrames(page, locationFilter);
      closeForm();
    } catch (requestError: unknown) {
      setError(isAxiosError<ApiErrorResponse>(requestError) ? requestError.response?.data?.message ?? "Gagal menyimpan frame." : "Gagal menyimpan frame.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFrame(frame: Frame) {
    if (!window.confirm(`Nonaktifkan frame ${frame.title}? Frame tetap tersimpan untuk sesi lama.`)) return;
    setError("");
    try {
      await api.delete(`/booth/frames/${frame.id}`);
      await loadFrames(page, locationFilter);
    } catch (requestError: unknown) {
      setError(isAxiosError<ApiErrorResponse>(requestError) ? requestError.response?.data?.message ?? "Gagal menonaktifkan frame." : "Gagal menonaktifkan frame.");
    }
  }

  const totalPages = Math.max(meta.totalPages, 1);

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Kelola Frame</h1>
        <p className="mt-1 text-sm text-[#594139]">Frame global dan frame kafe yang diambil langsung dari server.</p>
      </header>

      {error && <p className="mb-5 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{error}</p>}

      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6">
          <div><h2 className="font-display text-xl font-semibold">Semua Frame</h2><p className="mt-1 text-sm text-[#594139]">Nama kafe ditampilkan pada setiap frame kafe.</p></div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-xs font-semibold text-[#594139]">
              Lokasi
              <select
                value={locationFilter}
                onChange={(event) => {
                  setLocationFilter(event.target.value);
                  setPage(1);
                }}
                className="h-10 min-w-48 rounded-xl border border-[#E9E1E6] bg-white px-3 text-sm text-[#241435] outline-none focus:border-[#FF6B35]"
              >
                <option value="all">Semua Lokasi</option>
                <option value="global">Frame Global</option>
                {cafeLocations.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"><span className="material-symbols-outlined text-lg">add</span>Tambah Frame</button>
          </div>
        </div>

        {loading ? <p className="p-8 text-center text-sm text-[#594139]">Memuat frame…</p> : <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">{frames.map((frame) => <article key={frame.id} className="overflow-hidden rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2]"><div className="grid aspect-[4/3] place-items-center p-4"><img src={frameImageUrl(frame.frameUrl)} alt={`Pratinjau ${frame.title}`} className="h-full max-w-full object-contain" /></div><div className="border-t border-[#E9E1E6] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="mb-1 text-[11px] font-semibold uppercase text-[#594139]">{frame.locationName}</p><h3 className="font-display text-lg font-semibold">{frame.title}</h3><p className="mt-1 text-xs text-[#594139]">{frame.maxPhotosSlot} slot foto</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${frame.isActive !== false ? "bg-[#2E7D32]/10 text-[#2E7D32]" : "bg-[#ffdad6] text-[#D32F2F]"}`}>{frame.isActive !== false ? "Aktif" : "Nonaktif"}</span></div><div className="mt-4 flex gap-3"><button type="button" onClick={() => openEdit(frame)} className="text-sm font-semibold text-[#FF6B35] hover:underline">Ubah</button><button type="button" onClick={() => void deleteFrame(frame)} disabled={frame.isActive === false} className="text-sm font-semibold text-[#D32F2F] hover:underline disabled:cursor-not-allowed disabled:opacity-50">Nonaktifkan</button></div></div></article>)}{frames.length === 0 && <p className="py-10 text-center text-sm text-[#594139] sm:col-span-2 lg:col-span-3">Tidak ada frame pada lokasi ini.</p>}</div>}

        {!loading && <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E9E1E6] bg-[#FFF7F2] p-5 sm:flex-row sm:px-6"><p className="text-xs text-[#594139]">Menampilkan {frames.length} dari {meta.totalItems} frame</p><div className="flex items-center gap-1.5"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_left</span></button>{Array.from({ length: Math.max(1, Math.min(totalPages, 5)) }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`flex size-8 items-center justify-center rounded-xl text-xs font-semibold transition-all ${page === pageNumber ? "bg-[#FF6B35] text-white" : "border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2]"}`}>{pageNumber}</button>)}<button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="flex size-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] hover:bg-[#FFF7F2] disabled:opacity-40"><span className="material-symbols-outlined text-base">chevron_right</span></button></div></div>}
      </section>

      {isFormOpen && <div className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="frame-form-title"><form onSubmit={saveFrame} className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"><h3 id="frame-form-title" className="font-display text-lg font-semibold">{editing ? `Ubah ${editing.title}` : "Frame Baru"}</h3><label className="text-sm font-medium">Judul Frame<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">Jumlah Slot Foto<input required min="1" step="1" type="number" value={form.maxPhotosSlot} onChange={(event) => setForm({ ...form, maxPhotosSlot: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label>{editing && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="size-4 accent-[#FF6B35]" />Frame aktif</label>}<label className="text-sm font-medium">File PNG {editing && <span className="font-normal text-[#594139]">(opsional)</span>}<input required={!editing} accept="image/png" type="file" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })} className="mt-1.5 block w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#FFF7F2] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#FF6B35]" /><span className="mt-1 block text-xs font-normal text-[#594139]">PNG transparan, maksimal 5 MB.</span></label><div className="flex gap-3"><button disabled={saving} type="submit" className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan"}</button><button disabled={saving} type="button" onClick={closeForm} className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold">Batal</button></div></form></div>}
    </div>
  );
}
