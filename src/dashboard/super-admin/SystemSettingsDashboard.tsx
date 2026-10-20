import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type SystemSetting = {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string | null;
};

type SettingForm = {
  settingKey: string;
  settingValue: string;
  description: string;
};

type ApiErrorResponse = { message?: string };

const emptyForm: SettingForm = { settingKey: "", settingValue: "", description: "" };

export default function SystemSettingsDashboard() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SettingForm>(emptyForm);
  const [editing, setEditing] = useState<SystemSetting | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadSettings(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ systemSsettings: SystemSetting[] }>>("/system-settings", { signal });
    setSettings(response.data.data.systemSsettings);
  }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await loadSettings(controller.signal);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted && isAxiosError<ApiErrorResponse>(requestError)) {
          setError(requestError.response?.data?.message ?? "Gagal memuat pengaturan sistem.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

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

  async function openEdit(setting: SystemSetting) {
    setError("");
    try {
      const response = await api.get<ApiEnvelope<{ systemSetting: SystemSetting }>>(`/system-settings/${setting.id}`);
      const detail = response.data.data.systemSetting;
      setEditing(detail);
      setForm({
        settingKey: detail.settingKey,
        settingValue: detail.settingValue,
        description: detail.description ?? "",
      });
      setIsFormOpen(true);
    } catch (requestError: unknown) {
      setError(isAxiosError<ApiErrorResponse>(requestError) ? requestError.response?.data?.message ?? "Gagal memuat detail pengaturan." : "Gagal memuat detail pengaturan.");
    }
  }

  async function saveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      settingKey: form.settingKey.trim(),
      settingValue: form.settingValue.trim(),
      description: form.description.trim() || null,
    };

    try {
      if (editing) {
        await api.put(`/system-settings/${editing.id}`, payload);
      } else {
        await api.post("/system-settings", { ...payload, description: payload.description || undefined });
      }
      await loadSettings();
      closeForm();
    } catch (requestError: unknown) {
      setError(isAxiosError<ApiErrorResponse>(requestError) ? requestError.response?.data?.message ?? "Gagal menyimpan pengaturan." : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSetting(setting: SystemSetting) {
    if (!window.confirm(`Hapus pengaturan ${setting.settingKey}? Tindakan ini tidak dapat dipulihkan.`)) return;
    setError("");
    try {
      await api.delete(`/system-settings/${setting.id}`);
      await loadSettings();
    } catch (requestError: unknown) {
      setError(isAxiosError<ApiErrorResponse>(requestError) ? requestError.response?.data?.message ?? "Gagal menghapus pengaturan." : "Gagal menghapus pengaturan.");
    }
  }

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Pengaturan Sistem</h1>
        <p className="mt-1 text-sm text-[#594139]">Konfigurasi global yang diambil langsung dari server.</p>
      </header>

      {error && <p className="mb-5 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{error}</p>}

      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Daftar Pengaturan</h2>
            <p className="mt-1 text-sm text-[#594139]">Tambah, ubah, atau hapus konfigurasi global.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]">
            <span className="material-symbols-outlined text-lg">add</span>Tambah Pengaturan
          </button>
        </div>

        {loading ? <p className="p-8 text-center text-sm text-[#594139]">Memuat pengaturan sistem…</p> : <div className="overflow-x-auto"><table className="w-full min-w-160 text-left text-sm"><thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]"><tr><th className="px-6 py-4">Key</th><th className="px-4 py-4">Value</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-[#E9E1E6]">{settings.map((setting) => <tr key={setting.id}><td className="px-6 py-4 font-mono text-xs font-semibold text-[#241435]">{setting.settingKey}</td><td className="px-4 py-4 break-all text-[#594139]">{setting.settingValue}</td><td className="whitespace-nowrap px-6 py-4 text-right"><button type="button" onClick={() => void openEdit(setting)} className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline">Ubah</button><button type="button" onClick={() => void deleteSetting(setting)} className="text-sm font-semibold text-[#D32F2F] hover:underline">Hapus</button></td></tr>)}{settings.length === 0 && <tr><td colSpan={3} className="px-6 py-10 text-center text-[#594139]">Belum ada pengaturan sistem.</td></tr>}</tbody></table></div>}
      </section>

      {isFormOpen && <div className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="system-setting-form-title"><form onSubmit={saveSetting} className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"><h3 id="system-setting-form-title" className="font-display text-lg font-semibold">{editing ? `Ubah ${editing.settingKey}` : "Pengaturan Baru"}</h3><label className="text-sm font-medium">Setting Key<input required maxLength={100} pattern="[a-z][a-z0-9_]*" title="Gunakan huruf kecil, angka, dan underscore; harus diawali huruf kecil." value={form.settingKey} onChange={(event) => setForm({ ...form, settingKey: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 font-mono text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">Setting Value<input required value={form.settingValue} onChange={(event) => setForm({ ...form, settingValue: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">Deskripsi <span className="font-normal text-[#594139]">(opsional)</span><textarea maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><div className="flex gap-3"><button disabled={saving} type="submit" className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan"}</button><button disabled={saving} type="button" onClick={closeForm} className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold">Batal</button></div></form></div>}
    </div>
  );
}
