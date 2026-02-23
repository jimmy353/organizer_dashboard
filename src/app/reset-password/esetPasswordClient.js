"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !password2) {
      return alert("Both password fields are required");
    }

    if (password !== password2) {
      return alert("Passwords do not match");
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            password2,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.error || "Reset failed");
        setLoading(false);
        return;
      }

      alert("Password reset successful ✅");
      router.push("/login");
    } catch {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white px-6">
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[420px] shadow-2xl">

        <h1 className="text-3xl font-bold text-emerald-400 text-center mb-6">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 rounded-xl mb-6 outline-none"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Back to{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-emerald-400 font-bold cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}