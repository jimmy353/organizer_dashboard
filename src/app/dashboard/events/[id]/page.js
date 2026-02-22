"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EventDetailPage() {
  const { id } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [event, setEvent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");

    fetch(`${API_URL}/api/events/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setEvent(data));
  }, [id]);

  if (!event)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
        
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-80 object-cover rounded-2xl mb-6"
          />
        )}

        <h1 className="text-3xl font-bold mb-4">
          {event.title}
        </h1>

        <p className="text-gray-400 mb-4">
          {event.location}
        </p>

        <p className="text-gray-300">
          {event.description}
        </p>
      </div>
    </div>
  );
}