import type { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  io = server;
}

export function emitToRoom(room: string, event: string, payload: unknown): void {
  io?.to(room).emit(event, payload);
}

export const ROOMS = {
  hq: "hq",
  incident: (ackNumber: string) => `incident:${ackNumber}`,
} as const;

export const EVENTS = {
  incidentNew: "incident:new",
  incidentStatusUpdate: "incident:status-update",
  incidentFreeze: "incident:freeze",
} as const;
