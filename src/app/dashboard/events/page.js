"use client";

import { useEffect, useState } from "react";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

const API_URL = "https://api.sirheartevents.com";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    category: "music",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
  });

  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const token = localStorage.getItem("access");

      const res = await fetch(`${API_URL}/api/events/organizer/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function openModal(type, event = null) {
    setMode(type);
    setSelected(event);

    if (event) {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);

      setForm({
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        start_date: start.toISOString().slice(0, 10),
        start_time: start.toISOString().slice(11, 16),
        end_date: end.toISOString().slice(0, 10),
        end_time: end.toISOString().slice(11, 16),
      });
    }

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelected(null);
    setImageFile(null);
  }

  async function saveEvent() {
    const token = localStorage.getItem("access");

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("location", form.location);
    formData.append("category", form.category);

    // Combine date + time
    formData.append(
      "start_date",
      `${form.start_date}T${form.start_time}:00`
    );
    formData.append(
      "end_date",
      `${form.end_date}T${form.end_time}:00`
    );

    if (imageFile) formData.append("image", imageFile);

    const url =
      mode === "edit"
        ? `${API_URL}/api/events/${selected.id}/`
        : `${API_URL}/api/events/create/`;

    const method = mode === "edit" ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    closeModal();
    fetchEvents();
  }

  async function deleteEvent(id) {
    const token = localStorage.getItem("access");

    if (!confirm("Delete this event?")) return;

    await fetch(`${API_URL}/api/events/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchEvents();
  }

  const filtered = events.filter((e) => {
    const matchSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "all" ||
      e.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>

        <button
          onClick={() => openModal("create")}
          className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Create Event
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-4 mb-8">
        <input
          placeholder="Search events..."
          className="p-3 rounded bg-[#1e293b] w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="p-3 rounded bg-[#1e293b]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="music">Music</option>
          <option value="comedy">Comedy</option>
          <option value="nightlife">Nightlife</option>
        </select>
      </div>

      {/* EVENTS GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((event) => {
          const start = new Date(event.start_date);

          return (
            <div
              key={event.id}
              className="bg-[#1e293b] rounded-xl overflow-hidden shadow-lg"
            >
              {event.image && (
                <img
                  src={event.image}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-5">

                {/* CATEGORY BADGE */}
                <span className="text-xs bg-green-600 px-3 py-1 rounded-full">
                  {event.category}
                </span>

                <h2 className="font-bold text-lg mt-3">
                  {event.title}
                </h2>

                <p className="text-gray-400 text-sm mt-1">
                  {event.location}
                </p>

                {/* DATE + TIME */}
                <p className="text-sm text-gray-300 mt-2">
                  📅 {start.toLocaleDateString()}
                </p>

                <p className="text-sm text-gray-300">
                  ⏰ {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* DESCRIPTION PREVIEW */}
                <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                  {event.description}
                </p>

                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => openModal("view", event)}
                    className="text-blue-400"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => openModal("edit", event)}
                    className="text-yellow-400"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-[#1e293b] p-8 rounded-xl w-full max-w-lg">

            <h2 className="text-xl font-bold mb-6">
              {mode === "edit" ? "Edit Event" : "Create Event"}
            </h2>

            <input
              placeholder="Title"
              className="w-full mb-3 p-3 rounded bg-[#0f172a]"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <textarea
              placeholder="Description"
              className="w-full mb-3 p-3 rounded bg-[#0f172a]"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <input
              placeholder="Location"
              className="w-full mb-3 p-3 rounded bg-[#0f172a]"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />

            {/* CATEGORY DROPDOWN */}
            <select
              className="w-full mb-3 p-3 rounded bg-[#0f172a]"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="music">Music</option>
              <option value="comedy">Comedy</option>
              <option value="nightlife">Nightlife</option>
            </select>

            {/* DATE & TIME SEPARATED */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="p-3 rounded bg-[#0f172a]"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
              <input
                type="time"
                className="p-3 rounded bg-[#0f172a]"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="date"
                className="p-3 rounded bg-[#0f172a]"
                value={form.end_date}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value })
                }
              />
              <input
                type="time"
                className="p-3 rounded bg-[#0f172a]"
                value={form.end_time}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
            </div>

            <input
              type="file"
              className="mt-4"
              onChange={(e) =>
                setImageFile(e.target.files[0])
              }
            />

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveEvent}
                className="px-4 py-2 bg-green-500 rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}