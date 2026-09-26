# MyFridge

A hackathon starter for a shared household grocery list. The React frontend and Express/Socket.IO backend are kept in separate `frontend` and `backend` workspaces.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). The API runs on http://localhost:4000. Open the app in another browser or an incognito window to try live list updates between members.

## Demo features

- Create a household or join one with its invite code. The seeded household uses `SUNNY24`.
- Add, check off, search, and remove grocery items; changes are broadcast to everyone in the household over Socket.IO.
- Update your display name from the profile control.
- The backend keeps demo households in memory. Restarting it resets data; add a database and authentication before using real household data.

## Layout

- `frontend/src/App.jsx`: household dashboard, joining/creation flows, and live list interactions.
- `frontend/src/styles.css`: responsive interface styling.
- `backend/src/index.js`: household API, demo data, and Socket.IO events.

Receipt scanning is a follow-on integration point; this starter focuses on household membership and the shared list.