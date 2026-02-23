"use client";

import { useEffect, useState } from "react";

const API_URL = "https://api.sirheartevents.com";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("music");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

      if (res.status === 401) {
        alert("Unauthorized. Please login again.");
        return;
      }

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("music");
    setStartDate("");
    setEndDate("");
    setImageFile(null);
  }

  async function createEvent() {
    const token = localStorage.getItem("access");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("category", category);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await fetch(`${API_URL}/api/events/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      alert("Create failed");
      return;
    }

    alert("Event created!");
    setShowCreate(false);
    resetForm();
    fetchEvents();
  }

  async function updateEvent() {
    const token = localStorage.getItem("access");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("category", category);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await fetch(
      `${API_URL}/api/events/${editingEvent.id}/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!res.ok) {
      alert("Update failed");
      return;
    }

    alert("Updated!");
    setShowEdit(false);
    resetForm();
    fetchEvents();
  }

  async function deleteEvent(id) {
    const token = localStorage.getItem("access");

    if (!confirm("Delete this event?")) return;

    const res = await fetch(`${API_URL}/api/events/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    alert("Deleted");
    fetchEvents();
  }

  function openView(event) {
    setSelectedEvent(event);
    setShowView(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    setCategory(event.category);
    setStartDate(event.start_date);
    setEndDate(event.end_date);
    setShowEdit(true);
  }

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Organizer Events</h1>

      <div className="flex gap-4 mb-6">
        <input
          placeholder="Search..."
          className="p-2 rounded text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-500 px-4 py-2 rounded"
        >
          + Create Event
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        filtered.map((event) => (
          <div
            key={event.id}
            className="border border-gray-700 p-4 mb-4 rounded"
          >
            {event.image && (
              <img
                src={event.image}
                className="w-full h-48 object-cover mb-3 rounded"
              />
            )}

            <h2 className="text-xl font-bold">{event.title}</h2>
            <p>{event.location}</p>
            <p>{event.category}</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => openView(event)}
                className="bg-blue-500 px-3 py-1 rounded"
              >
                View
              </button>

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
        ))
      )}

      {/* CREATE / EDIT MODAL */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h2 className="text-xl mb-4">
              {showCreate ? "Create Event" : "Edit Event"}
            </h2>

            <input
              className="w-full mb-2 p-2 text-black rounded"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="w-full mb-2 p-2 text-black rounded"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              className="w-full mb-2 p-2 text-black rounded"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <input
              type="datetime-local"
              className="w-full mb-2 p-2 text-black rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <input
              type="datetime-local"
              className="w-full mb-2 p-2 text-black rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <input
              type="file"
              className="mb-2"
              onChange={(e) => setImageFile(e.target.files[0])}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={showCreate ? createEvent : updateEvent}
                className="bg-green-500 px-3 py-1 rounded"
              >
                Save
              </button>

              <button
                onClick={() => {
                  setShowCreate(false);
                  setShowEdit(false);
                  resetForm();
                }}
                className="bg-gray-500 px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showView && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <div className="bg-gray-900 p-6 rounded w-96">
            <h2 className="text-xl mb-4">{selectedEvent.title}</h2>

            {selectedEvent.image && (
              <img
                src={selectedEvent.image}
                className="w-full h-48 object-cover mb-3 rounded"
              />
            )}

            <p>Location: {selectedEvent.location}</p>
            <p>Category: {selectedEvent.category}</p>
            <p>Start: {selectedEvent.start_date}</p>
            <p>End: {selectedEvent.end_date}</p>
            <p className="mt-3">{selectedEvent.description}</p>

            <button
              onClick={() => setShowView(false)}
              className="bg-gray-500 px-3 py-1 rounded mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}