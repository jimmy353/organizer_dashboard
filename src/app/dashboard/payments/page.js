"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ================= API HELPER ================= */

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
  } catch {}

  return { res, data };
}

/* ================= HELPERS ================= */

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
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) fetchPayments(selectedEvent.id);
  }, [selectedEvent]);

  async function fetchEvents() {
    setLoading(true);

    const { res, data } = await apiFetch("/api/events/organizer/");

    if (res.ok) {
      setEvents(data);
      if (data.length > 0) setSelectedEvent(data[0]);
    }

    setLoading(false);
  }

  async function fetchPayments(eventId) {
    setLoading(true);

    const { res, data } = await apiFetch(
      `/api/payments/organizer/?event=${eventId}`
    );

    if (res.ok) setPayments(data);
    else setError("Failed to load payments.");

    setLoading(false);
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

  /* ================= SUMMARY ================= */

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

  const commissionPercent =
    totalRevenue > 0
      ? ((totalCommission / totalRevenue) * 100).toFixed(2)
      : 0;

  const hasPending = payments.some(
    (p) => p.payout_status !== "paid"
  );

  /* ================= CSV EXPORT ================= */

  function exportCSV() {
    const headers = [
      "Amount",
      "Commission",
      "Organizer",
      "Provider",
      "Customer",
      "Status",
      "Date",
    ];

    const rows = payments.map((p) => [
      p.amount,
      p.commission,
      p.organizer_amount,
      p.provider,
      p.customer_email,
      p.payout_status,
      formatDate(p.created_at),
    ]);

    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
  }

  /* ======================================================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">
              Organizer Payments
            </h1>
            <p className="text-sm text-zinc-400">
              Stripe-style payout tracking dashboard.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="bg-white/10 px-5 py-3 rounded-xl hover:bg-white/20"
            >
              Export CSV
            </button>

            <button
              onClick={requestWithdrawal}
              className="bg-green-500 text-black font-bold px-5 py-3 rounded-xl hover:bg-green-400"
            >
              Request Withdrawal
            </button>
          </div>
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

        {/* PENDING ALERT */}
        {hasPending && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/40 p-4 rounded-xl text-yellow-300">
            ⚠ Some payouts are still pending.
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
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
          <Stat
            label="Commission %"
            value={`${commissionPercent}%`}
            blue
          />
        </div>

        {/* LIST */}
        <div className="mt-8">

          {loading ? (
            <div className="text-center text-zinc-500">
              Loading payments...
            </div>
          ) : (
            <div className="hidden md:block border border-zinc-800 rounded-2xl overflow-hidden">

              {payments.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className="grid grid-cols-7 items-center px-6 py-4 border-b border-zinc-800 hover:bg-white/5 cursor-pointer"
                >
                  <div className="font-bold">
                    SSP {money(p.amount)}
                  </div>

                  <div>SSP {money(p.commission)}</div>
                  <div>SSP {money(p.organizer_amount)}</div>
                  <div>{p.provider?.toUpperCase()}</div>
                  <div>{p.customer_email}</div>
                  <div>{formatDate(p.created_at)}</div>

                  <div className="flex justify-end">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold capitalize animate-pulse
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
          )}
        </div>

        {/* PAYMENT MODAL */}
        {selectedPayment && (
          <PaymentModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */

function Stat({ label, value, green, yellow, blue }) {
  const color = green
    ? "text-green-400"
    : yellow
    ? "text-yellow-400"
    : blue
    ? "text-sky-400"
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

/* ================= PAYMENT MODAL ================= */

function PaymentModal({ payment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold mb-4">
          Payment Details
        </h2>

        <Detail label="Amount" value={`SSP ${money(payment.amount)}`} />
        <Detail label="Commission" value={`SSP ${money(payment.commission)}`} />
        <Detail label="Organizer" value={`SSP ${money(payment.organizer_amount)}`} />
        <Detail label="Provider" value={payment.provider} />
        <Detail label="Customer" value={payment.customer_email} />
        <Detail label="Ticket" value={payment.ticket_type_name} />
        <Detail label="Status" value={payment.payout_status} />
        <Detail label="Date" value={formatDate(payment.created_at)} />

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