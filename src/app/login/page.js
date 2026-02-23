"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          phone: phone,
          company_name: companyName,
          company_description: companyDescription,
          password: password,
          role: "organizer"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.detail ||
          data.error ||
          JSON.stringify(data)
        );
        setLoading(false);
        return;
      }

      // ✅ SUCCESS → GO TO OTP PAGE
      router.push(`/verify-otp?email=${email}`);

    } catch (err) {
      setError("Network error");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 text-white">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
      >
        <h1 className="text-3xl font-bold text-[#7CFF00] mb-6 text-center">
          Organizer Sign Up
        </h1>

        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Phone"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Company Name"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Company Description"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-6 outline-none"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#7CFF00] text-black py-3 rounded-full font-bold"
        >
          {loading ? "Submitting..." : "Submit Organizer Request"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#7CFF00] font-bold hover:underline"
          >
            Login
          </a>
        </p>
      </form>
    </div>
  );
}