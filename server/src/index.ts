import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3000;
const DATA_DIR = path.join(__dirname, '../data');
const FEATURE_HISTORY_FILE = path.join(DATA_DIR, 'feature-history.json');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Static assets in production (serve built client)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In-memory room storage
interface Vote {
  userId: string;
  userName: string;
  userRole: 'developer' | 'qa' | 'product-owner';
  value: string;
}

type UserRole = 'developer' | 'qa' | 'product-owner';

interface RoleSummary {
  average: number | null;
  mode: string | null;
  finalDecision: number | null;
}

interface FeatureHistoryEntry {
  featureNumber: string;
  overallAverage: number | null;
  roleSummaries: Record<UserRole, RoleSummary>;
}

interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdBySocketId: string;
  createdAt: string;
  users: Map<string, User>;
  votes: Map<string, Vote>;
  isRevealed: boolean;
  currentFeatureNumber: string | null;
  featureHistory: FeatureHistoryEntry[];
}

interface User {
  id: string;
  socketId: string;
  name: string;
  role: UserRole;
}

const rooms = new Map<string, Room>();

interface PersistedRoomHistory {
  roomId: string;
  roomName: string;
  createdAt: string;
  createdBy: string;
  featureHistory: FeatureHistoryEntry[];
  updatedAt: string;
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readPersistedFeatureHistory(): Record<string, PersistedRoomHistory> {
  ensureDataDir();

  if (!fs.existsSync(FEATURE_HISTORY_FILE)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(FEATURE_HISTORY_FILE, 'utf-8');
    if (!raw.trim()) {
      return {};
    }

    return JSON.parse(raw) as Record<string, PersistedRoomHistory>;
  } catch (error) {
    console.error('[Persistence] Failed to read feature history file:', error);
    return {};
  }
}

function writePersistedFeatureHistory(data: Record<string, PersistedRoomHistory>) {
  ensureDataDir();
  fs.writeFileSync(FEATURE_HISTORY_FILE, JSON.stringify(data, null, 2));
}

function persistRoomFeatureHistory(room: Room) {
  const persisted = readPersistedFeatureHistory();
  persisted[room.id] = {
    roomId: room.id,
    roomName: room.name,
    createdAt: room.createdAt,
    createdBy: room.createdBy,
    featureHistory: room.featureHistory,
    updatedAt: new Date().toISOString(),
  };
  writePersistedFeatureHistory(persisted);
}

function serializeRoom(room: Room) {
  return {
    id: room.id,
    name: room.name,
    createdBy: room.createdBy,
    createdBySocketId: room.createdBySocketId,
    createdAt: room.createdAt,
    users: Array.from(room.users.values()),
    votes: Array.from(room.votes.values()),
    isRevealed: room.isRevealed,
    currentFeatureNumber: room.currentFeatureNumber,
    featureHistory: room.featureHistory,
  };
}

function emptyRoleSummaries(): Record<UserRole, RoleSummary> {
  return {
    developer: { average: null, mode: null, finalDecision: null },
    qa: { average: null, mode: null, finalDecision: null },
    'product-owner': { average: null, mode: null, finalDecision: null },
  };
}

function parseNumericVote(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function calculateMode(values: string[]): string | null {
  if (values.length === 0) return null;

  const counts = new Map<string, number>();
  let highestCount = 0;
  let mode: string | null = null;

  for (const value of values) {
    const nextCount = (counts.get(value) ?? 0) + 1;
    counts.set(value, nextCount);

    if (nextCount > highestCount) {
      highestCount = nextCount;
      mode = value;
    }
  }

  return mode;
}

function buildFeatureHistoryEntry(featureNumber: string, votes: Vote[]): FeatureHistoryEntry {
  const roleSummaries = emptyRoleSummaries();
  const overallNumericVotes = votes
    .map((vote) => parseNumericVote(vote.value))
    .filter((value): value is number => value !== null);

  const roles: UserRole[] = ['developer', 'qa', 'product-owner'];

  for (const role of roles) {
    const roleVotes = votes.filter((vote) => vote.userRole === role);
    const numericRoleVotes = roleVotes
      .map((vote) => parseNumericVote(vote.value))
      .filter((value): value is number => value !== null);

    roleSummaries[role] = {
      average: calculateAverage(numericRoleVotes),
      mode: calculateMode(roleVotes.map((vote) => vote.value)),
      finalDecision: null,
    };
  }

  return {
    featureNumber,
    overallAverage: calculateAverage(overallNumericVotes),
    roleSummaries,
  };
}

function getCurrentFeatureEntry(room: Room): FeatureHistoryEntry | undefined {
  if (!room.currentFeatureNumber) return undefined;

  for (let index = room.featureHistory.length - 1; index >= 0; index -= 1) {
    const entry = room.featureHistory[index];
    if (entry?.featureNumber === room.currentFeatureNumber) {
      return entry;
    }
  }

  return undefined;
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('create-room', (data: { roomName: string; userName: string; role: string }, callback) => {
    try {
      const roomId = generateRoomId();
      const user: User = {
        id: socket.id,
        socketId: socket.id,
        name: data.userName,
        role: data.role as User['role'],
      };

      const room: Room = {
        id: roomId,
        name: data.roomName,
        createdBy: data.userName,
        createdBySocketId: socket.id,
        createdAt: new Date().toISOString(),
        users: new Map([[socket.id, user]]),
        votes: new Map(),
        isRevealed: false,
        currentFeatureNumber: null,
        featureHistory: [],
      };

      rooms.set(roomId, room);
      persistRoomFeatureHistory(room);
      socket.join(roomId);

      console.log(`[Socket.IO] Room created: ${roomId} by ${data.userName}`);

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  socket.on('join-room', (data: { roomId: string; userName: string; role: string }, callback) => {
    try {
      const room = rooms.get(data.roomId.toUpperCase());
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const user: User = {
        id: socket.id,
        socketId: socket.id,
        name: data.userName,
        role: data.role as User['role'],
      };

      room.users.set(socket.id, user);
      socket.join(data.roomId.toUpperCase());

      console.log(`[Socket.IO] User ${data.userName} joined room ${data.roomId}`);

      // Notify all users in the room
      io.to(data.roomId.toUpperCase()).emit('user-joined', {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        room: serializeRoom(room),
      });

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  socket.on('start-feature-voting', (data: { roomId: string; featureNumber: string }, callback) => {
    try {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        callback({ success: false, error: 'User not in room' });
        return;
      }

      if (socket.id !== room.createdBySocketId) {
        callback({ success: false, error: 'Only the room owner can start voting for a feature' });
        return;
      }

      const featureNumber = data.featureNumber.trim();
      if (!featureNumber) {
        callback({ success: false, error: 'Feature number is required' });
        return;
      }

      if (room.currentFeatureNumber && !room.isRevealed) {
        callback({ success: false, error: 'A voting round is already in progress for this room' });
        return;
      }

      room.currentFeatureNumber = featureNumber;
      room.featureHistory.push(buildFeatureHistoryEntry(featureNumber, []));
      room.votes.clear();
      room.isRevealed = false;
      persistRoomFeatureHistory(room);

      io.to(data.roomId.toUpperCase()).emit('feature-voting-started', {
        room: serializeRoom(room),
      });

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error starting feature voting:', error);
      callback({ success: false, error: 'Failed to start feature voting' });
    }
  });

  socket.on('submit-vote', (data: { roomId: string; voteValue: string }, callback) => {
    try {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        callback({ success: false, error: 'User not in room' });
        return;
      }

      if (room.isRevealed) {
        callback({ success: false, error: 'Votes are already revealed. Please revote first.' });
        return;
      }

      if (!room.currentFeatureNumber) {
        callback({ success: false, error: 'Voting has not started for a feature yet.' });
        return;
      }

      const vote: Vote = {
        userId: socket.id,
        userName: user.name,
        userRole: user.role,
        value: data.voteValue,
      };

      room.votes.set(socket.id, vote);

      // Broadcast to all users in room
      io.to(data.roomId.toUpperCase()).emit('vote-updated', {
        room: serializeRoom(room),
      });

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error submitting vote:', error);
      callback({ success: false, error: 'Failed to submit vote' });
    }
  });

  socket.on('reveal-votes', (data: { roomId: string }, callback) => {
    try {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        callback({ success: false, error: 'User not in room' });
        return;
      }

      if (socket.id !== room.createdBySocketId) {
        callback({ success: false, error: 'Only the room creator can reveal votes' });
        return;
      }

      if (room.isRevealed) {
        callback({ success: false, error: 'Votes are already revealed' });
        return;
      }

      room.isRevealed = true;

      if (room.currentFeatureNumber) {
        const featureEntry = getCurrentFeatureEntry(room);

        if (featureEntry) {
          const updatedEntry = buildFeatureHistoryEntry(room.currentFeatureNumber, Array.from(room.votes.values()));
          updatedEntry.roleSummaries.developer.finalDecision = featureEntry.roleSummaries.developer.finalDecision;
          updatedEntry.roleSummaries.qa.finalDecision = featureEntry.roleSummaries.qa.finalDecision;
          updatedEntry.roleSummaries['product-owner'].finalDecision =
            featureEntry.roleSummaries['product-owner'].finalDecision;

          Object.assign(featureEntry, updatedEntry);
        }
      }
      persistRoomFeatureHistory(room);

      // Broadcast to all users in room
      io.to(data.roomId.toUpperCase()).emit('votes-revealed', {
        room: serializeRoom(room),
      });

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error revealing votes:', error);
      callback({ success: false, error: 'Failed to reveal votes' });
    }
  });

  socket.on(
    'save-feature-decisions',
    (
      data: {
        roomId: string;
        decisions: Partial<Record<UserRole, number | null>>;
      },
      callback
    ) => {
      try {
        const room = rooms.get(data.roomId.toUpperCase());
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        const user = room.users.get(socket.id);
        if (!user) {
          callback({ success: false, error: 'User not in room' });
          return;
        }

        if (socket.id !== room.createdBySocketId) {
          callback({ success: false, error: 'Only the room owner can save final decisions' });
          return;
        }

        if (!room.currentFeatureNumber) {
          callback({ success: false, error: 'No active feature found for this room' });
          return;
        }

        const featureEntry = getCurrentFeatureEntry(room);

        if (!featureEntry) {
          callback({ success: false, error: 'Feature summary not found' });
          return;
        }

        const roles: UserRole[] = ['developer', 'qa', 'product-owner'];
        for (const role of roles) {
          const decision = data.decisions[role];
          featureEntry.roleSummaries[role].finalDecision =
            typeof decision === 'number' && Number.isFinite(decision) ? decision : null;
        }
        persistRoomFeatureHistory(room);

        io.to(data.roomId.toUpperCase()).emit('feature-decisions-saved', {
          room: serializeRoom(room),
        });

        callback({
          success: true,
          room: serializeRoom(room),
        });
      } catch (error) {
        console.error('[Socket.IO] Error saving feature decisions:', error);
        callback({ success: false, error: 'Failed to save feature decisions' });
      }
    }
  );

  socket.on('revote', (data: { roomId: string }, callback) => {
    try {
      const room = rooms.get(data.roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      const user = room.users.get(socket.id);
      if (!user) {
        callback({ success: false, error: 'User not in room' });
        return;
      }

      if (socket.id !== room.createdBySocketId) {
        callback({ success: false, error: 'Only the room owner can start the next voting round' });
        return;
      }

      if (!room.isRevealed) {
        callback({ success: false, error: 'Votes must be revealed before starting a new vote' });
        return;
      }

      // Clear the active round so the owner can start the next feature.
      room.votes.clear();
      room.isRevealed = false;
      room.currentFeatureNumber = null;

      // Broadcast to all users in room
      io.to(data.roomId.toUpperCase()).emit('revote-started', {
        room: serializeRoom(room),
      });

      callback({
        success: true,
        room: serializeRoom(room),
      });
    } catch (error) {
      console.error('[Socket.IO] Error starting revote:', error);
      callback({ success: false, error: 'Failed to start revote' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        
        // Remove user's vote if they had one
        room.votes.delete(socket.id);

        // Notify remaining users
        io.to(roomId).emit('user-left', {
          userId: socket.id,
          room: serializeRoom(room),
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`[Socket.IO] Room ${roomId} deleted (empty)`);
        }
      }
    }
  });
});

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Socket.IO ready for connections`);
});
