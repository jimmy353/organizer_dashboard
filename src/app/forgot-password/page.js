"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    setDone(true);
  }

  if (done)
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        Reset link sent to your email ✅
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 p-10 rounded-3xl w-[400px]"
      >
        <h1 className="text-2xl mb-6">Forgot Password</h1>

        <input
          type="email"
          required
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 rounded-xl mb-4"
        />

        <button className="w-full bg-emerald-400 text-black py-3 rounded-xl">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}