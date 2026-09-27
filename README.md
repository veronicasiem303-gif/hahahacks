# MyFridge

A hackathon starter for a shared household grocery list. The React frontend and Express/Socket.IO backend are kept in separate `frontend` and `backend` workspaces.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). The API runs on http://localhost:4000. Open the app in another browser or an incognito window to try live list updates between members.

## Expiry dates

Set an optional expiration date when adding a grocery. The date appears beneath the item name in the shared list.

## Demo features

- Create a household or join one with its invite code. The seeded household uses `SUNNY24`.
- Add, check off, search, and remove grocery items; changes are broadcast to everyone in the household over Socket.IO.
- Track optional expiration dates for groceries.
- Update your display name from the profile control.
- The backend keeps demo households in memory. Restarting it resets data; add a database and authentication before using real household data.

## Layout

- `frontend/src/App.jsx`: household dashboard, joining/creation flows, and live list interactions.
- `frontend/src/styles.css`: responsive interface styling.
- `backend/src/index.js`: household API, demo data, and Socket.IO events.

Receipt scanning is a follow-on integration point; this starter focuses on household membership and the shared list.

## Deploy

The repository includes `vercel.json` for the frontend and `render.yaml` for the backend.

1. Create a Render web service from this repository using the blueprint. Set `FRONTEND_URL` to the deployed Vercel URL.
2. Create a Vercel project from this repository. Set `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed Render URL, for example `https://myfridge-backend.onrender.com`.
3. Redeploy Vercel after setting the environment variables.

Local development continues to use the Vite proxy and `localhost:4000` when those variables are not set.