import { useEffect, useState } from "react";
import api from "../../lib/client/axios";
import type { AuthUser } from "../../auth/types";
import type { ApiEnvelope, Kiosk } from "../types";

interface CafeAdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function CafeAdminDashboard({ user, onLogout }: CafeAdminDashboardProps) {
  const [kiosksByCafe, setKiosksByCafe] = useState<Record<string, Kiosk[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ApiEnvelope<Record<string, Kiosk[]>>>("/kiosks", { signal: controller.signal })
      .then((res) => {
        if (res.data?.data) {
          setKiosksByCafe(res.data.data);
        }
      })
      .catch(() => {
        // Fallback / silent fail
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const cafeNames = Object.keys(kiosksByCafe);
  const allKiosks = Object.values(kiosksByCafe).flat();
  const activeCount = allKiosks.filter((k) => k.status === "active").length;

  return (
    <main className="min-h-screen bg-background-canvas px-4 sm:px-8 py-8 text-on-surface">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-border-subtle pb-6">
          <div className="flex items-center gap-3">
            <img src="/lockups/lockup.webp" alt="Kenangin" className="w-40 sm:w-48 object-contain" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
              Dashboard Mitra Kafe
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm border border-border-subtle transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Keluar</span>
          </button>
        </header>

        {/* Welcome Hero */}
        <section className="mb-6 rounded-2xl bg-surface-card p-space-lg sm:p-space-xl shadow-sm border border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                Selamat Datang Mitra Kenangin
              </span>
              <h1 className="font-headline-md text-headline-md text-on-surface mt-1 font-semibold">
                {user.name}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Kelola unit photo booth, pantau status operasional, dan bagi hasil otomatis lokasi Anda.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto p-space-sm bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary-container">storefront</span>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Status Akun</span>
                <p className="font-title-md text-title-md text-on-surface font-semibold">Mitra Kafe Terverifikasi</p>
              </div>
            </div>
          </div>
        </section>

        {/* Kiosks Summary */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <div className="rounded-2xl bg-surface-card p-space-md shadow-sm border border-border-subtle">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Unit Kiosk</span>
            <p className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">
              {allKiosks.length > 0 ? allKiosks.length : 1} Unit
            </p>
          </div>
          <div className="rounded-2xl bg-surface-card p-space-md shadow-sm border border-border-subtle">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Unit Operasional</span>
            <p className="font-headline-md text-headline-md text-status-success font-semibold mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse"></span>
              {allKiosks.length > 0 ? activeCount : 1} Online
            </p>
          </div>
          <div className="rounded-2xl bg-surface-card p-space-md shadow-sm border border-border-subtle">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Porsi Bagi Hasil</span>
            <p className="font-headline-md text-headline-md text-secondary font-semibold mt-1">
              40% Net Gross
            </p>
          </div>
        </section>

        {/* Kiosks List */}
        <section className="rounded-2xl bg-surface-card shadow-sm border border-border-subtle overflow-hidden">
          <div className="p-space-lg border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-title-md text-title-md text-on-surface">Unit Kiosk di Lokasi Anda</h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Auto-Settlement H2H Virtual Account
            </span>
          </div>

          {loading ? (
            <div className="p-space-xl text-center font-body-sm text-on-surface-variant">
              Memuat data unit booth…
            </div>
          ) : cafeNames.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {cafeNames.map((cafeName) => (
                <div key={cafeName} className="p-space-lg">
                  <h3 className="font-title-md text-title-md text-on-surface mb-space-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-xl">local_cafe</span>
                    <span>{cafeName}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    {kiosksByCafe[cafeName]?.map((kiosk) => (
                      <div
                        key={kiosk.id || kiosk.kioskCode}
                        className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low"
                      >
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{kiosk.name || "Kenangin Photobooth"}</p>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Kode: {kiosk.kioskCode || "K-01"}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${
                            kiosk.status === "active"
                              ? "bg-status-success/10 text-status-success"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              kiosk.status === "active" ? "bg-status-success animate-pulse" : "bg-outline"
                            }`}
                          ></span>
                          {kiosk.status === "active" ? "Online" : "Standby"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-space-lg text-center font-body-sm text-on-surface-variant">
              Unit kiosk Anda sedang disiapkan oleh tim Kenangin HQ. Hubungi operasional untuk bantuan aktivasi.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

