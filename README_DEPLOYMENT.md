# Carebridge Portal — Deployment Guide

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```
   DATABASE_URL=postgresql://...your-neon-url...
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

4. **Start server:**
   ```bash
   npm start
   ```

Server runs on `http://localhost:3000`.

## Deploy to Render

1. **Push code to GitHub** (create a repo with `server.js`, `migrate.js`, `package.json`, `.env.example`).

2. **Go to [render.com](https://render.com)** → New → Web Service.

3. **Connect GitHub repo**, select branch.

4. **Settings:**
   - Runtime: Node
   - Build: `npm install`
   - Start: `npm start`
   - Environment variables: Add `DATABASE_URL` and `JWT_SECRET`

5. **Deploy.** Render gives you a live URL (e.g., `https://carebridge-api.onrender.com`).

6. **Update portal:**
   - Edit `lib/api-client.js` line 5: change `API_URL` to your Render URL.
   - Redeploy the portal (GitHub Pages, Vercel, or Netlify).

## Deploy to Railway

1. **Push code to GitHub.**

2. **Go to [railway.app](https://railway.app)** → New Project → Deploy from GitHub.

3. **Select your repo**, authorize, and Railway auto-detects Node.

4. **Add Postgres plugin** (Railway → Add → Postgres).

5. **Set environment variables:**
   - `DATABASE_URL` → Railway auto-fills from Postgres plugin.
   - `JWT_SECRET` → Add manually.

6. **Deploy.** Railway gives you a live URL.

7. **Update portal** with the new API URL.

## Data Import

The portal currently runs from **localStorage**. To import your data:

1. Export from the portal (localStorage → JSON).
2. Write a one-time import endpoint in `server.js`:
   ```javascript
   app.post('/api/import', async (req, res) => {
     const { patients, hospitals, invoices, expenses } = req.body;
     // Bulk insert into database
     res.json({ imported: true });
   });
   ```
3. Call it once, then remove.

---

**Questions?** Check the API endpoints in `server.js`.
