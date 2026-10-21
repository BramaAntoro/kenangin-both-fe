import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";

type Cafe = {
  id: string;
  name: string;
  address: string;
  phone: string;
  cafeSharePercent: number;
  kenanginSharePercent: number;
  isActive: boolean | null;
  cafeAdmin: string;
};

type CafeAdmin = {
  id: string;
  name: string;
  email: string;
};

type CafePackage = {
  id: string;
  name: string;
  price: number;
  photoShotsCount: number;
  printCopiesCount: number;
  features: unknown;
  description: string | null;
  isActive: boolean | null;
};

type CafePackagesResult = {
  id: string;
  name: string;
  packages: CafePackage[];
  kiosks: CafeKiosk[];
};

type CafeKiosk = {
  id: string;
  cafeId: string;
  kioskCode: string;
  name: string;
  status: "active" | "maintenance" | "offline" | null;
};

type CafeForm = {
  name: string;
  address: string;
  phone: string;
  cafeSharePercent: string;
  kenanginSharePercent: string;
  cafeAdminId: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: unknown;
};

const emptyForm: CafeForm = {
  name: "",
  address: "",
  phone: "",
  cafeSharePercent: "",
  kenanginSharePercent: "",
  cafeAdminId: "",
};

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

  return [data?.message ?? "Gagal menyimpan kafe."];
}

