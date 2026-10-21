import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import SuperAdminDashboard from "../dashboard/super-admin/SuperAdminDashboard";
import CafeAdminDashboard from "../dashboard/cafe-admin/CafeAdminDashboard";

export default function DashboardPage() {
  const { user, logout: endSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await endSession();
  }

  if (loggingOut) {
    return (
      <main className="grid min-h-screen place-items-center bg-background-canvas text-body-md text-on-surface-variant">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-primary-container border-t-transparent animate-spin"></div>
          <span className="font-label-md text-label-md">Memuat dashboard Kenangin…</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const logout = () => {
    void handleLogout();
  };

  // Dynamic role-based dashboard rendering
  switch (user.role) {
    case "super_admin":
      return <SuperAdminDashboard user={user} onLogout={logout} />;
    case "cafe_admin":
      return <CafeAdminDashboard user={user} onLogout={logout} />;
    default:
      return (
        <main className="grid min-h-screen place-items-center bg-background-canvas p-4 text-on-surface">
          <div className="w-full max-w-md rounded-2xl bg-surface-card p-space-xl shadow-md border border-border-subtle text-center">
            <span className="material-symbols-outlined text-4xl text-status-warning mb-2">warning</span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Akses Belum Dikonfigurasi</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              Akun Anda ({user.name}) memiliki role <code>{user.role}</code> yang belum memiliki tampilan dashboard khusus.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-6 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-brand-primary-hover transition-colors"
            >
              Keluar
            </button>
          </div>
        </main>
      );
  }
}
