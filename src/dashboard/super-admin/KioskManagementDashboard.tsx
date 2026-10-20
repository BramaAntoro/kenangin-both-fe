import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type Kiosk = { id: string; cafeId: string; kioskCode: string; name: string; status: "active" | "maintenance" | "offline" | null };
type KioskRow = Kiosk & { cafeName: string };
type Cafe = { id: string; name: string };
type KioskForm = { cafeId: string; name: string; status: "active" | "maintenance" | "offline" };
type ApiErrorResponse = { message?: string; error?: unknown };

const emptyForm: KioskForm = { cafeId: "", name: "", status: "active" };

function formErrorMessages(data?: ApiErrorResponse): string[] {
  const details = data?.error;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const messages = Object.entries(details).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.filter((message): message is string => typeof message === "string").map((message) => `${field}: ${message}`);
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
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [form, setForm] = useState<KioskForm>(emptyForm);
  const [editing, setEditing] = useState<KioskRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadData(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<Record<string, Kiosk[]>>>("/kiosks", { signal });
    setKiosks(Object.entries(response.data.data).flatMap(([cafeName, cafeKiosks]) => cafeKiosks.map((kiosk) => ({ ...kiosk, cafeName }))));
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted && isAxiosError<ApiErrorResponse>(requestError)) setError(requestError.response?.data?.message ?? "Gagal memuat data kiosk.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(true);
    setLoadingCafes(true);
    try {
      const response = await api.get<ApiEnvelope<{ cafes: Record<string, Cafe> }>>("/cafes");
      setCafes(Object.values(response.data.data.cafes));
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) setFormErrors(formErrorMessages(requestError.response?.data));
      else setFormErrors(["Gagal memuat daftar kafe."]);
    } finally {
      setLoadingCafes(false);
    }
  }

  async function openEdit(kiosk: KioskRow) {
    setEditing(kiosk);
    setForm({ cafeId: kiosk.cafeId, name: kiosk.name, status: kiosk.status ?? "active" });
    setFormErrors([]);
    setIsFormOpen(true);
    setLoadingCafes(true);
    try {
      const response = await api.get<ApiEnvelope<{ cafes: Record<string, Cafe> }>>("/cafes");
      setCafes(Object.values(response.data.data.cafes));
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) setFormErrors(formErrorMessages(requestError.response?.data));
      else setFormErrors(["Gagal memuat daftar kafe."]);
    } finally {
      setLoadingCafes(false);
    }
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
    const payload = form;
    try {
      if (editing) await api.put(`/kiosks/${editing.id}`, payload);
      else await api.post("/kiosks", payload);
      await loadData();
      closeForm();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) setFormErrors(formErrorMessages(requestError.response?.data));
      else setFormErrors(["Gagal menyimpan kiosk."]);
    } finally {
      setSaving(false);
    }
  }

  async function deleteKiosk(kiosk: KioskRow) {
    if (!window.confirm(`Hapus ${kiosk.name}? Data kiosk yang dihapus tidak dapat dipulihkan.`)) return;
    setError("");
    try {
      await api.delete(`/kiosks/${kiosk.id}`);
      await loadData();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) setError(requestError.response?.data?.message ?? "Gagal menghapus kiosk.");
      else setError("Gagal menghapus kiosk.");
    }
  }

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6"><h1 className="font-display text-3xl font-semibold tracking-tight">Kelola Kiosk</h1><p className="mt-1 text-sm text-[#594139]">Unit photo booth dari server.</p></header>
      {error && <p className="mb-5 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{error}</p>}
      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6"><div><h2 className="font-display text-xl font-semibold">Daftar Kiosk</h2><p className="mt-1 text-sm text-[#594139]">Tambah, ubah, atau hapus unit photo booth.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"><span className="material-symbols-outlined text-lg">add</span>Tambah Kiosk</button></div>
      {loading ? <p className="p-8 text-center text-sm text-[#594139]">Memuat data kiosk…</p> : <div className="overflow-x-auto"><table className="w-full min-w-180 text-left text-sm"><thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]"><tr><th className="px-6 py-4">Kiosk</th><th className="px-4 py-4">Kafe</th><th className="px-4 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-[#E9E1E6]">{kiosks.map((kiosk) => <tr key={kiosk.id}><td className="px-6 py-4"><p className="font-semibold">{kiosk.name}</p><p className="mt-1 text-xs text-[#594139]">{kiosk.kioskCode}</p></td><td className="px-4 py-4">{kiosk.cafeName}</td><td className="px-4 py-4"><span className="rounded-full bg-[#FFF7F2] px-2.5 py-1 text-xs font-semibold text-[#795900]">{kiosk.status ?? "-"}</span></td><td className="px-6 py-4 text-right"><button type="button" onClick={() => openEdit(kiosk)} className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline">Ubah</button><button type="button" onClick={() => void deleteKiosk(kiosk)} className="text-sm font-semibold text-[#D32F2F] hover:underline">Hapus</button></td></tr>)}{kiosks.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-[#594139]">Belum ada kiosk.</td></tr>}</tbody></table></div>}</section>
      {isFormOpen && <div className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="kiosk-form-title"><form onSubmit={saveKiosk} className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"><h3 id="kiosk-form-title" className="font-display text-lg font-semibold">{editing ? `Ubah ${editing.name}` : "Kiosk Baru"}</h3>{formErrors.length > 0 && <div className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"><p className="font-semibold">Periksa data berikut:</p><ul className="mt-1 list-disc pl-5">{formErrors.map((message) => <li key={message}>{message}</li>)}</ul></div>}<label className="text-sm font-medium">Kafe<select required disabled={loadingCafes} value={form.cafeId} onChange={(event) => setForm({ ...form, cafeId: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"><option value="">{loadingCafes ? "Memuat kafe…" : "Pilih kafe"}</option>{cafes.map((cafe) => <option key={cafe.id} value={cafe.id}>{cafe.name}</option>)}</select></label><label className="text-sm font-medium">Nama Kiosk<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as KioskForm["status"] })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"><option value="active">Aktif</option><option value="maintenance">Maintenance</option><option value="offline">Offline</option></select></label><div className="flex gap-3"><button disabled={saving} type="submit" className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan"}</button><button disabled={saving} type="button" onClick={closeForm} className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold">Batal</button></div></form></div>}
    </div>
  );
}
