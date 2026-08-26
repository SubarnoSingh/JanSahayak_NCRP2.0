"use client";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const isBrowser = typeof window !== "undefined";
    const url = isBrowser ? "" : (process.env.API_BACKEND_URL ?? "http://localhost:4000");
    socket = io(url || undefined, { path: "/ws", transports: ["websocket", "polling"] });
  }
  return socket;
}
