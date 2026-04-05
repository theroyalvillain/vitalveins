# Vital Veins

Vital Veins is now a lightweight full-stack blood donation app with:

- OTP-based signup over email using SMTP
- Login backed by a Node server and MongoDB
- Nearby blood-bank and donation-center search from a backend API
- Browser geolocation support
- Free map links using OpenStreetMap

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `MONGODB_URI`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
3. Install dependencies:
   - `npm install`
4. Start the app:
   - `npm start`
5. Open:
   - `http://localhost:3000`

## Important Notes

- Signup OTP email sending will fail until SMTP is configured correctly.
- MongoDB must be running and reachable through `MONGODB_URI` before starting the server.
- Nearest-center distance works from browser geolocation. If location permission is denied, typed area matching still works against the stored partner-center areas in `data/centers.json`.
- User data is stored in MongoDB.
- Nearby centers are served from the backend and sorted using browser coordinates when available, with map viewing handled by OpenStreetMap.

## Files

- `server.js`: backend server and API
- `data/centers.json`: partner blood-bank inventory and coordinates
- `index.html`, `styles.css`, `script.js`: frontend app
