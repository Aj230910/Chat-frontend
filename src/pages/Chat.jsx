import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { connectSocket, getSocket } from "../socket";

const chatWallpapers = {
  blue: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/30 dark:to-blue-700/40",
};

function Avatar({ name }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();
  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-700 text-blue-600 dark:text-white font-bold shadow">
      {initials}
    </div>
  );
}

function MsgTick({ status }) {
  return (
    <span className="text-[14px] ml-1">
      {status === "sent" && <span className="text-gray-600 dark:text-gray-300">✓</span>}
      {status === "delivered" && <span className="text-gray-600 dark:text-gray-300">✓✓</span>}
      {status === "seen" && <span className="text-blue-500">✓✓</span>}
    </span>
  );
}

function ReplyBlock({ reply }) {
  if (!reply) return null;
  const myId = JSON.parse(localStorage.getItem("user"))._id;

  return (
    <div
      className={`border-l-4 pl-2 mb-1 text-[12px] ${
        reply.sender === myId
          ? "border-blue-300 text-white/80"
          : "border-gray-400 text-gray-700 dark:text-gray-300"
      }`}
    >
      {reply.text}
    </div>
  );
}

export default function Chat() {
  const me = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [current, setCurrent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [dark, setDark] = useState(localStorage.getItem("darkMode") === "true");
  const [openOptionsFor, setOpenOptionsFor] = useState(null);

  const bottomRef = useRef(null);

  useEffect(() => {
    dark ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", dark);
  }, [dark]);

  useEffect(() => {
    const s = connectSocket(token);
    s.on("connect", () => s.emit("userConnected", me._id));

    s.on("newMessage", (msg) => {
      if (!current) return;
      const active = [me._id, current._id].sort().join("_");
      const room = [msg.sender, msg.receiver].sort().join("_");
      if (active === room) {
        setMessages((p) => [...p, msg]);
        scrollBottom();
      }
    });

    s.on("messageDeleted", ({ messageId, forEveryone, userId }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== messageId) return m;

          if (forEveryone) return { ...m, text: "", deletedForEveryone: true };

          if (userId === me._id) return { ...m, deletedForMe: true };

          return m;
        })
      );
    });

    return () => s.disconnect();
  }, [current]);

  useEffect(() => {
    API.get("/users/all").then((res) => setUsers(res.data.filter((u) => u._id !== me._id)));
  }, []);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  const openChat = async (u) => {
    setCurrent(u);

    getSocket().emit("joinRoom", { userId1: me._id, userId2: u._id });

    const res = await API.get(`/messages/${me._id}/${u._id}`);
    setMessages(res.data);

    getSocket().emit("markAsSeen", { sender: me._id, receiver: u._id });

    scrollBottom();
  };

  // ⭐⭐⭐ FIXED sendMsg()
  const sendMsg = () => {
    if (!text.trim() || !current) return;

    const localId = Date.now();

    const tempMsg = {
      _id: localId,
      sender: me._id,
      receiver: current._id,
      text,
      replyTo,
      status: "sent",
      createdAt: new Date().toISOString(),
    };

    setMessages((p) => [...p, tempMsg]);

    // 🚀 CORRECT FORMAT FOR BACKEND  
    getSocket().emit("privateMessage", {
      sender: me._id,
      receiver: current._id,
      text,
      replyTo,
    });

    setText("");
    setReplyTo(null);
    scrollBottom();
  };

  const deleteMessage = (msg, forEveryone) => {
    getSocket().emit("deleteMessage", {
      messageId: msg._id,
      userId: me._id,
      forEveryone,
    });

    setOpenOptionsFor(null);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="flex w-screen h-screen bg-gray-100 dark:bg-gray-950 p-4 gap-4">
      {/* SIDEBAR */}
      <div className="w-80 bg-white/80 dark:bg-gray-900/70 rounded-3xl p-5 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Chats</h2>
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            {dark ? "🌙" : "☀️"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Search user..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 mb-4"
        />

        <div className="space-y-3 overflow-y-auto">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              onClick={() => openChat(u)}
              className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 ${
                current?._id === u._id ? "bg-blue-200 dark:bg-gray-700" : "bg-gray-200 dark:bg-gray-800"
              }`}
            >
              <Avatar name={u.name} />
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 bg-white/80 dark:bg-gray-900/70 rounded-3xl shadow-xl flex flex-col overflow-hidden">

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
            <p>Select a chat</p>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${chatWallpapers.blue}`}>
          {messages.map((msg) => {
            const mine = msg.sender === me._id;

            if (msg.deletedForEveryone) {
              return (
                <p key={msg._id} className={`italic text-xs text-gray-500 ${mine ? "text-right" : ""}`}>
                  Message deleted
                </p>
              );
            }

            return (
              <div key={msg._id} className={`relative flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  onDoubleClick={() => setReplyTo(msg)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setOpenOptionsFor(msg._id);
                  }}
                  className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-xl cursor-pointer ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                  }`}
                >
                  {msg.replyTo && <ReplyBlock reply={msg.replyTo} />}
                  {msg.text}

                  <div className="text-[10px] mt-1 flex items-center justify-end opacity-80">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {mine && <MsgTick status={msg.status} />}
                  </div>
                </div>

                {/* OPTIONS MENU */}
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

        {replyTo && (
          <div className="px-4 py-2 bg-blue-100 dark:bg-gray-700 flex justify-between items-center">
            <div className="text-sm">Replying to: <b>{replyTo.text}</b></div>
            <button onClick={() => setReplyTo(null)} className="text-xl">✕</button>
          </div>
        )}

        <div className="h-20 flex items-center gap-3 px-4 border-t dark:border-gray-700 bg-white/70 dark:bg-gray-800">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-gray-200 dark:bg-gray-700"
            placeholder="Type a message…"
          />
          <button onClick={sendMsg} className="px-6 py-3 bg-blue-600 text-white rounded-xl">
            Send
          </button>
        </div>

      </div>
    </div>
  );
}
