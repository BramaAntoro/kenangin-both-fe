import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
import api from "../../lib/client/axios";

export default function AuthForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    setLoading(true);

    try {
      await api.post("/auth/login", { email, password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (isAxiosError<{ message: string }>(error)) {
        setError(error.response?.data?.message ?? "");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#E9E1E6] bg-[#FFF7F2]/55 px-4 py-3 text-sm text-[#241435] outline-none transition placeholder:text-[#241435]/40 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-[#E9E1E6] bg-white p-6 shadow-[0_18px_50px_rgba(36,20,53,0.10)] sm:p-8"
    >
      <div className="mb-7">
        <h2 className="font-display text-2xl font-semibold text-[#241435]">
          Senang bertemu lagi!
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#241435]/65">
          Masuk dan lanjutkan menyimpan momen berharga.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-[#D32F2F]/8 px-4 py-3 text-sm text-[#D32F2F]"
        >
          {error}
        </p>
      )}
      <div className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#241435]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#241435]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            maxLength={64}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#FF6B35] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#E85A2A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sebentar…" : "Masuk"}
        </button>
      </div>
    </form>
  );
}
