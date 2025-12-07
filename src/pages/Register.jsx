import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      await API.post("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-200 to-blue-300 dark:from-gray-900 dark:to-gray-800">

      <div className="w-[380px] bg-white/40 dark:bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/30">

        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Create Account ✨
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 dark:text-white border dark:border-gray-700 shadow-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 dark:text-white border dark:border-gray-700 shadow-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 dark:text-white border dark:border-gray-700 shadow-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={register}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition"
          >
            Register
          </button>

          <p className="text-center text-gray-600 dark:text-gray-300 mt-3">
            Already have an account?  
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
