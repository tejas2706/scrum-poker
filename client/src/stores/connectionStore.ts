import { create } from 'zustand';
import { socket } from '../lib/socket';

type ConnectionState = 'connected' | 'disconnected' | 'connecting';

interface ConnectionStore {
  status: ConnectionState;
}

export const useConnectionStore = create<ConnectionStore>((set) => {
  socket.on('connect', () => set({ status: 'connected' }));
  socket.on('disconnect', () => set({ status: 'disconnected' }));
  socket.on('connect_error', () => set({ status: 'disconnected' }));

  return {
    status: socket.connected ? 'connected' : 'connecting',
  };
});
