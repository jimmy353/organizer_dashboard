"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Refunds", href: "/dashboard/refunds", icon: RotateCcw },
  ];

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between">
      {/* Top Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-wide mb-10 text-green-400">
          Sirheart Events
        </h1>

        <nav className="space-y-3">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                  ${
                    active
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-lg"
                      : "hover:bg-green-500/10 hover:text-green-400"
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300">
          Organizer Panel v1.0
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/20 text-red-400 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0b1120]/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="text-sm font-bold text-green-400 tracking-wide">
            Sirheart Events
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-72 bg-gradient-to-b from-[#0f172a] to-[#0b1120] border-r border-green-500/10 p-8">
          <SidebarContent />
        </aside>

        {/* MOBILE DRAWER */}
        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <div className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] bg-gradient-to-b from-[#0f172a] to-[#0b1120] border-r border-green-500/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-green-400">
                  Sirheart Events
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <SidebarContent />
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}