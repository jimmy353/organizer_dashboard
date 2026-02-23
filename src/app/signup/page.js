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

  // ✅ REQUIRED BY BACKEND (your error screenshot)
  const [momoNumber, setMomoNumber] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [idDocument, setIdDocument] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatBackendError(data) {
    if (!data) return "Signup failed. Try again.";

    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.error) return data.error;

    // turn {"field":["msg"]} into readable text
    if (typeof data === "object") {
      return Object.entries(data)
        .map(([k, v]) => {
          if (Array.isArray(v)) return `${k}: ${v.join(", ")}`;
          return `${k}: ${v}`;
        })
        .join(" | ");
    }

    return "Signup failed. Try again.";
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    // ✅ validations
    if (!fullName || !email || !phone || !companyName || !momoNumber) {
      setError("Full name, email, phone, company name, and MoMo number are required.");
      return;
    }

    if (!password || !password2) {
      setError("Password and Confirm Password are required.");
      return;
    }

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    if (!idDocument) {
      setError("Please upload your ID / Passport.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // ✅ match backend field names from your mobile app
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);

      formData.append("company_name", companyName);
      formData.append("momo_number", momoNumber);

      // optional (if backend supports it)
      formData.append("company_description", companyDescription);

      formData.append("password", password);
      formData.append("password2", password2);

      formData.append("role", "organizer");

      formData.append("id_document", idDocument);

      const res = await fetch(`${API_URL}/api/auth/register/`, {
        method: "POST",
        body: formData,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // backend returned non-json
      }

      if (!res.ok) {
        setError(formatBackendError(data));
        setLoading(false);
        return;
      }

      // ✅ SUCCESS → OTP flow exactly like mobile
      alert(
        "Request Submitted ✅\nWe are reviewing your organizer request.\n\nPlease verify your email OTP first."
      );

      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err?.message || "Network error");
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
          autoCapitalize="none"
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
          placeholder="Company Description (optional)"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
        />

        {/* ✅ REQUIRED: momo_number */}
        <input
          type="text"
          placeholder="MoMo Number / Account"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/10 mb-4 outline-none"
          value={momoNumber}
          onChange={(e) => setMomoNumber(e.target.value)}
          required
        />

        {/* ✅ REQUIRED: ID upload */}
        <div className="mb-4">
          <label className="block text-sm mb-2 text-gray-400">
            Upload ID / Passport
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
            className="w-full text-sm"
            required
          />
          {idDocument && (
            <p className="text-xs text-gray-400 mt-2">
              Selected: {idDocument.name}
            </p>
          )}
        </div>

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
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
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
          <a className="text-[#7CFF00] font-bold hover:underline" href="/login">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}