export default function CafeManagementDashboard() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [cafeAdmins, setCafeAdmins] = useState<CafeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCafeAdmins, setLoadingCafeAdmins] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [form, setForm] = useState<CafeForm>(emptyForm);
  const [editing, setEditing] = useState<Cafe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingCafeDetail, setViewingCafeDetail] =
    useState<CafePackagesResult | null>(null);
  const [loadingCafeDetail, setLoadingCafeDetail] = useState(false);

  async function loadData(signal?: AbortSignal) {
    const cafesResponse = await api.get<
      ApiEnvelope<{ cafes: Record<string, Cafe> }>
    >("/cafes", { signal });

    setCafes(Object.values(cafesResponse.data.data.cafes));
  }

  useEffect(() => {
    const controller = new AbortController();

    loadData(controller.signal)
      .catch((requestError: unknown) => {
        if (
          !controller.signal.aborted &&
          isAxiosError<{ message?: string }>(requestError)
        ) {
          setError(
            requestError.response?.data?.message ?? "Gagal memuat data kafe.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setFormErrors([]);
    setIsFormOpen(true);
    setLoadingCafeAdmins(true);

    try {
      const response =
        await api.get<ApiEnvelope<{ cafeAdmins: CafeAdmin[] }>>(
          "/users/cafe-admin",
        );
      setCafeAdmins(response.data.data.cafeAdmins);
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setFormErrors(formErrorMessages(requestError.response?.data));
      } else {
        setFormErrors(["Gagal memuat daftar admin kafe."]);
      }
    } finally {
      setLoadingCafeAdmins(false);
    }
  }

  function openEdit(cafe: Cafe) {
    setEditing(cafe);
    setCafeAdmins([]);
    setForm({
      name: cafe.name,
      address: cafe.address,
      phone: cafe.phone,
      cafeSharePercent: String(cafe.cafeSharePercent),
      kenanginSharePercent: String(cafe.kenanginSharePercent),
      cafeAdminId: "",
    });
    setError("");
    setFormErrors([]);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors([]);
    setIsFormOpen(false);
  }

  async function saveCafe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormErrors([]);

    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      cafeSharePercent: Number(form.cafeSharePercent),
      kenanginSharePercent: Number(form.kenanginSharePercent),
      ...(form.cafeAdminId ? { cafeAdminId: form.cafeAdminId } : {}),
    };

    try {
      if (editing) {
        await api.put(`/cafes/${editing.id}`, payload);
      } else {
        await api.post("/cafes", payload);
      }
      await loadData();
      closeForm();
    } catch (requestError: unknown) {
      if (isAxiosError<ApiErrorResponse>(requestError)) {
        setFormErrors(formErrorMessages(requestError.response?.data));
      } else {
        setFormErrors(["Gagal menyimpan kafe."]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCafe(cafe: Cafe) {
    if (
      !window.confirm(
        `Hapus ${cafe.name}? Data kafe yang dihapus tidak dapat dipulihkan.`,
      )
    )
      return;

    setError("");
    try {
      await api.delete(`/cafes/${cafe.id}`);
      await loadData();
    } catch (requestError: unknown) {
      if (isAxiosError<{ message?: string }>(requestError)) {
        setError(
          requestError.response?.data?.message ?? "Gagal menghapus kafe.",
        );
      } else {
        setError("Gagal menghapus kafe.");
      }
    }
  }

  async function viewCafeDetail(cafe: Cafe) {
    setViewingCafeDetail({
      id: cafe.id,
      name: cafe.name,
      packages: [],
      kiosks: [],
    });
    setLoadingCafeDetail(true);
    setError("");
    try {
      const [packagesResponse, kiosksResponse] = await Promise.all([
        api.get<ApiEnvelope<{ cafe: Omit<CafePackagesResult, "kiosks"> }>>(
          `/cafes/packages/${cafe.id}`,
        ),
        api.get<ApiEnvelope<{ kiosks: CafeKiosk[] }>>(
          `/cafes/kiosks/${cafe.id}`,
        ),
      ]);
      setViewingCafeDetail({
        ...packagesResponse.data.data.cafe,
        kiosks: kiosksResponse.data.data.kiosks,
      });
    } catch (requestError: unknown) {
      setViewingCafeDetail(null);
      setError(
        isAxiosError<{ message?: string }>(requestError)
          ? (requestError.response?.data?.message ??
              "Gagal memuat detail kafe.")
          : "Gagal memuat detail kafe.",
      );
    } finally {
      setLoadingCafeDetail(false);
    }
  }

  return (
    <div className="flex flex-col w-full pb-16 pt-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Kelola Kafe
        </h1>
        <p className="mt-1 text-sm text-[#594139]">
          Data mitra kafe dan pembagian hasil dari server.
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
              Daftar Mitra Kafe
            </h2>
            <p className="mt-1 text-sm text-[#594139]">
              Tambah, ubah, atau hapus data mitra.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E85A2A]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Tambah Kafe
          </button>
        </div>

        {isFormOpen && (
          <div
            className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cafe-form-title"
          >
            <form
              onSubmit={saveCafe}
              className="grid max-h-[90vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:grid-cols-2 sm:p-6"
            >
              <h3
                id="cafe-form-title"
                className="font-display text-lg font-semibold sm:col-span-2"
              >
                {editing ? `Ubah ${editing.name}` : "Kafe Baru"}
              </h3>
              {formErrors.length > 0 && (
                <div className="rounded-xl border border-[#D32F2F]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#ba1a1a] sm:col-span-2">
                  <p className="font-semibold">Periksa data berikut:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {formErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <label className="text-sm font-medium">
                Nama Kafe
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
                Nomor Telepon
                <input
                  required
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Alamat
                <textarea
                  required
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  className="mt-1.5 min-h-20 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              <label className="text-sm font-medium">
                Bagian Kafe (%)
                <input
                  required
                  min="0"
                  max="100"
                  type="number"
                  value={form.cafeSharePercent}
                  onChange={(event) =>
                    setForm({ ...form, cafeSharePercent: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              <label className="text-sm font-medium">
                Bagian Kenangin (%)
                <input
                  required
                  min="0"
                  max="100"
                  type="number"
                  value={form.kenanginSharePercent}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      kenanginSharePercent: event.target.value,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
                />
              </label>
              {editing ? (
                <p className="text-sm text-[#594139] sm:col-span-2">
                  Admin kafe:{" "}
                  <strong className="text-[#241435]">
                    {editing.cafeAdmin}
                  </strong>
                </p>
              ) : (
                <label className="text-sm font-medium sm:col-span-2">
                  Admin Kafe
                  <select
                    required
                    disabled={loadingCafeAdmins}
                    value={form.cafeAdminId}
                    onChange={(event) =>
                      setForm({ ...form, cafeAdminId: event.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35] disabled:opacity-60"
                  >
                    <option value="">
                      {loadingCafeAdmins ? "Memuat admin…" : "Pilih admin kafe"}
                    </option>
                    {cafeAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} — {admin.email}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="flex gap-3 sm:col-span-2">
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

        {loading ? (
          <p className="p-8 text-center text-sm text-[#594139]">
            Memuat data kafe…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-[#FFF7F2] text-xs uppercase tracking-wider text-[#594139]">
                <tr>
                  <th className="px-6 py-4">Kafe</th>
                  <th className="px-4 py-4">Kontak</th>
                  <th className="px-4 py-4">Admin</th>
                  <th className="px-4 py-4 text-center">Bagi Hasil</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1E6]">
                {cafes.map((cafe) => (
                  <tr key={cafe.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{cafe.name}</p>
                      <p className="mt-1 text-xs text-[#594139]">
                        {cafe.address}
                      </p>
                    </td>
                    <td className="px-4 py-4">{cafe.phone}</td>
                    <td className="px-4 py-4">{cafe.cafeAdmin}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="rounded-full bg-[#FFF7F2] px-2.5 py-1 text-xs font-semibold text-[#795900]">
                        {cafe.cafeSharePercent}% Kafe
                      </span>
                      <span className="mx-1 text-[#594139]">/</span>
                      <span className="rounded-full bg-[#ffdbd0] px-2.5 py-1 text-xs font-semibold text-[#ab3500]">
                        {cafe.kenanginSharePercent}% Kenangin
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void viewCafeDetail(cafe)}
                        className="mr-3 text-sm font-semibold text-[#594139] hover:underline"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(cafe)}
                        className="mr-3 text-sm font-semibold text-[#FF6B35] hover:underline"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCafe(cafe)}
                        className="text-sm font-semibold text-[#D32F2F] hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {cafes.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-[#594139]"
                    >
                      Belum ada data kafe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {viewingCafeDetail && (
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-[#241435]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cafe-detail-title"
        >
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#594139]">Detail kafe</p>
                <h3
                  id="cafe-detail-title"
                  className="mt-1 font-display text-xl font-semibold"
                >
                  {viewingCafeDetail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCafeDetail(null)}
                className="rounded-xl p-2 text-[#594139] hover:bg-white"
                aria-label="Tutup detail"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {loadingCafeDetail ? (
              <p className="py-10 text-center text-sm text-[#594139]">
                Memuat detail kafe…
              </p>
            ) : (
              <div className="mt-5 grid gap-6">
                <section>
                  <h4 className="font-display text-lg font-semibold">
                    Paket ({viewingCafeDetail.packages.length})
                  </h4>
                  {viewingCafeDetail.packages.length ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {viewingCafeDetail.packages.map((boothPackage) => (
                        <article
                          key={boothPackage.id}
                          className="rounded-2xl border border-[#E9E1E6] bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="font-semibold">
                                {boothPackage.name}
                              </h5>
                              <p className="mt-1 text-sm font-semibold text-[#FF6B35]">
                                {new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  maximumFractionDigits: 0,
                                }).format(boothPackage.price)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${boothPackage.isActive !== false ? "bg-[#2E7D32]/10 text-[#2E7D32]" : "bg-[#ffdad6] text-[#D32F2F]"}`}
                            >
                              {boothPackage.isActive !== false
                                ? "Aktif"
                                : "Nonaktif"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#594139]">
                            {boothPackage.photoShotsCount} jepretan ·{" "}
                            {boothPackage.printCopiesCount} cetakan
                          </p>
                          {boothPackage.description && (
                            <p className="mt-2 text-sm text-[#594139]">
                              {boothPackage.description}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#594139]">
                      Belum ada paket.
                    </p>
                  )}
                </section>
                <section>
                  <h4 className="font-display text-lg font-semibold">
                    Kiosk ({viewingCafeDetail.kiosks.length})
                  </h4>
                  {viewingCafeDetail.kiosks.length ? (
                    <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E9E1E6] bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white text-xs uppercase tracking-wider text-[#594139]">
                          <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Kode</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E9E1E6]">
                          {viewingCafeDetail.kiosks.map((kiosk) => (
                            <tr key={kiosk.id}>
                              <td className="px-4 py-3 font-medium">
                                {kiosk.name}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {kiosk.kioskCode}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                {kiosk.status ?? "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#594139]">
                      Belum ada kiosk.
                    </p>
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
