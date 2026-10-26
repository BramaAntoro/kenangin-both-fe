import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/client/axios";
import type { ApiEnvelope } from "../types";
import CafePackageForm from "./packages/CafePackageForm";
import CafePackageList from "./packages/CafePackageList";
import type { Cafe, CafePackage, PackageForm } from "./packages/types";
type CafeListResponse = { cafes: Cafe[] };
type CafePackagesResponse = {
  cafe: { id: string; name: string; packages: CafePackage[] };
};
type ApiErrorResponse = { message?: string };

const emptyForm: PackageForm = {
  cafeId: "",
  name: "",
  price: "",
  photoShotsCount: "3",
  timerDuration: "5",
  retakeLimit: "1",
  allowFilters: true,
  allowEmoji: false,
  allowCustomText: false,
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
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
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
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
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
      retakeLimit: String(boothPackage.features?.retake_limit ?? 0),
      allowFilters: boothPackage.features?.allow_filters ?? false,
      allowEmoji: boothPackage.features?.allow_emoji ?? false,
      allowCustomText: boothPackage.features?.allow_custom_text ?? false,
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
        retake_limit: Number(form.retakeLimit),
        allow_filters: form.allowFilters,
        allow_emoji: form.allowEmoji,
        allow_custom_text: form.allowCustomText,
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
                setLoading(true);
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
        <CafePackageList
          cafe={selectedCafe}
          packages={packages}
          page={page}
          totalItems={pageMeta.totalItems}
          totalPages={pageMeta.totalPages}
          loading={loading}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={(boothPackage) => void deletePackage(boothPackage)}
          onPageChange={(nextPage) => {
            setLoading(true);
            setPage(nextPage);
          }}
          formatPrice={formatPrice}
        />
      )}

      {isFormOpen && (
        <CafePackageForm
          cafes={cafes}
          form={form}
          setForm={setForm}
          editingName={editing?.name}
          error={error}
          saving={saving}
          onClose={closeForm}
          onSubmit={savePackage}
        />
      )}
    </div>
  );
}