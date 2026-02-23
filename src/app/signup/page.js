"use client";

import { useState } from "react";

export default function SignupPage() {
  const [role, setRole] = useState("customer");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({});

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    formData.append("role", role);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(JSON.stringify(data));
      return;
    }

    if (role === "organizer") {
      setSubmitted(true);
    } else {
      alert("Account Created ✅ Please verify your email.");
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-12 rounded-3xl text-center">
          <h1 className="text-3xl font-bold text-emerald-400 mb-6">
            Request Submitted ✅
          </h1>
          <p className="text-gray-400">
            Your organizer request is under review.
            Please verify your email OTP first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-10 rounded-3xl w-[420px]"
      >
        <h1 className="text-3xl font-bold mb-8 text-center text-emerald-400">
          Sign Up
        </h1>

        {/* Role */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 py-2 rounded-xl ${
              role === "customer"
                ? "bg-emerald-400 text-black"
                : "bg-white/10"
            }`}
          >
            Customer
          </button>

          <button
            type="button"
            onClick={() => setRole("organizer")}
            className={`flex-1 py-2 rounded-xl ${
              role === "organizer"
                ? "bg-emerald-400 text-black"
                : "bg-white/10"
            }`}
          >
            Organizer
          </button>
        </div>

        <Input name="full_name" placeholder="Full Name" onChange={handleChange} />
        <Input name="email" placeholder="Email" onChange={handleChange} />
        <Input name="phone" placeholder="Phone" onChange={handleChange} />
        <Input name="password" type="password" placeholder="Password" onChange={handleChange} />
        <Input name="password2" type="password" placeholder="Confirm Password" onChange={handleChange} />

        {role === "organizer" && (
          <>
            <Input name="company_name" placeholder="Company Name" onChange={handleChange} />
            <Input name="momo_number" placeholder="MoMo Number" onChange={handleChange} />
            <input
              type="file"
              name="id_document"
              onChange={handleChange}
              className="w-full mb-4"
              required
            />
          </>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-400 text-black py-3 rounded-xl font-bold mt-4"
        >
          {loading
            ? "Processing..."
            : role === "organizer"
            ? "Submit Request"
            : "Create Account"}
        </button>
      </form>
    </div>
  );
}

function Input({ name, placeholder, type = "text", onChange }) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      required
      className="w-full bg-white/10 border border-white/10 px-4 py-3 rounded-xl mb-4 outline-none"
    />
  );
}