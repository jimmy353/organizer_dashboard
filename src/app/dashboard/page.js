"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ========================= */
/* Animated Counter */
/* ========================= */

function Counter({ value, prefix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 700;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        start = value;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
    </span>
  );
}

/* ========================= */
/* MAIN DASHBOARD */
/* ========================= */

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/organizer/dashboard/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load dashboard");
        }
        return res.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
      });
  }, []);

  if (!stats)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-gray-400">
        Loading dashboard...
      </div>
    );

  const chartData = stats.monthly_revenue || [];

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div className="max-w-7xl mx-auto px-12 py-20">

        {/* HEADER */}
        <div className="mb-16 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-gray-400 mt-3 text-lg">
              Financial performance overview
            </p>
          </div>

          <div className="text-green-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            System Online
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid md:grid-cols-4 gap-8 mb-20">

          <KPI title="Total Events">
            <Counter value={stats.total_events || 0} />
          </KPI>

          <KPI title="Total Orders">
            <Counter value={stats.total_orders || 0} />
          </KPI>

          <KPI title="Total Revenue" highlight>
            <Counter value={stats.total_revenue || 0} prefix="SSP " />
            <GrowthBadge />
          </KPI>

          <KPI title="Net Earnings">
            <Counter value={stats.total_organizer_earnings || 0} prefix="SSP " />
          </KPI>

        </div>

        {/* CHART SECTION */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-12 shadow-2xl mb-20">

          <h2 className="text-lg text-gray-300 mb-10">
            Revenue Growth
          </h2>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>

        </div>

        {/* WALLET */}
        <div className="bg-gradient-to-br from-emerald-400/20 to-green-500/10
                        border border-emerald-400/20
                        rounded-3xl p-16 backdrop-blur-xl shadow-2xl">

          <p className="text-sm uppercase tracking-widest text-gray-300">
            Available Wallet Balance
          </p>

          <h2 className="text-4xl font-semibold text-emerald-400 mt-6">
            <Counter
              value={stats.total_organizer_earnings || 0}
              prefix="SSP "
            />
          </h2>

        </div>

      </div>
    </div>
  );
}

/* ========================= */
/* KPI CARD */
/* ========================= */

function KPI({ title, children, highlight }) {
  return (
    <div
      className={`relative rounded-3xl p-10
        ${
          highlight
            ? "bg-gradient-to-br from-emerald-400 to-green-500 text-black shadow-xl"
            : "bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg"
        }`}
    >
      <p className={`text-sm uppercase tracking-wide mb-6 ${
        highlight ? "text-black/70" : "text-gray-400"
      }`}>
        {title}
      </p>

      <div className="text-3xl font-semibold tracking-tight">
        {children}
      </div>
    </div>
  );
}

/* ========================= */
/* Growth Badge */
/* ========================= */

function GrowthBadge() {
  return (
    <div className="mt-4 inline-block text-xs px-3 py-1 rounded-full bg-black/20 text-black font-medium">
      +12% Growth
    </div>
  );
}