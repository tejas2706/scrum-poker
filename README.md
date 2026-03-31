# Scrum Poker Pro

A modern planning poker tool for agile teams. Built with React, Node.js, and Socket.IO.

## Documentation

- `README.md`: local setup and project overview
- `AGENTS.md`: repo-specific guidance for AI coding agents
- `DESIGN.md`: current product and UI consistency guide
- `DEPLOYMENT.md`: deployment notes for client and server

## Structure

```
scrum-poker/
├── client/     # Vite + React + TypeScript
├── server/     # Node.js + Express + Socket.IO
├── package.json
└── README.md
```

From the repo root: `npm run dev:client` and `npm run dev:server`.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

### 1. Install dependencies

```bash
# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 2. Run development

Open two terminals:

**Terminal 1 – Server**
```bash
cd server && npm run dev
```

**Terminal 2 – Client**
```bash
cd client && npm run dev
```

- Client: http://localhost:5173  
- Server: http://localhost:3000  
- Socket.IO connections are proxied from the client to the server during development.

### 3. Verify

- Visit http://localhost:5173
- The header should show **Connected** when the Socket.IO handshake succeeds
- Health check: http://localhost:3000/api/health

## Tech Stack

| Layer    | Technologies                         |
|----------|--------------------------------------|
| Client   | React, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand |
| Server   | Node.js, Express, Socket.IO          |
| State    | In-memory (no database)              |

## Scripts

### Client (`client/`)

- `npm run dev` – Start Vite dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build

### Server (`server/`)

- `npm run dev` – Start with tsx watch
- `npm run build` – Compile TypeScript
- `npm run start` – Run compiled build

## Environment

- `VITE_SOCKET_URL` – Override Socket.IO server URL (default: proxied in dev, `http://localhost:3000` in prod)
- `PORT` – Server port (default: 3000)
