"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset-confirm/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }
    );

    setDone(true);
  }

  if (done)
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        Password reset successful ✅
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 p-10 rounded-3xl w-[400px]"
      >
        <h1 className="text-2xl mb-6">Reset Password</h1>

        <input
          type="password"
          required
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 rounded-xl mb-4"
        />

        <button className="w-full bg-emerald-400 text-black py-3 rounded-xl">
          Reset Password
        </button>
      </form>
    </div>
  );
}