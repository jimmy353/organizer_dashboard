"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ---------- api helper (same style as Events page) ----------
async function apiFetch(path, options = {}) {
  const access =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization") && access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  if (!(options.body instanceof FormData) && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { res, data };
}

export default function TicketsPage() {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [modal, setModal] = useState(null); // "create" | "edit" | null
  const [editingTicket, setEditingTicket] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantityTotal, setQuantityTotal] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- LOAD EVENTS ----------
  async function fetchEvents() {
    setLoading(true);
    setError("");

    const { res, data } = await apiFetch("/api/events/organizer/");

    if (!res.ok) {
      setError(data?.detail || "Failed to load events.");
      setLoading(false);
      return;
    }

    setEvents(data || []);

    if (data.length > 0) {
      setSelectedEvent(data[0].id);
      fetchTickets(data[0].id);
    }

    setLoading(false);
  }

  async function fetchTickets(eventId) {
    const { res, data } = await apiFetch(
      `/api/tickets/?event=${eventId}`
    );

    if (!res.ok) {
      setError(data?.detail || "Failed to load tickets.");
      return;
    }

    setTickets(data || []);
  }

  useEffect(() => {
  fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // ---------- CREATE ----------
  async function handleCreate() {
    if (!name || !price || !quantityTotal) {
      setError("Fill all fields.");
      return;
    }

    setSaving(true);

    const { res, data } = await apiFetch(
      "/api/tickets/type/create/",
      {
        method: "POST",
        body: JSON.stringify({
          event: selectedEvent,
          name,
          price,
          quantity_total: quantityTotal,
        }),
      }
    );

    if (!res.ok) {
      setError(data?.detail || "Failed to create ticket.");
      setSaving(false);
      return;
    }

    closeModal();
    await fetchTickets(selectedEvent);
    setSaving(false);
  }

  // ---------- UPDATE ----------
  async function handleUpdate() {
    if (!editingTicket?.id) return;

    setSaving(true);

    const { res, data } = await apiFetch(
      `/api/tickets/type/${editingTicket.id}/update/`,
      {
        method: "PUT",
        body: JSON.stringify({
          name,
          price,
          quantity_total: quantityTotal,
        }),
      }
    );

    if (!res.ok) {
      setError(data?.detail || "Failed to update ticket.");
      setSaving(false);
      return;
    }

    closeModal();
    await fetchTickets(selectedEvent);
    setSaving(false);
  }

  async function handleDelete(ticket) {
    const ok = confirm(`Delete "${ticket.name}"?`);
    if (!ok) return;

    const { res, data } = await apiFetch(
      `/api/tickets/type/${ticket.id}/delete/`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      alert(data?.detail || "Delete failed.");
      return;
    }

    await fetchTickets(selectedEvent);
  }

  // ---------- FILTER ----------
  const filteredTickets = useMemo(() => {
    const s = search.toLowerCase();
    return tickets.filter((t) =>
      (t.name || "").toLowerCase().includes(s)
    );
  }, [tickets, search]);

  // ---------- MODAL CONTROL ----------
  function openCreate() {
    setEditingTicket(null);
    setName("");
    setPrice("");
    setQuantityTotal("");
    setError("");
    setModal("create");
  }

  function openEdit(ticket) {
    setEditingTicket(ticket);
    setName(ticket.name || "");
    setPrice(ticket.price || "");
    setQuantityTotal(ticket.quantity_total || "");
    setError("");
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingTicket(null);
    setError("");
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold">
            Ticket Management
          </h1>

          <button
            onClick={openCreate}
            className="rounded-xl bg-green-500 px-5 py-3 font-bold text-black hover:bg-green-400"
          >
            + Create Ticket
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Event Selector */}
        <div className="mt-6">
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              fetchTickets(e.target.value);
            }}
            className="w-full md:w-80 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
          />
        </div>

        {/* List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
            >
              <h3 className="text-xl font-bold">
                {ticket.name}
              </h3>

              <div className="mt-2 text-sm text-zinc-400">
                Price: SSP {ticket.price}
              </div>

              <div className="text-sm text-zinc-400">
                Total: {ticket.quantity_total}
              </div>

              <div className="text-sm text-red-400">
                Sold: {ticket.quantity_sold}
              </div>

              <div className="text-sm text-green-400">
                Available: {ticket.available}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(ticket)}
                  className="flex-1 rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(ticket)}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ModalShell
          title={
            modal === "create"
              ? "Create Ticket"
              : "Edit Ticket"
          }
          onClose={closeModal}
        >
          <div className="space-y-4">

            <Field label="Ticket Name">
              <input
                className="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Price">
              <input
                type="number"
                className="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>

            <Field label="Quantity Total">
              <input
                type="number"
                className="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3"
                value={quantityTotal}
                onChange={(e) =>
                  setQuantityTotal(e.target.value)
                }
              />
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={closeModal}
                className="rounded-xl bg-white/10 px-5 py-3"
              >
                Cancel
              </button>

              <button
                onClick={
                  modal === "create"
                    ? handleCreate
                    : handleUpdate
                }
                disabled={saving}
                className="rounded-xl bg-green-500 px-6 py-3 font-bold text-black"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ---------- Modal ----------
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold">{title}</div>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold">{label}</div>
      {children}
    </div>
  );
}