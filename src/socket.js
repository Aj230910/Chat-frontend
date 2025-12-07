import { io } from "socket.io-client";

// ALWAYS ensure backend URL does NOT have trailing slash
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://chat-backend-727p.onrender.com";

let socket = null;

export const connectSocket = (token) => {
  console.log("🌐 Connecting to backend:", BACKEND_URL);

  socket = io(BACKEND_URL, {
    path: "/socket.io",     // ⭐ VERY IMPORTANT FOR RENDER
    transports: ["websocket", "polling"],
    auth: { token },
    secure: true,
  });

  socket.on("connect", () => {
    console.log("⚡ SOCKET CONNECTED:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ SOCKET ERROR:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;
