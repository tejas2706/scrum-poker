# Deployment Guide

This project is split into two deployable parts:

- `client/`: static frontend
- `server/`: real-time backend

## Environment Variables

### Client

- `VITE_SOCKET_URL`
  - Use the public backend URL when frontend and backend are hosted separately.
  - Example: `https://api.example.com`

### Server

- `PORT`
  - Server port. Default is `3000`.
- `ALLOWED_ORIGINS`
  - Comma-separated list of allowed frontend origins.
  - Example: `https://main.d2cgdy55lxfp2u.amplifyapp.com,https://app.example.com`

## Current Deployment Notes

### Amplify + Separate Backend

The frontend can be deployed on AWS Amplify.

For Amplify:

- app root: `client`
- set `VITE_SOCKET_URL` to the backend public URL

### Render

For the backend on Render:

- root directory: `server`
- build command: `npm install && npm run build`
- start command: `npm start`

The server `start` script assumes `dist/` already exists, so the build step must run before start.

### Railway

If using Railway:

- create separate services for `client` and `server`
- use root directories `client` and `server`
- keep both in the same project if private networking is used
- set the backend host env vars for the client container if deploying with Docker

### Docker Compose

Local containerized development is supported with:

```bash
docker compose up --build
```

This uses:

- [docker-compose.yml](/Users/tejaslad/Projects/scrum-poker/docker-compose.yml)
- [client/Dockerfile](/Users/tejaslad/Projects/scrum-poker/client/Dockerfile)
- [server/Dockerfile](/Users/tejaslad/Projects/scrum-poker/server/Dockerfile)

## Persistence

Feature history is written to:

- `server/data/feature-history.json`

If the backend is deployed on an ephemeral platform, make sure this path is backed by persistent storage or replace it with a durable storage service.
