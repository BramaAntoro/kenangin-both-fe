export type SuperAdminDashboardView = "revenue" | "cafes" | "cafe-admins" | "kiosks" | "system-settings" | "frames";

interface SuperAdminSidebarProps {
  view: SuperAdminDashboardView;
  isOpen: boolean;
  onNavigate: (view: SuperAdminDashboardView) => void;
}

const navigation: { view: SuperAdminDashboardView; icon: string; label: string }[] = [
  { view: "revenue", icon: "payments", label: "Revenue & Bagi Hasil" },
  { view: "cafes", icon: "storefront", label: "Kelola Kafe" },
  { view: "cafe-admins", icon: "manage_accounts", label: "Kelola Admin Kafe" },
  { view: "kiosks", icon: "photo_camera", label: "Kelola Kiosk" },
  { view: "system-settings", icon: "settings", label: "Pengaturan Sistem" },
  { view: "frames", icon: "photo_library", label: "Kelola Frame" },
];

export default function SuperAdminSidebar({ view, isOpen, onNavigate }: SuperAdminSidebarProps) {
  return <aside className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col justify-between bg-[#241435] p-6 text-[#fff7ff] shadow-md transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
    <div className="flex flex-col gap-6">
      <div className="px-1 pt-1"><img src="/lockups/lockup-removebg-preview.webp" alt="Kenangin" className="w-40" /></div>
      <nav className="flex flex-col gap-1.5 pt-2">
        {navigation.map((item) => <button key={item.view} type="button" className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-all ${view === item.view ? "bg-[#FF6B35] text-white shadow-sm" : "text-[#fff7ff] hover:bg-white/10"}`} onClick={() => onNavigate(item.view)}><span className="material-symbols-outlined text-xl">{item.icon}</span><span className="text-sm">{item.label}</span></button>)}
      </nav>
    </div>
  </aside>;
}
