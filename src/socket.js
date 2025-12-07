import { io } from "socket.io-client";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://chat-backend-727p.onrender.com";

let socket = null;

export const connectSocket = (token) => {
  console.log("Connecting to:", BACKEND_URL);

  socket = io(BACKEND_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    withCredentials: true,
  });

  return socket;
};

export const getSocket = () => socket;
