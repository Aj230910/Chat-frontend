import { io } from "socket.io-client";

// Read backend URL from .env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://chat-backend-727p.onrender.com";


let socket;

export const connectSocket = (token) => {
  console.log("🌐 Connecting to:", BACKEND_URL);

  socket = io(BACKEND_URL, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect_error", (err) => {
    console.log("❌ SOCKET ERROR:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;
