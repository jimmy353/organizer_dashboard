"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL; // https://api.sirheartevents.com

// ---------- helpers ----------
function toISO(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}:00`;
}

function fromISO(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function formatPretty(iso) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function apiFetch(path, options = {}) {
  const access =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization") && access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) {
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

const CATEGORIES = [
  "music",
  "comedy",
  "nightlife",
  "conference",
  "sports",
  "other",
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // search & filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest|oldest|start_soon

  // modal control: "create" | "view" | "edit" | null
  const [modal, setModal] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);

  // form state (used by create & edit ONLY)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("music");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("music");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setImageFile(null);
    setError("");
  }

  async function fetchEvents() {
    setLoading(true);
    setError("");
    try {
      const { res, data } = await apiFetch("/api/events/organizer/");
      if (!res.ok) {
        setError(data?.detail || "Failed to load events.");
        setEvents([]);
        return;
      }
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Network error loading events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- open modals ----------
  function openCreate() {
    resetForm();
    setEditEvent(null);
    setViewEvent(null);
    setModal("create");
  }

  function openView(ev) {
    setViewEvent(ev);
    setEditEvent(null);
    setModal("view");
  }

  function openEdit(ev) {
    setEditEvent(ev);
    setViewEvent(null);

    setTitle(ev?.title || "");
    setDescription(ev?.description || "");
    setLocation(ev?.location || "");
    setCategory(ev?.category || "music");

    const s = fromISO(ev?.start_date);
    const e = fromISO(ev?.end_date);
    setStartDate(s.date);
    setStartTime(s.time);
    setEndDate(e.date);
    setEndTime(e.time);

    setImageFile(null);
    setError("");
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setViewEvent(null);
    setEditEvent(null);
    setSaving(false);
    setError("");
    setImageFile(null);
  }

  // ---------- CRUD ----------
  async function handleCreate() {
    setError("");
    if (!title || !description || !location) {
      setError("Please fill Title, Description and Location.");
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      setError("Please select Start Date/Time and End Date/Time.");
      return;
    }
    if (!imageFile) {
      setError("Please select an event image.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category", category);
      formData.append("start_date", toISO(startDate, startTime));
      formData.append("end_date", toISO(endDate, endTime));
      formData.append("image", imageFile);

      const { res, data } = await apiFetch("/api/events/create/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError(data?.detail || "Failed to create event.");
        return;
      }

      closeModal();
      await fetchEvents();
    } catch (e) {
      setError("Network error creating event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    setError("");
    if (!editEvent?.id) return;

    if (!title || !description || !location) {
      setError("Please fill Title, Description and Location.");
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      setError("Please select Start Date/Time and End Date/Time.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("category", category);
      formData.append("start_date", toISO(startDate, startTime));
      formData.append("end_date", toISO(endDate, endTime));

      if (imageFile) formData.append("image", imageFile);

      const { res, data } = await apiFetch(`/api/events/${editEvent.id}/`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        setError(data?.detail || "Failed to update event.");
        return;
      }

      closeModal();
      await fetchEvents();
    } catch (e) {
      setError("Network error updating event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ev) {
    if (!ev?.id) return;
    const ok = confirm(`Delete "${ev.title}" ?`);
    if (!ok) return;

    try {
      const { res, data } = await apiFetch(`/api/events/${ev.id}/`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert(data?.detail || "Failed to delete event.");
        return;
      }

      await fetchEvents();
    } catch {
      alert("Network error deleting event.");
    }
  }

  // ---------- filters ----------
  const filteredEvents = useMemo(() => {
    const s = search.trim().toLowerCase();

    let list = [...events];

    if (s) {
      list = list.filter((e) => {
        return (
          (e.title || "").toLowerCase().includes(s) ||
          (e.location || "").toLowerCase().includes(s) ||
          (e.category || "").toLowerCase().includes(s) ||
          (e.description || "").toLowerCase().includes(s)
        );
      });
    }

    if (categoryFilter !== "all") {
      list = list.filter(
        (e) => (e.category || "").toLowerCase() === categoryFilter
      );
    }

    if (sortBy === "newest") {
      list.sort(
        (a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0)
      );
    } else if (sortBy === "oldest") {
      list.sort(
        (a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0)
      );
    } else if (sortBy === "start_soon") {
      list.sort(
        (a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0)
      );
    }

    return list;
  }, [events, search, categoryFilter, sortBy]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              <span className="break-words">Organizer Events</span>
              <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs sm:text-sm font-semibold text-green-300">
                Event Control Centre
              </span>
            </h1>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-black font-bold shadow-lg shadow-green-500/20 hover:bg-green-400 active:scale-[0.99]"
          >
            <span className="text-lg">＋</span> Create Event
          </button>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <span className="text-zinc-500">🔎</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, location, category, description..."
                className="w-full bg-transparent outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="start_soon">Start Soon</option>
            </select>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
              No events found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/30"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                    {ev.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.image}
                        alt={ev.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        No Image
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-zinc-200 backdrop-blur">
                      {String(ev.category || "uncategorized").toUpperCase()}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-extrabold leading-snug break-words">
                          {ev.title || "Untitled"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400 break-words">
                          📍 {ev.location || "N/A"}
                        </p>
                      </div>

                      <div className="w-full sm:w-auto sm:min-w-[190px] rounded-2xl border border-zinc-800 bg-black/30 p-3 text-right text-xs text-zinc-400">
                        <div>🕒 Start</div>
                        <div className="font-semibold text-zinc-200">
                          {formatPretty(ev.start_date)}
                        </div>
                        <div className="mt-2">🕒 End</div>
                        <div className="font-semibold text-zinc-200">
                          {formatPretty(ev.end_date)}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-zinc-300">
                      {ev.description || "No description"}
                    </p>

                    {/* buttons (colored) */}
                    <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2">
                      <button
                        onClick={() => openView(ev)}
                        className="w-full sm:w-auto rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400"
                      >
                        👁 View
                      </button>

                      <button
                        onClick={() => openEdit(ev)}
                        className="w-full sm:w-auto rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(ev)}
                        className="w-full sm:w-auto rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {modal === "view" && viewEvent && (
        <ModalShell title="Event Details" onClose={closeModal}>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              <div className="relative h-48 w-full bg-zinc-900">
                {viewEvent.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewEvent.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold break-words">
                      {viewEvent.title}
                    </h3>
                    <p className="mt-1 text-zinc-400 break-words">
                      📍 {viewEvent.location}
                    </p>
                    <div className="mt-2 inline-flex rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-200">
                      {String(viewEvent.category || "uncategorized").toUpperCase()}
                    </div>
                  </div>

                  <div className="w-full md:w-auto rounded-2xl border border-zinc-800 bg-black/40 p-3 text-sm">
                    <div className="text-zinc-400">Start</div>
                    <div className="font-semibold">
                      {formatPretty(viewEvent.start_date)}
                    </div>
                    <div className="mt-2 text-zinc-400">End</div>
                    <div className="font-semibold">
                      {formatPretty(viewEvent.end_date)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-bold text-zinc-200">Description</div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-300">
                    {viewEvent.description || "No description"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="rounded-xl bg-white/10 px-5 py-2 font-semibold hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* CREATE MODAL */}
      {modal === "create" && (
        <ModalShell title="Create Event" onClose={closeModal}>
          <EventForm
            mode="create"
            saving={saving}
            error={error}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            category={category}
            setCategory={setCategory}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            setEndTime={setEndTime}
            setImageFile={setImageFile}
            onSubmit={handleCreate}
            onCancel={closeModal}
          />
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {modal === "edit" && editEvent && (
        <ModalShell title="Edit Event" onClose={closeModal}>
          <EventForm
            mode="edit"
            saving={saving}
            error={error}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            category={category}
            setCategory={setCategory}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            setEndTime={setEndTime}
            setImageFile={setImageFile}
            onSubmit={handleUpdate}
            onCancel={closeModal}
          />
        </ModalShell>
      )}
    </div>
  );
}

// ---------- Modal Shell (smaller popup) ----------
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
      <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="text-base font-extrabold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4 overflow-y-auto max-h-[calc(90vh-56px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Form Component ----------
function EventForm({
  mode,
  saving,
  error,
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  category,
  setCategory,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  setImageFile,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Title">
          <input
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-green-500/60"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Category">
          <select
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none focus:border-green-500/60"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location" className="md:col-span-2">
          <input
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-green-500/60"
            placeholder="Event location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>

        <Field label="Description" className="md:col-span-2">
          <textarea
            className="min-h-[90px] w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-green-500/60"
            placeholder="Write full event description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {/* Start */}
        <Field label="Start Date">
          <input
            type="date"
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none focus:border-green-500/60"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>

        <Field label="Start Time">
          <input
            type="time"
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none focus:border-green-500/60"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </Field>

        {/* End */}
        <Field label="End Date">
          <input
            type="date"
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none focus:border-green-500/60"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>

        <Field label="End Time">
          <input
            type="time"
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none focus:border-green-500/60"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </Field>

        <Field
          label={mode === "edit" ? "New Image (optional)" : "Event Image"}
          className="md:col-span-2"
        >
          <input
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2 pt-2 md:flex-row md:justify-end">
        <button
          onClick={onCancel}
          className="rounded-xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/15"
        >
          Cancel
        </button>

        <button
          onClick={onSubmit}
          disabled={saving}
          className="rounded-xl bg-green-500 px-6 py-3 font-extrabold text-black shadow-lg shadow-green-500/20 hover:bg-green-400 disabled:opacity-60"
        >
          {saving ? "Saving..." : mode === "edit" ? "Update Event" : "Create Event"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <div className="mb-2 text-sm font-bold text-zinc-200">{label}</div>
      {children}
    </div>
  );
}