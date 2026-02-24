"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ---------------- API HELPER ----------------
async function apiFetch(path) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { res, data };
}

// ---------------- HELPERS ----------------
function formatDate(date) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function statusColor(status) {
  if (status === "paid") return "text-green-400 border-green-500/40";
  if (status === "pending") return "text-yellow-400 border-yellow-500/40";
  if (status === "refunded") return "text-red-400 border-red-500/40";
  if (status === "refund_requested") return "text-sky-400 border-sky-500/40";
  return "text-zinc-400 border-zinc-500/40";
}

// ========================================================
// ====================== PAGE ============================
// ========================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [ordersRes, eventsRes] = await Promise.all([
        apiFetch("/api/orders/organizer/"),
        apiFetch("/api/events/organizer/"),
      ]);

      if (!ordersRes.res.ok) {
        throw new Error("Failed to load orders.");
      }

      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- FILTERING ----------------

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (selectedEvent !== "all") {
      list = list.filter(
        (o) => String(o.event_title) === String(selectedEvent)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter(
        (o) =>
          String(o.id).includes(q) ||
          (o.customer_email || "").toLowerCase().includes(q) ||
          (o.ticket_type_name || "").toLowerCase().includes(q) ||
          (o.status || "").toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [orders, selectedEvent, search]);

  // ---------------- SUMMARY ----------------

  const summary = useMemo(() => {
    return {
      totalOrders: filteredOrders.length,
      totalRevenue: filteredOrders.reduce(
        (s, o) => s + Number(o.total_amount || 0),
        0
      ),
      totalCommission: filteredOrders.reduce(
        (s, o) => s + Number(o.commission_amount || 0),
        0
      ),
      totalOrganizer: filteredOrders.reduce(
        (s, o) => s + Number(o.organizer_amount || 0),
        0
      ),
    };
  }, [filteredOrders]);

  // ========================================================
  // ====================== UI ==============================
  // ========================================================

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Organizer Orders</h1>
            <p className="text-sm text-zinc-400">
              Track revenue, commission and payouts.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-xl bg-white/10 px-6 py-3 hover:bg-white/20"
          >
            Refresh
          </button>
        </div>

        {/* FILTERS */}
        <div className="mt-6 grid md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
            >
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.title}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <Stat label="Orders" value={summary.totalOrders} />
          <Stat label="Revenue" value={`SSP ${money(summary.totalRevenue)}`} />
          <Stat label="Commission" value={`SSP ${money(summary.totalCommission)}`} yellow />
          <Stat label="Organizer" value={`SSP ${money(summary.totalOrganizer)}`} green />
        </div>

        {/* LIST */}
        <div className="mt-8">

          {loading ? (
            <div className="text-center text-zinc-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-zinc-500">No orders found.</div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block rounded-2xl overflow-hidden border border-zinc-800">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-zinc-800 hover:bg-white/5 cursor-pointer"
                  >
                    <div className="font-bold">#{o.id}</div>
                    <div>{o.event_title}</div>
                    <div>{o.customer_email}</div>
                    <div>{o.ticket_type_name}</div>
                    <div>SSP {money(o.total_amount)}</div>
                    <div
                      className={`border px-2 py-1 rounded-full text-xs font-bold ${statusColor(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-4">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900 cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <div className="font-bold">Order #{o.id}</div>
                      <div
                         className={`inline-flex items-center justify-center min-w-[90px] px-4 py-2 text-sm font-semibold rounded-full capitalize
                       ${
                         o.status === "paid"
                         ? "bg-green-500 text-black shadow-md shadow-green-500/20"
                         : o.status === "pending"
                         ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/40"
                         : o.status === "refunded"
                         ? "bg-red-500/15 text-red-400 border border-red-500/40"
                         : o.status === "refund_requested"
                         ? "bg-sky-500/15 text-sky-400 border border-sky-500/40"
                         : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/40"
                       }`}
                    >
                       {o.status}
                    </div>
                    </div>

                    <div className="mt-2 text-green-400 font-bold">
                      {o.event_title}
                    </div>

                    <div className="mt-2 text-sm">
                      {o.customer_email}
                    </div>

                    <div className="mt-2 font-bold">
                      SSP {money(o.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* MODAL */}
        {selectedOrder && (
          <Modal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </div>
    </div>
  );
}

// ---------------- COMPONENTS ----------------

function Stat({ label, value, green, yellow }) {
  const color = green
    ? "text-green-400"
    : yellow
    ? "text-yellow-400"
    : "text-white";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`mt-2 text-xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function Modal({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold mb-4">Order Details</h2>

        <Detail label="Order ID" value={`#${order.id}`} />
        <Detail label="Event" value={order.event_title} />
        <Detail label="Customer" value={order.customer_email} />
        <Detail label="Ticket Type" value={order.ticket_type_name} />
        <Detail label="Quantity" value={order.quantity} />
        <Detail label="Total" value={`SSP ${money(order.total_amount)}`} />
        <Detail label="Commission" value={`SSP ${money(order.commission_amount)}`} />
        <Detail label="Organizer" value={`SSP ${money(order.organizer_amount)}`} />
        <Detail label="Status" value={order.status} />
        <Detail label="Created At" value={formatDate(order.created_at)} />

        <button
          onClick={onClose}
          className="mt-6 w-full bg-green-500 text-black font-bold py-3 rounded-xl"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between text-sm mb-2">
      <div className="text-zinc-400">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}