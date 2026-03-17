import { create } from 'zustand';
import { socket } from '../lib/socket';

export type UserRole = 'developer' | 'qa' | 'product-owner';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Vote {
  userId: string;
  userName: string;
  userRole: UserRole;
  value: string;
}

export interface RoleSummary {
  average: number | null;
  mode: string | null;
  finalDecision: number | null;
}

export interface FeatureHistoryEntry {
  featureNumber: string;
  overallAverage: number | null;
  roleSummaries: Record<UserRole, RoleSummary>;
}

export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdBySocketId?: string;
  createdAt: string;
  users: User[];
  votes: Vote[];
  isRevealed: boolean;
  currentFeatureNumber: string | null;
  featureHistory: FeatureHistoryEntry[];
}

interface RoomStore {
  currentRoom: Room | null;
  currentUser: User | null;
  isConnected: boolean;
  setCurrentRoom: (room: Room | null) => void;
  setCurrentUser: (user: User | null) => void;
  setIsConnected: (connected: boolean) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  currentRoom: null,
  currentUser: null,
  isConnected: socket.connected,
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setIsConnected: (connected) => set({ isConnected: connected }),
}));

// Listen to socket connection changes
socket.on('connect', () => {
  useRoomStore.getState().setIsConnected(true);
});

socket.on('disconnect', () => {
  useRoomStore.getState().setIsConnected(false);
});

// Listen to room events
socket.on('user-joined', (data: { user: User; room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('user-left', (data: { userId: string; room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('vote-updated', (data: { room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('feature-voting-started', (data: { room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('votes-revealed', (data: { room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('revote-started', (data: { room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});

socket.on('feature-decisions-saved', (data: { room: Room }) => {
  const { currentRoom } = useRoomStore.getState();
  if (currentRoom && currentRoom.id === data.room.id) {
    useRoomStore.getState().setCurrentRoom(data.room);
  }
});
