import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type CafeAdmin = {
  id: string;
  name: string;
  email: string;
};

type Cafe = { id: string; name: string; slug: string };

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
      return values
        .filter((message): message is string => typeof message === "string")
        .map((message) => `${field}: ${message}`);
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
  const [detailAdmin, setDetailAdmin] = useState<CafeAdmin | null>(null);
  const [detailCafes, setDetailCafes] = useState<Cafe[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
  });
  const totalPages = Math.max(meta.totalPages, 1);

  async function loadData(
    pageValue = page,
    searchValue = search,
    signal?: AbortSignal,
  ) {
    const response = await api.get<ApiEnvelope<{ cafeAdmins: CafeAdmin[] }>>(
      "/users/cafe-admin",
      {
        params: {
          page: pageValue,
          limit: 5,
          ...(searchValue ? { search: searchValue } : {}),
        },
        signal,
      },
    );
    setCafeAdmins(response.data.data.cafeAdmins);
    setMeta({
      currentPage: response.data.meta?.currentPage ?? pageValue,
      totalPages: response.data.meta?.totalPages ?? 0,
      totalItems: response.data.meta?.totalItems ?? 0,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timeout = window.setTimeout(
      () =>
        loadData(page, search, controller.signal)
          .catch((requestError: unknown) => {
            if (
              !controller.signal.aborted &&
              isAxiosError<ApiErrorResponse>(requestError)
            ) {
              setError(
                requestError.response?.data?.message ??
                  "Gagal memuat data admin kafe.",
              );
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          }),
      search ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, search]);

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
      await loadData(1, search);
      setPage(1);
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
    if (
      !window.confirm(
        `Hapus akun ${cafeAdmin.name}? Akses akun tidak dapat dipulihkan.`,
      )
    )
      return;

    setError("");
    try {
      await api.delete(`/users/cafe-admin/${cafeAdmin.id}`);
      const nextPage = cafeAdmins.length === 1 && page > 1 ? page - 1 : page;
      await loadData(nextPage, search);
      setPage(nextPage);
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setError(
          requestError.response?.data?.message ?? "Gagal menghapus admin kafe.",
        );
      } else {
        setError("Gagal menghapus admin kafe.");
      }
    }
  }

  async function openDetail(cafeAdmin: CafeAdmin) {
    setDetailAdmin(cafeAdmin);
    setDetailCafes([]);
    setDetailError("");
    setDetailLoading(true);
    try {
      const response = await api.get<ApiEnvelope<{ cafes: Cafe[] }>>(
        `/users/cafe-admin/${cafeAdmin.id}`,
      );
      setDetailCafes(response.data.data.cafes);
    } catch (requestError: unknown) {
      setDetailError(
        isAxiosError<ApiErrorResponse>(requestError)
          ? (requestError.response?.data?.message ??
              "Gagal memuat daftar kafe.")
          : "Gagal memuat daftar kafe.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col pb-16 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Kelola Admin Kafe
        </h1>
        <p className="mt-1 text-sm text-[#594139]">
          Akun pengelola mitra kafe dari server.
        </p>
      </header>
      {error && (
        <p className="mb-5 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a]">
          {error}
        </p>
      )}
      <section className="overflow-hidden rounded-3xl border border-[#E9E1E6] bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1E6] p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Daftar Admin Kafe
            </h2>
            <p className="mt-1 text-sm text-[#594139]">
              Tambah, ubah, atau hapus akses admin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex min-w-70 items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-lg text-[#594139]">
                search
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] pl-10 pr-4 text-sm text-[#241435] outline-none transition-colors focus:border-[#FF6B35]"
                placeholder="Cari nama atau email..."
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"
            >
              <span className="material-symbols-outlined text-lg">
                person_add
              </span>
              Tambah Admin
            </button>
          </div>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-[#594139]">
            Memuat data admin kafe…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]">
                <tr>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1E6]">
                {cafeAdmins.map((cafeAdmin) => (
                  <tr key={cafeAdmin.id}>
                    <td className="px-6 py-4 font-semibold">
                      {cafeAdmin.name}
                    </td>
                    <td className="px-4 py-4 text-[#594139]">
                      {cafeAdmin.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(cafeAdmin)}
                        className="mr-3 text-sm font-semibold text-[#241435] hover:underline"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(cafeAdmin)}
                        className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCafeAdmin(cafeAdmin)}
                        className="text-sm font-semibold text-[#D32F2F] hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {cafeAdmins.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-10 text-center text-[#594139]"
                    >
                      Belum ada admin kafe.
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
              Halaman {meta.currentPage} dari {totalPages} ({meta.totalItems}{" "}
              admin)
            </span>
            <div className="flex items-center gap-1">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
              </button>
              {Array.from(
                { length: Math.min(totalPages, 5) },
                (_, index) => index + 1,
              ).map((itemPage) => (
                <button
                  key={itemPage}
                  onClick={() => setPage(itemPage)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold ${page === itemPage ? "bg-[#FF6B35] text-white shadow-xs" : "border border-[#E9E1E6] bg-white text-[#241435]"}`}
                  type="button"
                >
                  {itemPage}
                </button>
              ))}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E9E1E6] bg-white text-[#241435] disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </section>
      {detailAdmin && (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cafe-admin-detail-title"
        >
          <section className="w-full max-w-xl rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#594139]">Detail Admin Kafe</p>
                <h3
                  id="cafe-admin-detail-title"
                  className="mt-1 font-display text-xl font-semibold"
                >
                  {detailAdmin.name}
                </h3>
                <p className="mt-1 text-sm text-[#594139]">
                  {detailAdmin.email}
                </p>
              </div>
              <button
                type="button"
                disabled={detailLoading}
                onClick={() => setDetailAdmin(null)}
                className="rounded-xl p-2 text-[#594139] hover:bg-white disabled:opacity-50"
                aria-label="Tutup detail"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <h4 className="mt-6 font-semibold">Kafe yang dikelola</h4>
            {detailLoading ? (
              <p className="mt-3 text-sm text-[#594139]">Memuat daftar kafe…</p>
            ) : detailError ? (
              <p role="alert" className="mt-3 text-sm text-[#ba1a1a]">
                {detailError}
              </p>
            ) : detailCafes.length ? (
              <ul className="mt-3 divide-y divide-[#E9E1E6] rounded-xl border border-[#E9E1E6] bg-white">
                {detailCafes.map((cafe) => (
                  <li
                    key={cafe.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="font-medium">{cafe.name}</span>
                    <span className="text-xs text-[#594139]">{cafe.slug}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#594139]">
                Admin ini belum terhubung ke kafe.
              </p>
            )}
          </section>
        </div>
      )}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cafe-admin-form-title"
        >
          <form
            onSubmit={saveCafeAdmin}
            className="grid w-full max-w-xl gap-4 rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"
          >
            <h3
              id="cafe-admin-form-title"
              className="font-display text-lg font-semibold"
            >
              {editing ? `Ubah ${editing.name}` : "Admin Kafe Baru"}
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
              Nama
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            <label className="text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            <label className="text-sm font-medium">
              {editing ? "Password baru (opsional)" : "Password"}
              <input
                required={!editing}
                minLength={8}
                maxLength={64}
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
              />
            </label>
            <div className="flex gap-3">
              <button
                disabled={saving}
                type="submit"
                className="rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button
                disabled={saving}
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-[#E9E1E6] bg-white px-4 py-2.5 text-sm font-semibold"
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
