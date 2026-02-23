"use client";

import { useEffect, useState } from "react";

const API_URL = "https://api.sirheartevents.com";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      location: "",
      category: "music",
      start_date: "",
      start_time: "",
      end_date: "",
      end_time: "",
    });
    setShowModal(true);
  }

  function openEdit(event) {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    setEditing(event);

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

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
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
    const startISO = `${form.start_date}T${form.start_time}:00`;
    const endISO = `${form.end_date}T${form.end_time}:00`;

    formData.append("start_date", startISO);
    formData.append("end_date", endISO);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const url = editing
      ? `${API_URL}/api/events/${editing.id}/`
      : `${API_URL}/api/events/create/`;

    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      alert("Error saving event");
      return;
    }

    closeModal();
    fetchEvents();
  }

  async function deleteEvent(id) {
    const token = localStorage.getItem("access");

    if (!confirm("Delete this event?")) return;

    await fetch(`${API_URL}/api/events/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchEvents();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-10">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Organizer Events</h1>
        <button
          onClick={openCreate}
          className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg"
        >
          + Create Event
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
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
                <h2 className="text-lg font-bold mb-2">
                  {event.title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {event.location}
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => openEdit(event)}
                    className="bg-yellow-500 px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="bg-red-500 px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
          <div className="bg-[#1e293b] p-8 rounded-xl w-full max-w-lg">

            <h2 className="text-xl font-bold mb-6">
              {editing ? "Edit Event" : "Create Event"}
            </h2>

            <input
              placeholder="Title"
              className="w-full mb-3 p-3 rounded bg-[#0f172a]"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <input
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

            {/* START DATE + TIME */}
            <div className="grid grid-cols-2 gap-3 mb-3">
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

            {/* END DATE + TIME */}
            <div className="grid grid-cols-2 gap-3 mb-3">
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
              className="mb-4"
              onChange={(e) =>
                setImageFile(e.target.files[0])
              }
            />

            <div className="flex justify-end gap-4">
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