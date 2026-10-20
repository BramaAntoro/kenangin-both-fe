import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type CafeAdmin = {
  id: string;
  name: string;
  email: string;
};

type CafeAdminForm = {
  name: string;
  email: string;
  password: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: unknown;
};

const emptyForm: CafeAdminForm = { name: "", email: "", password: "" };

function formErrorMessages(data?: ApiErrorResponse): string[] {
  const details = data?.error;

  if (details && typeof details === "object" && !Array.isArray(details)) {
    const messages = Object.entries(details).flatMap(([field, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.filter((message): message is string => typeof message === "string").map((message) => `${field}: ${message}`);
    });
    if (messages.length) return [...new Set(messages)];
  }

  return [data?.message ?? "Gagal menyimpan admin kafe."];
}

export default function CafeAdminManagementDashboard() {
  const [cafeAdmins, setCafeAdmins] = useState<CafeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [form, setForm] = useState<CafeAdminForm>(emptyForm);
  const [editing, setEditing] = useState<CafeAdmin | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadData(signal?: AbortSignal) {
    const response = await api.get<ApiEnvelope<{ cafeAdmins: CafeAdmin[] }>>("/users/cafe-admin", { signal });
    setCafeAdmins(response.data.data.cafeAdmins);
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted && isAxiosError<ApiErrorResponse>(requestError)) {
          setError(requestError.response?.data?.message ?? "Gagal memuat data admin kafe.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(true);
  }

  function openEdit(cafeAdmin: CafeAdmin) {
    setEditing(cafeAdmin);
    setForm({ name: cafeAdmin.name, email: cafeAdmin.email, password: "" });
    setFormErrors([]);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(false);
  }

  async function saveCafeAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormErrors([]);

    const payload = {
      name: form.name,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      if (editing) {
        await api.put(`/users/cafe-admin/${editing.id}`, payload);
      } else {
        await api.post("/users/cafe-admin", payload);
      }
      await loadData();
      closeForm();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setFormErrors(formErrorMessages(requestError.response?.data));
      } else {
        setFormErrors(["Gagal menyimpan admin kafe."]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCafeAdmin(cafeAdmin: CafeAdmin) {
    if (!window.confirm(`Hapus akun ${cafeAdmin.name}? Akses akun tidak dapat dipulihkan.`)) return;

    setError("");
    try {
      await api.delete(`/users/cafe-admin/${cafeAdmin.id}`);
      await loadData();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setError(requestError.response?.data?.message ?? "Gagal menghapus admin kafe.");
      } else {
        setError("Gagal menghapus admin kafe.");
      }
    }
  }

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6"><h1 className="font-display text-3xl font-semibold tracking-tight">Kelola Admin Kafe</h1><p className="mt-1 text-sm text-[#594139]">Akun pengelola mitra kafe dari server.</p></header>
      {error && <p className="mb-5 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">{error}</p>}
      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6"><div><h2 className="font-display text-xl font-semibold">Daftar Admin Kafe</h2><p className="mt-1 text-sm text-[#594139]">Tambah, ubah, atau hapus akses admin.</p></div><button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"><span className="material-symbols-outlined text-lg">person_add</span>Tambah Admin</button></div>
        {loading ? <p className="p-8 text-center text-sm text-[#594139]">Memuat data admin kafe…</p> : <div className="overflow-x-auto"><table className="w-full min-w-160 text-left text-sm"><thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]"><tr><th className="px-6 py-4">Nama</th><th className="px-4 py-4">Email</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-[#E9E1E6]">{cafeAdmins.map((cafeAdmin) => <tr key={cafeAdmin.id}><td className="px-6 py-4 font-semibold">{cafeAdmin.name}</td><td className="px-4 py-4 text-[#594139]">{cafeAdmin.email}</td><td className="px-6 py-4 text-right"><button type="button" onClick={() => openEdit(cafeAdmin)} className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline">Ubah</button><button type="button" onClick={() => void deleteCafeAdmin(cafeAdmin)} className="text-sm font-semibold text-[#D32F2F] hover:underline">Hapus</button></td></tr>)}{cafeAdmins.length === 0 && <tr><td colSpan={3} className="px-6 py-10 text-center text-[#594139]">Belum ada admin kafe.</td></tr>}</tbody></table></div>}
      </section>
      {isFormOpen && <div className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="cafe-admin-form-title"><form onSubmit={saveCafeAdmin} className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"><h3 id="cafe-admin-form-title" className="font-display text-lg font-semibold">{editing ? `Ubah ${editing.name}` : "Admin Kafe Baru"}</h3>{formErrors.length > 0 && <div className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]"><p className="font-semibold">Periksa data berikut:</p><ul className="mt-1 list-disc pl-5">{formErrors.map((message) => <li key={message}>{message}</li>)}</ul></div>}<label className="text-sm font-medium">Nama<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><label className="text-sm font-medium">{editing ? "Password baru (opsional)" : "Password"}<input required={!editing} minLength={8} maxLength={64} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" /></label><div className="flex gap-3"><button disabled={saving} type="submit" className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan"}</button><button disabled={saving} type="button" onClick={closeForm} className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold">Batal</button></div></form></div>}
    </div>
  );
}
