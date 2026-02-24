"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ---------------- API HELPER ---------------- */

async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
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

/* ---------------- HELPERS ---------------- */

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(date) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString();
}

/* ======================================================== */

export default function PaymentsPage() {
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPayments(selectedEvent.id);
    }
  }, [selectedEvent]);

  async function fetchEvents() {
    try {
      setLoading(true);

      const { res, data } = await apiFetch("/api/events/organizer/");

      if (res.ok) {
        setEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      }
    } catch (err) {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments(eventId) {
    try {
      setLoading(true);

      const { res, data } = await apiFetch(
        `/api/payments/organizer/?event=${eventId}`
      );

      if (res.ok) setPayments(data);
      else setError("Failed to load payments.");
    } catch {
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  async function requestWithdrawal() {
    if (!selectedEvent) return;

    const confirmWithdraw = confirm(
      `Request withdrawal for ${selectedEvent.title}?`
    );
    if (!confirmWithdraw) return;

    const { res, data } = await apiFetch("/api/payouts/request/", {
      method: "POST",
      body: JSON.stringify({ event_id: selectedEvent.id }),
    });

    if (res.ok) {
      alert(`Withdrawal requested\nTotal: SSP ${money(data.total)}`);
      fetchPayments(selectedEvent.id);
    } else {
      alert(data?.error || "Failed to request withdrawal.");
    }
  }

  /* ---------------- SUMMARY ---------------- */

  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );

  const totalCommission = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.commission || 0), 0),
    [payments]
  );

  const totalOrganizer = useMemo(
    () =>
      payments.reduce((sum, p) => sum + Number(p.organizer_amount || 0), 0),
    [payments]
  );

  /* ======================================================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">
              Organizer Payments
            </h1>
            <p className="text-sm text-zinc-400">
              Track payouts and earnings.
            </p>
          </div>

          <button
            onClick={() => fetchPayments(selectedEvent?.id)}
            className="bg-white/10 px-6 py-3 rounded-xl hover:bg-white/20"
          >
            Refresh
          </button>
        </div>

        {/* EVENT SELECT */}
        <div className="mt-6">
          <select
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setSelectedEvent(
                events.find((ev) => ev.id === Number(e.target.value))
              )
            }
            className="w-full md:w-1/3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Stat label="Revenue" value={`SSP ${money(totalRevenue)}`} />
          <Stat
            label="Commission"
            value={`SSP ${money(totalCommission)}`}
            yellow
          />
          <Stat
            label="Organizer Earnings"
            value={`SSP ${money(totalOrganizer)}`}
            green
          />
        </div>

        {/* WITHDRAW BUTTON */}
        <div className="mt-6">
          <button
            onClick={requestWithdrawal}
            className="bg-green-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-400"
          >
            Request Withdrawal
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* LIST */}
        <div className="mt-8">

          {loading ? (
            <div className="text-center text-zinc-500">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center text-zinc-500">
              No payments found.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block border border-zinc-800 rounded-2xl overflow-hidden">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-6 items-center px-6 py-4 border-b border-zinc-800 hover:bg-white/5"
                  >
                    <div className="font-bold">
                      SSP {money(p.amount)}
                    </div>
                    <div>{p.provider?.toUpperCase()}</div>
                    <div>{p.customer_email}</div>
                    <div>{p.ticket_type_name}</div>
                    <div>{formatDate(p.created_at)}</div>

                    <div className="flex justify-end">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize
                          ${
                            p.payout_status === "paid"
                              ? "bg-green-500 text-black"
                              : "bg-yellow-500 text-black"
                          }`}
                      >
                        {p.payout_status || "unpaid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE CARDS */}
              <div className="md:hidden space-y-4">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="text-green-400 font-bold text-lg">
                      SSP {money(p.amount)}
                    </div>

                    <div className="mt-2 text-sm text-zinc-400">
                      {p.provider?.toUpperCase()}
                    </div>

                    <div className="mt-2 text-sm">
                      {p.customer_email}
                    </div>

                    <div className="mt-2 text-sm">
                      {p.ticket_type_name}
                    </div>

                    <div className="mt-2 text-sm">
                      {formatDate(p.created_at)}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold capitalize
                          ${
                            p.payout_status === "paid"
                              ? "bg-green-500 text-black"
                              : "bg-yellow-500 text-black"
                          }`}
                      >
                        {p.payout_status || "unpaid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function Stat({ label, value, green, yellow }) {
  const color = green
    ? "text-green-400"
    : yellow
    ? "text-yellow-400"
    : "text-white";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`mt-2 text-2xl font-extrabold ${color}`}>
        {value}
      </div>
    </div>
  );
}