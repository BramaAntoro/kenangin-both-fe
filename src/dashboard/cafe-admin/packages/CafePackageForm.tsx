import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Cafe, PackageForm } from "./types";

type CafePackageFormProps = {
  cafes: Cafe[];
  form: PackageForm;
  setForm: Dispatch<SetStateAction<PackageForm>>;
  editingName?: string;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function CafePackageForm({
  cafes,
  form,
  setForm,
  editingName,
  error,
  saving,
  onClose,
  onSubmit,
}: CafePackageFormProps) {
  return (
    <div
      className="fixed inset-0 z-60 grid place-items-center overflow-y-auto bg-[#241435]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="package-form-title"
    >
      <form
        onSubmit={onSubmit}
        className="my-auto grid w-full max-w-xl gap-4 rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] p-5 shadow-xl sm:p-6"
      >
        <h2 id="package-form-title" className="font-display text-xl font-semibold">
          {editingName ? `Ubah ${editingName}` : "Paket Foto Baru"}
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
            onChange={(event) => setForm({ ...form, cafeId: event.target.value })}
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
            <span className="pl-3 text-sm font-semibold text-[#594139]">Rp</span>
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
                setForm({ ...form, price: event.target.value.replace(/\D/g, "") })
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
          <label className="text-sm font-medium">
            Batas Retake
            <input
              required
              min="0"
              step="1"
              type="number"
              value={form.retakeLimit}
              onChange={(event) =>
                setForm({ ...form, retakeLimit: event.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-[#E9E1E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B35]"
            />
          </label>
        </div>
        <fieldset className="grid gap-3 rounded-xl border border-[#E9E1E6] bg-white p-4">
          <legend className="px-1 text-sm font-semibold">Fitur Tambahan</legend>
          <label className="flex items-center gap-2 text-sm font-medium">
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
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.allowEmoji}
              onChange={(event) =>
                setForm({ ...form, allowEmoji: event.target.checked })
              }
              className="size-4 accent-[#FF6B35]"
            />
            Emoji tersedia
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.allowCustomText}
              onChange={(event) =>
                setForm({ ...form, allowCustomText: event.target.checked })
              }
              className="size-4 accent-[#FF6B35]"
            />
            Teks kustom tersedia
          </label>
        </fieldset>
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
        {editingName && (
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
            onClick={onClose}
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
  );
}
