"use client";

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
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Refunds", href: "/dashboard/refunds", icon: RotateCcw },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b1120] text-white">

      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-[#0f172a] to-[#0b1120] border-r border-green-500/10 p-8 flex flex-col justify-between">

        {/* Top Section */}
        <div>
          <h1 className="text-2xl font-bold tracking-wide mb-12 text-green-400">
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
            onClick={() => {
              localStorage.removeItem("access");
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/20 text-red-400 transition"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 p-12 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}