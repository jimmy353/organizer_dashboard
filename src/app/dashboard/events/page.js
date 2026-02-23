"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    category: "music",
    start_date: "",
    end_date: "",
    image: null,
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const token = localStorage.getItem("access");

    if (!token) {
      window.location.href = "/";
      return;
    }

    const res = await fetch(`${API_URL}/api/events/organizer/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("access");
      window.location.href = "/";
      return;
    }

    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value, files } = e.target;

    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function saveEvent() {
    const token = localStorage.getItem("access");

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    if (editingId) {
      await fetch(`${API_URL}/api/events/${editingId}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      await fetch(`${API_URL}/api/events/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    }

    setEditingId(null);
    setForm({
      title: "",
      description: "",
      location: "",
      category: "music",
      start_date: "",
      end_date: "",
      image: null,
    });

    fetchEvents();
  }

  async function deleteEvent(id) {
    const token = localStorage.getItem("access");

    await fetch(`${API_URL}/api/events/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchEvents();
  }

  function editEvent(event) {
    setEditingId(event.id);
    setForm({
      ...event,
      image: null,
    });
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold mb-10">
        Organizer Events
      </h1>

      {/* FORM */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-10">
        <h2 className="text-xl mb-6">
          {editingId ? "Edit Event" : "Create Event"}
        </h2>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full p-3 mb-4 bg-black rounded"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-3 mb-4 bg-black rounded"
        />

        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          className="w-full p-3 mb-4 bg-black rounded"
        />

        <input
          type="datetime-local"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-black rounded"
        />

        <input
          type="datetime-local"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
          className="w-full p-3 mb-4 bg-black rounded"
        />

        <input
          type="file"
          name="image"
          onChange={handleChange}
          className="mb-4"
        />

        <button
          onClick={saveEvent}
          className="bg-green-500 px-6 py-3 rounded text-black font-bold"
        >
          {editingId ? "Update" : "Create"}
        </button>
      </div>

      {/* EVENTS LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-zinc-900 p-5 rounded-xl"
            >
              {event.image && (
                <img
                  src={event.image}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}

              <h2 className="font-bold text-lg">
                {event.title}
              </h2>

              <p className="text-gray-400">
                {event.location}
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => editEvent(event)}
                  className="bg-yellow-500 px-3 py-1 rounded text-black"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteEvent(event.id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}