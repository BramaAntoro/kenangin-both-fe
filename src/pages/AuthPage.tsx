import { Link } from "react-router";
import AuthForm from "../auth/components/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF7F2] text-[#241435]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 md:grid-cols-[1fr_440px] md:px-10">
        <section className="relative hidden min-h-[540px] flex-col justify-center md:flex">
          <Link to="/login" aria-label="Kenangin beranda" className="mb-14 inline-flex w-fit">
            <img src="/lockups/lockup.webp" alt="Kenangin" className="w-56" />
          </Link>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#FF6B35]">Satu link untuk semua kenangan</p>
          <h1 className="font-display max-w-lg text-5xl font-semibold leading-tight">Semua momen,<br />dari semua sudut.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#241435]/65">Kumpulkan foto dari teman dan keluarga, lalu simpan cerita di balik setiap momen.</p>
          <div aria-hidden="true" className="relative mt-12 h-48 max-w-md">
            <div className="absolute left-4 top-5 h-36 w-28 -rotate-6 rounded-lg bg-white p-2 shadow-lg ring-1 ring-[#E9E1E6]">
              <div className="h-24 rounded-md bg-[#3FB6E0]/25" />
              <div className="mx-auto mt-2 h-2 w-14 rounded-full bg-[#E9E1E6]" />
            </div>
            <div className="absolute left-28 top-0 h-40 w-32 rotate-3 rounded-lg bg-white p-2 shadow-xl ring-1 ring-[#E9E1E6]">
              <div className="h-28 rounded-md bg-[#FFC845]/70" />
              <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-[#E9E1E6]" />
            </div>
            <div className="absolute left-52 top-8 h-36 w-28 rotate-[-3deg] rounded-lg bg-white p-2 shadow-lg ring-1 ring-[#E9E1E6]">
              <div className="h-24 rounded-md bg-[#FF6B35]/25" />
              <div className="mx-auto mt-2 h-2 w-14 rounded-full bg-[#E9E1E6]" />
            </div>
            <span className="absolute left-[340px] top-2 text-4xl text-[#FF6B35]">✦</span>
            <span className="absolute left-2 top-[-10px] text-3xl text-[#3FB6E0]">✳</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <Link to="/login" className="mb-8 inline-flex items-center gap-2 md:hidden">
            <img src="/lockups/lockup.webp" alt="Kenangin" className="w-44" />
          </Link>
          <AuthForm />
          <p className="mt-6 text-center text-xs text-[#241435]/45">Dengan masuk, kamu ikut menjaga setiap kenangan tetap dekat.</p>
        </section>
      </div>
    </main>
  );
}
