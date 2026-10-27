import type { AuthUser } from "../../auth/types";
import type { CafeAdminView } from "./types";

interface CafeAdminSidebarProps {
  user: AuthUser;
  view: CafeAdminView;
  isOpen: boolean;
  onNavigate: (view: CafeAdminView) => void;
  onLogout: () => void;
}

const navigation: { view: CafeAdminView; icon: string; label: string }[] = [
  { view: "dashboard", icon: "space_dashboard", label: "Dashboard" },
  { view: "cafes", icon: "storefront", label: "Kelola Kafe" },
  { view: "frames", icon: "photo_library", label: "Kelola Frame" },
  { view: "packages", icon: "loyalty", label: "Kelola Paket" },
  { view: "terminal-setup", icon: "settings", label: "Setup Terminal" },
  { view: "photo-booth", icon: "photo_camera", label: "Sesi Foto" },
];

export default function CafeAdminSidebar({ user, view, isOpen, onNavigate, onLogout }: CafeAdminSidebarProps) {
  return <aside className={`fixed bottom-0 left-0 top-0 z-50 flex h-screen w-72 flex-col bg-[#241435] p-6 text-[#FFF7F2] shadow-md transition-transform lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
    <img src="/lockups/lockup-removebg-preview.webp" alt="Kenangin" className="w-40" />
    <nav className="mt-10 flex flex-col gap-1.5" aria-label="Navigasi dashboard">
      {navigation.map((item) => <button key={item.view} type="button" onClick={() => onNavigate(item.view)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${view === item.view ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#FFF7F2] hover:bg-white/10"}`}><span className="material-symbols-outlined text-xl">{item.icon}</span>{item.label}</button>)}
    </nav>
    <div className="mt-auto border-t border-white/15 pt-4"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-0.5 text-xs text-white/60">Admin Kafe</p><button type="button" onClick={onLogout} className="mt-4 flex items-center gap-2 text-sm font-medium text-[#FFC845] hover:text-white"><span className="material-symbols-outlined text-lg">logout</span>Keluar</button></div>
  </aside>;
}
