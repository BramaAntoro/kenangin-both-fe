type DownloadQrDialogProps = {
  downloadUrl: string;
  onClose: () => void;
};

export default function DownloadQrDialog({
  downloadUrl,
  onClose,
}: DownloadQrDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#241435]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-photo-title"
        className="relative w-full max-w-md rounded-3xl border border-[#E9E1E6] bg-white p-5 text-center shadow-2xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup QR unduhan"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-[#594139] transition hover:bg-[#FFF7F2]"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 id="download-photo-title" className="pr-8 font-display text-xl font-semibold">
          Unduh foto ke ponsel
        </h2>
        <p className="mt-2 text-sm text-[#594139]">
          Scan QR atau buka tautan ini untuk melihat dan mengunduh foto.
        </p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(downloadUrl)}`}
          alt="QR untuk membuka halaman unduh foto"
          className="mx-auto mt-4 size-60 max-w-full rounded-xl border border-[#E9E1E6] bg-white p-2"
        />
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block break-all rounded-xl bg-[#FFF7F2] p-3 text-sm font-medium text-[#FF6B35] underline underline-offset-2"
        >
          {downloadUrl}
        </a>
      </section>
    </div>
  );
}
