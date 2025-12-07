import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { connectSocket, getSocket } from "../socket";

// Wallpapers
const chatWallpapers = {
  blue: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/40",
  pastelPink: "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/40",
  mintGreen: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/40",
  lavender: "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-800/40",
};

// Avatar
function Avatar({ name }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();
  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 dark:bg-gray-700 text-blue-700 dark:text-white font-bold shadow">
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
  const [theme] = useState("blue");
  const [dark, setDark] = useState(localStorage.getItem("darkMode") === "true");

  const [mobileView, setMobileView] = useState("users");
  const [openOptionsFor, setOpenOptionsFor] = useState(null);

  const bottomRef = useRef(null);

  // DARK
  useEffect(() => {
    dark ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", dark);
  }, [dark]);

  // SOCKET
  useEffect(() => {
    const s = connectSocket(token);
    s.on("connect", () => s.emit("userConnected", me._id));

    s.on("newMessage", (msg) => {
      const myRoom = [me._id, current?._id].sort().join("_");
      const msgRoom = [msg.sender, msg.receiver].sort().join("_");

      if (myRoom === msgRoom) {
        setMessages((prev) => [...prev, msg]);
        scrollBottom();
      }
    });

    // DELETE RECEIVED
    s.on("messageDeleted", ({ messageId, forEveryone, userId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id !== messageId) return msg;

          if (forEveryone) {
            return { ...msg, text: "", deletedForEveryone: true };
          }

          if (userId === me._id) {
            return { ...msg, deletedForMe: true };
          }

          return msg;
        })
      );
    });

    return () => s.disconnect();
  }, [current]);

  // USERS
  useEffect(() => {
    API.get("/users/all").then((res) => {
      setUsers(res.data.filter((u) => u._id !== me._id));
    });
  }, []);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  // OPEN CHAT
  const openChat = async (u) => {
    setCurrent(u);

    getSocket().emit("joinRoom", { userId1: me._id, userId2: u._id });

    const res = await API.get(`/messages/${me._id}/${u._id}`);
    setMessages(res.data);

    scrollBottom();
    setMobileView("chat");
  };

  // SEND MESSAGE
  const sendMsg = () => {
    if (!text.trim() || !current) return;

    const payload = {
      sender: me._id,
      receiver: current._id,
      text,
    };

    getSocket().emit("privateMessage", payload);

    setMessages((prev) => [
      ...prev,
      {
        ...payload,
        _id: Date.now(),
        createdAt: new Date().toISOString(),
      },
    ]);

    setText("");
    scrollBottom();
  };

  // ❌ DELETE MESSAGE
  const deleteMessage = (msg, forEveryone) => {
    getSocket().emit("deleteMessage", {
      messageId: msg._id,
      userId: me._id,
      forEveryone,
    });

    setOpenOptionsFor(null);
  };

  /* ------------------------------ UI COMPONENTS ------------------------------ */

  // MOBILE USER LIST
  const MobileUserList = (
    <div className="w-full h-full bg-white dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Chats</h2>

        <div className="flex gap-3">
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            {dark ? "🌙" : "☀"}
          </button>
          <button onClick={() => (window.location.href = "/profile")} className="p-2 rounded-full bg-blue-200">
            ⚙
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full p-2 rounded-xl bg-gray-200 dark:bg-gray-800 mb-4"
      />

      {users
        .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
        .map((u) => (
          <div
            key={u._id}
            onClick={() => openChat(u)}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-100"
          >
            <Avatar name={u.name} />
            <div>
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs">{u.email}</p>
            </div>
          </div>
        ))}
    </div>
  );

  // MOBILE CHAT
  const MobileChatScreen = (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900">

      {/* HEADER */}
      <div className="h-16 flex items-center px-4 border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <button onClick={() => setMobileView("users")} className="mr-3 text-xl text-blue-600">
          ←
        </button>
        <Avatar name={current?.name} />
        <p className="ml-3 font-semibold">{current?.name}</p>
      </div>

      {/* MESSAGES */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${chatWallpapers[theme]}`}>
        {messages.map((msg) => {
          const mine = msg.sender === me._id;

          if (msg.deletedForEveryone)
            return (
              <p key={msg._id} className={`italic text-xs text-gray-500 ${mine ? "text-right" : ""}`}>
                Message deleted
              </p>
            );

          if (msg.deletedForMe) return null;

          return (
            <div key={msg._id} className={`relative flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                title={new Date(msg.createdAt).toLocaleString()}
                className={`max-w-xs px-4 py-3 rounded-2xl shadow text-sm cursor-pointer ${
                  mine
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOpenOptionsFor(msg._id);
                }}
              >
                {msg.text}

                <p className="text-[10px] opacity-70 text-right mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {openOptionsFor === msg._id && (
                <div className="absolute top-0 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-xl z-50">
                  <button
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => deleteMessage(msg, false)}
                  >
                    Delete for me
                  </button>

                  {mine && (
                    <button
                      className="block w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => deleteMessage(msg, true)}
                    >
                      Delete for everyone
                    </button>
                  )}

                  <button
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setOpenOptionsFor(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="h-16 flex items-center gap-3 px-4 border-t bg-gray-100 dark:bg-gray-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-3 rounded-xl bg-gray-200 dark:bg-gray-700"
          placeholder="Type a message..."
        />
        <button onClick={sendMsg} className="px-5 py-3 bg-blue-600 text-white rounded-xl">
          Send
        </button>
      </div>
    </div>
  );

  /* ------------------ DESKTOP VIEW --------------------- */

  const DesktopView = (
    <div className="flex w-full h-full gap-4">

      {/* SIDEBAR */}
      <div className="w-80 bg-white dark:bg-gray-900 rounded-3xl p-5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            {dark ? "🌙" : "☀"}
          </button>
        </div>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 mb-4 rounded-xl bg-gray-200 dark:bg-gray-800"
          placeholder="Search users..."
        />

        <div className="overflow-y-auto space-y-3">
          {users
            .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
            .map((u) => (
              <div
                key={u._id}
                onClick={() => openChat(u)}
                className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 ${
                  current?._id === u._id ? "bg-blue-200 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800"
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

      {/* CHAT */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-lg flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="h-20 flex items-center px-6 border-b bg-white dark:bg-gray-800">
          {current ? (
            <>
              <Avatar name={current.name} />
              <p className="text-lg ml-3 font-semibold">{current.name}</p>
            </>
          ) : (
            <p>Select a chat</p>
          )}
        </div>

        {/* MESSAGES */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${chatWallpapers[theme]}`}>
          {messages.map((msg) => {
            const mine = msg.sender === me._id;

            if (msg.deletedForEveryone)
              return (
                <p key={msg._id} className={`italic text-xs text-gray-500 ${mine ? "text-right" : ""}`}>
                  Message deleted
                </p>
              );

            if (msg.deletedForMe) return null;

            return (
              <div key={msg._id} className={`relative flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  title={new Date(msg.createdAt).toLocaleString()}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setOpenOptionsFor(msg._id);
                  }}
                  className={`max-w-xs px-4 py-3 rounded-2xl shadow cursor-pointer ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  {msg.text}

                  <p className="text-[10px] opacity-70 text-right mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* DELETE MENU */}
                {openOptionsFor === msg._id && (
                  <div className="absolute top-0 right-0 bg-white dark:bg-gray-800 border rounded-lg p-2 shadow-xl z-50">
                    <button
                      onClick={() => deleteMessage(msg, false)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Delete for me
                    </button>

                    {mine && (
                      <button
                        onClick={() => deleteMessage(msg, true)}
                        className="block w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        Delete for everyone
                      </button>
                    )}

                    <button
                      onClick={() => setOpenOptionsFor(null)}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        {current && (
          <div className="h-20 flex items-center gap-3 px-4 border-t bg-gray-100 dark:bg-gray-800">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-gray-200 dark:bg-gray-700"
              placeholder="Type a message..."
            />
            <button onClick={sendMsg} className="px-6 py-3 bg-blue-600 text-white rounded-xl">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen">
      {/* MOBILE */}
      <div className="lg:hidden w-full h-full">
        {mobileView === "users" ? MobileUserList : MobileChatScreen}
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex w-full h-full p-4 bg-gray-100 dark:bg-gray-950">
        {DesktopView}
      </div>
    </div>
  );
}
