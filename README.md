# Lucen17 – Full Working Build v1.8

**Cockpit (GitHub Pages)** + **API (Render/Railway/Fly)**  
Features:
- Reflections with local + server sync
- Creation/Guidance modes with autonomous drift + beam pulse
- Lucen Nodes (tone glow): 🔵 Reflective, 🟠 Directive, 🟡 Creative
- Gates list
- Toll system scaffold with `/tolls/pay` (Stripe-ready; simulates if no key)
- Persistence: in-memory + JSON snapshot; optional Postgres via `DATABASE_URL`

## Deploy

### Backend
- Build: `npm install`
- Start: `npm start`
- Env (optional): `STRIPE_SECRET_KEY`, `DATABASE_URL`

### Frontend
- Host these static files (index.html, style.css, script.js) on GitHub Pages.
- In the **Gates** tab, paste your API URL and Save.

## Notes
- CORS open (`*`) for fast integration; lock origins later.
- If filesystem is read-only on your host, JSON snapshots will silently skip; in-memory still works.
- To enable real payments: set `STRIPE_SECRET_KEY` and replace the client payment flow with Stripe.js confirmation.
