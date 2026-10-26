import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../../lib/client/axios";
import type { AuthUser } from "../../auth/types";
import type { ApiEnvelope } from "../types";
import CafeAdminOverview from "./CafeAdminOverview";
import CafeAdminRevenue from "./CafeAdminRevenue";
import CafeAdminCafes from "./CafeAdminCafes";
import CafeAdminFrames from "./CafeAdminFrames";
import CafeAdminPackages from "./CafeAdminPackages";
import CafeTerminalSetup from "./CafeTerminalSetup";
import CafePhotoBooth from "./CafePhotoBooth";
import CafeAdminSidebar from "./CafeAdminSidebar";
import type { CafeAdminView, CafeRevenue } from "./types";

interface CafeAdminDashboardProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function CafeAdminDashboard({
  user,
  onLogout,
}: CafeAdminDashboardProps) {
  const [revenue, setRevenue] = useState<CafeRevenue | null>(null);
  const [view, setView] = useState<CafeAdminView>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ApiEnvelope<CafeRevenue>>("/reports/revenue-recap/mine", {
        signal: controller.signal,
      })
      .then((response) => setRevenue(response.data.data))
      .catch(
        () =>
          !controller.signal.aborted &&
          setError("Data belum dapat dimuat. Coba lagi sebentar, ya."),
      )
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, []);

  const scrollToRevenue = () => {
    const el = document.getElementById("revenue-recap");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const switchView = (nextView: CafeAdminView) => {
    if (nextView === "photo-booth") {
      setMobileNavOpen(false);
      navigate("/sesi-foto");
      return;
    }
    setView(nextView);
    setMobileNavOpen(false);
    if (nextView === "revenue") {
      setTimeout(scrollToRevenue, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const breadcrumbLabel: Record<CafeAdminView, string> = {
    dashboard: "Dashboard",
    revenue: "Revenue Recap",
    cafes: "Kelola Kafe",
    frames: "Kelola Frame",
    packages: "Kelola Paket",
    "terminal-setup": "Setup Terminal",
    "photo-booth": "Sesi Foto",
  };

  return (
    <div className="min-h-screen bg-[#FFF7F2] font-sans text-[#241435]">
      <CafeAdminSidebar
        user={user}
        view={view}
        isOpen={mobileNavOpen}
        onNavigate={switchView}
        onLogout={onLogout}
      />
      <div className="lg:pl-72">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#E9E1E6] bg-[#FFF7F2]/90 px-4 backdrop-blur-md lg:left-72 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="rounded-xl border border-[#E9E1E6] bg-white p-2 lg:hidden"
              aria-label="Buka navigasi"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span className="font-semibold text-[#FF6B35]">Kenangin</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
              <span className="font-medium">{breadcrumbLabel[view]}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{user.email ?? user.name}</p>
            <p className="text-[11px] text-[#594139]">Admin Kafe</p>
          </div>
        </header>
        <main className="min-h-screen px-4 pb-16 pt-16 lg:px-8">
          {view === "cafes" ? (
            <CafeAdminCafes onBack={() => switchView("dashboard")} />
          ) : view === "frames" ? (
            <CafeAdminFrames />
          ) : view === "packages" ? (
            <CafeAdminPackages />
          ) : view === "terminal-setup" ? (
            <CafeTerminalSetup />
          ) : view === "photo-booth" ? (
            <CafePhotoBooth />
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-center gap-2 rounded-2xl border border-[#D32F2F]/20 bg-[#ffdad6] p-4 text-sm text-[#ba1a1a]"
                >
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}
              {loading ? (
                <div className="grid min-h-64 place-items-center rounded-3xl border border-[#E9E1E6] bg-white p-8 text-sm text-[#594139]">
                  Memuat data pendapatan…
                </div>
              ) : (
                revenue && (
                  <div className="flex w-full flex-col gap-8">
                    <CafeAdminOverview
                      revenue={revenue}
                      onRevenueClick={scrollToRevenue}
                      onCafesClick={() => switchView("cafes")}
                    />
                    <section id="revenue-recap" className="scroll-mt-20">
                      <CafeAdminRevenue revenue={revenue} />
                    </section>
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
