type CompletionStepProps = {
  photoUrl: string;
  finishCountdown: number;
  onShowDownloadQr: () => void;
  onFinish: () => void;
};

export default function CompletionStep({
  photoUrl,
  finishCountdown,
  onShowDownloadQr,
  onFinish,
}: CompletionStepProps) {
  return (
    <section className="grid min-h-96 place-items-center rounded-3xl border border-[#E9E1E6] bg-white p-6 text-center shadow-sm sm:p-8">
      <div className="w-full max-w-lg">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#2E7D32]/10 text-[#2E7D32]">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">Foto Sudah Siap</h2>
        <p className="mt-2 text-sm text-[#594139]">
          Kenanganmu sudah tersimpan. Unduh foto atau siapkan sesi berikutnya.
        </p>
        {photoUrl && (
          <img
            src={photoUrl}
            alt="Pratinjau hasil foto"
            className="mx-auto mt-5 max-h-[42vh] w-full rounded-2xl border border-[#E9E1E6] bg-[#FFF7F2] object-contain p-2"
          />
        )}
        <p role="status" aria-live="polite" className="mt-4 text-sm font-semibold text-[#594139]">
          Kembali ke pilih paket dalam {finishCountdown} detik
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#FFF7F2]">
          <div
            className="h-full rounded-full bg-[#FFC845] transition-all"
            style={{ width: `${(finishCountdown / 60) * 100}%` }}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onShowDownloadQr}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A]"
          >
            <span className="material-symbols-outlined">download</span>
            Download Foto
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E9E1E6] bg-white px-5 py-3 text-sm font-semibold text-[#241435] transition hover:bg-[#FFF7F2]"
          >
            <span className="material-symbols-outlined">print</span>
            Cetak Foto
          </button>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9E1E6] bg-white px-5 py-3 text-sm font-semibold text-[#241435] transition hover:border-[#FF6B35] hover:bg-[#FFF7F2]"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
          Kembali ke Pilih Paket
        </button>
      </div>
    </section>
  );
}
