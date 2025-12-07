import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem("user"));

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);

  const initials = me.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const saveProfile = async () => {
    try {
      // ✅ FIXED API ENDPOINT
      const res = await API.put("/users/update-profile", { name, email });


      const updated = res.data.user;

      localStorage.setItem("user", JSON.stringify(updated));

      alert("Profile updated successfully!");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      alert("Unable to update profile");
      console.log(err);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#dbeafe] to-[#f0f9ff] flex items-center justify-center p-4">

      {/* GLASS CARD */}
      <div className="w-[420px] bg-white/40 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/30 animate-[fadeIn_0.4s_ease]">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/chat")}
          className="text-blue-600 font-semibold hover:underline mb-6"
        >
          ← Back to Chat
        </button>

        {/* PROFILE IMAGE */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-xl animate-[pop_0.4s_ease]">
            <div className="w-full h-full bg-white/90 rounded-full flex items-center justify-center text-4xl font-bold text-blue-700">
              {initials}
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-4 text-gray-800">{me.name}</h2>
          <p className="text-gray-500 text-sm">{me.email}</p>

          <button
            onClick={() => setOpen(true)}
            className="mt-5 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Edit Profile
          </button>
        </div>

        {/* DETAILS CARD */}
        <div className="mt-8 p-5 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 shadow-inner">
          <h3 className="text-gray-700 font-semibold mb-3">Account Details</h3>

          <div className="space-y-2 text-gray-600">
            <p><span className="font-semibold">Name:</span> {me.name}</p>
            <p><span className="font-semibold">Email:</span> {me.email}</p>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="w-full mt-8 py-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition font-semibold"
        >
          Logout
        </button>

      </div>

      {/* EDIT MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center animate-[fadeIn_0.2s_ease]">
          <div className="w-[380px] bg-white rounded-2xl p-6 shadow-xl animate-[pop_0.25s_ease]">

            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            <input
              className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-xl"
                onClick={saveProfile}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
