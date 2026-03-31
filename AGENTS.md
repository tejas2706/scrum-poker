# AGENTS.md

Guidance for AI coding agents working in this repository.

## Purpose

This project is a real-time scrum poker application for agile estimation sessions. It uses:

- `client/`: React + Vite + TypeScript + Tailwind + Framer Motion
- `server/`: Node.js + Express + Socket.IO + TypeScript

Agents should preserve the current architecture and product direction unless the user explicitly asks for a redesign.

## Product Rules

- A room has a creator/owner.
- The owner starts voting by entering a feature number.
- Votes belong to the currently active feature number.
- After reveal, the owner can save final decisions by role.
- The session keeps a running feature history with:
  - feature number
  - overall average
  - mode by role
  - final decision by role
- Feature history is persisted to `server/data/feature-history.json`.

When changing backend or UI logic, preserve this flow unless the user asks to change the product behavior.

## Architecture Notes

- The server is the source of truth for rooms, users, votes, feature state, and feature history.
- Room state is held in memory and mirrored to the JSON persistence file.
- The client uses Zustand to store the current room and current user.
- Socket.IO events update client state; prefer extending the existing event flow over introducing parallel state paths.
- Keep server payloads consistent by reusing the existing room serialization pattern.

## Frontend Design Direction

Preserve the current visual language and interaction style:

- Professional, clean, enterprise-style interface
- Neutral surface palette with dark mode support
- Subtle motion only; current timing is roughly `150ms-250ms`
- Existing UI primitives in `client/src/components/ui` should be reused
- Prefer cards, clear spacing, and readable forms over flashy redesigns
- Maintain mobile responsiveness

Do not introduce a drastically new theme, layout language, or component library unless explicitly requested.

## Coding Preferences

- Keep TypeScript types explicit when extending room, vote, or history data models.
- Prefer small helper functions over duplicating logic.
- Reuse current patterns for:
  - room serialization in the server
  - Zustand event listeners in the client store
  - card-based page sections in the UI
- Keep edits ASCII unless the file already uses special characters.
- Add comments only when they clarify non-obvious logic.

## Deployment Context

Current intended deployment direction:

- Frontend can be deployed separately from the backend.
- Frontend supports `VITE_SOCKET_URL`.
- Backend supports `ALLOWED_ORIGINS`.
- Dockerfiles exist for both `client/` and `server/`.
- Render/Railway style deployments should build `server/` separately from repo root.

If deployment-related changes are requested, prefer extending the existing env-var-driven setup rather than hardcoding local URLs.

## Docs To Keep Updated

If behavior or deployment changes materially, update the relevant markdown docs:

- `README.md` for general setup
- `DEPLOYMENT.md` for hosting instructions
- `DESIGN.md` for UI/product consistency

## Avoid

- Do not replace Socket.IO with a different real-time stack unless asked.
- Do not move persistence to a database unless asked.
- Do not redesign the app into a radically different visual style unless asked.
- Do not break the owner-driven feature voting workflow.
