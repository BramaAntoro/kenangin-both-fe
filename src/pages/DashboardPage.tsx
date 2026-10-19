import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
import api from "../lib/client/axios";
import type { AuthUser } from "../auth/types";

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!user);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    api
      .get<{ data: { user: AuthUser } }>("/auth/me", { signal: controller.signal })
      .then((response) => {
        if (active) setUser(response.data.data.user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isAxiosError<{ message: string }>(error)) {
          if (error.response?.status === 401) {
            navigate("/login", { replace: true });
            return;
          }
          setError(error.response?.data?.message ?? "");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [user, navigate]);

  async function handleLogout() {
    setError("");
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
      setUser(null);
      navigate("/login", { replace: true });
    } catch (error) {
      if (isAxiosError<{ message: string }>(error)) {
        setError(error.response?.data?.message ?? "");
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF7F2] px-5 py-10 text-[#241435]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <img src="/lockups/lockup.webp" alt="Kenangin" className="w-44" />
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl bg-[#D32F2F]/8 px-4 py-3 text-sm text-[#D32F2F]">{error}</p>}
        {loading ? (
          <p>Memuat…</p>
        ) : user ? (
          <section className="rounded-3xl border border-[#E9E1E6] bg-white p-6 shadow-[0_18px_50px_rgba(36,20,53,0.08)] sm:p-8">
            <p className="text-sm text-[#241435]/60">Nama</p>
            <p className="mt-1 text-xl font-semibold">{user.name}</p>
            <p className="mt-6 text-sm text-[#241435]/60">Role</p>
            <p className="mt-1 text-base font-medium">{user.role}</p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-8 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E85A2A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Sebentar…" : "Logout"}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
