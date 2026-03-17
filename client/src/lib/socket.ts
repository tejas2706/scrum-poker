import { io } from 'socket.io-client';

// Use same origin in dev (Vite proxy forwards /socket.io to server)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3000');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
