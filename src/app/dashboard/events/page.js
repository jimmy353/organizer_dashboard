"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetch(`${API_URL}/api/events/organizer/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function deleteEvent(id) {
    const token = localStorage.getItem("access");

    await fetch(`${API_URL}/api/events/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setEvents(events.filter((e) => e.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-10">
      
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold tracking-wide">
          Your Events
        </h1>

        <button
          onClick={() => router.push("/dashboard/events/create")}
          className="bg-green-500 hover:bg-green-600 transition px-6 py-3 rounded-xl font-semibold shadow-lg"
        >
          + Add Event
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading events...</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:scale-105 transition duration-300"
          >
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-56 object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">
                {event.title}
              </h2>

              <p className="text-gray-400 mb-6">
                {event.location}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    router.push(`/dashboard/events/${event.id}`)
                  }
                  className="flex-1 bg-green-500 hover:bg-green-600 py-2 rounded-lg font-semibold"
                >
                  View
                </button>

                <button
                  onClick={() =>
                    router.push(`/dashboard/events/${event.id}?edit=true`)
                  }
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 py-2 rounded-lg font-semibold"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteEvent(event.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}