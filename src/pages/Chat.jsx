import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { connectSocket, getSocket } from "../socket";

// Wallpapers
const chatWallpapers = {
  blue: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50",
};

// Avatar
function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-700 text-blue-600 dark:text-white font-bold shadow">
      {initials}
    </div>
  );
}

export default function Chat() {
  const me = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(localStorage.getItem("darkMode") === "true");

  const bottomRef = useRef(null);

  // DARK MODE
  useEffect(() => {
    dark
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");

    localStorage.setItem("darkMode", dark);
  }, [dark]);

  // CONNECT SOCKET
  useEffect(() => {
    const s = connectSocket(token);

    s.on("connect", () => {
      console.log("⚡ Connected:", s.id);
      s.emit("userConnected", me._id);
    });

    // NEW MESSAGE LISTENER
    s.on("newMessage", (msg) => {
      if (!current) return;

      const activeRoom = [me._id, current._id].sort().join("_");
      const msgRoom = [msg.sender, msg.receiver].sort().join("_");

      if (activeRoom === msgRoom) {
        setMessages((prev) => [...prev, msg]);
        scrollBottom();
      }
    });

    return () => s.disconnect();
  }, [current]);

  // LOAD USERS
  useEffect(() => {
    API.get("/users/all").then((res) =>
      setUsers(res.data.filter((u) => u._id !== me._id))
    );
  }, []);

  const scrollBottom = () =>
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      80
    );

  // OPEN CHAT
  const openChat = async (u) => {
    setCurrent(u);

    getSocket().emit("joinRoom", { userId1: me._id, userId2: u._id });

    const res = await API.get(`/messages/${me._id}/${u._id}`);
    setMessages(res.data);

    scrollBottom();
  };

  // SEND MESSAGE
  const sendMsg = () => {
    if (!text.trim() || !current) return;

    const payload = {
      sender: me._id,
      receiver: current._id,
      text,
    };

    // 1️⃣ Send to backend
    getSocket().emit("privateMessage", payload);

    // 2️⃣ Add to UI immediately
    setMessages((prev) => [
      ...prev,
      { ...payload, createdAt: new Date().toISOString() },
    ]);

    setText("");
    scrollBottom();
  };

  // FILTER USERS
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  // ------------------------
  //       DESKTOP UI
  // ------------------------

  return (
    <div className="w-screen h-screen flex bg-gray-100 dark:bg-gray-950 p-4 gap-4">

      {/* SIDEBAR */}
      <div className="w-80 bg-white/80 dark:bg-gray-900/70 rounded-3xl p-5 shadow-xl flex flex-col">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {dark ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => (window.location.href = "/profile")}
              className="p-2 rounded-full bg-blue-100 dark:bg-gray-700"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 mb-4"
        />

        {/* USER LIST */}
        <div className="overflow-y-auto space-y-3">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => openChat(u)}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer ${
                current?._id === u._id
                  ? "bg-blue-200 dark:bg-gray-700"
                  : "bg-gray-200 dark:bg-gray-800"
              }`}
            >
              <Avatar name={u.name} />
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className="flex-1 bg-white/80 dark:bg-gray-900/70 rounded-3xl shadow-xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="h-20 flex items-center px-6 border-b dark:border-gray-700">
          {current ? (
            <div className="flex items-center gap-3">
              <Avatar name={current.name} />
              <div>
                <p className="text-lg font-semibold">{current.name}</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a chat</p>
          )}
        </div>

        {/* MESSAGES */}
        <div
          className={`flex-1 overflow-y-auto p-6 space-y-4 ${chatWallpapers.blue}`}
        >
          {messages.map((msg, i) => {
            const mine = msg.sender === me._id;

            return (
              <div
                key={i}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  title={new Date(msg.createdAt).toLocaleString()}
                  className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-xl ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  {msg.text}

                  <div className="text-[10px] mt-1 opacity-80 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        {current && (
          <div className="h-20 flex items-center gap-3 px-4 border-t dark:border-gray-700 bg-white/70 dark:bg-gray-800">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-gray-200 dark:bg-gray-700"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMsg}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
