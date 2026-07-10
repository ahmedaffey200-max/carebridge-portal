# Carebridge Portal — Vercel Deployment Guide

## Prerequisites
✅ You have: Vercel account, GitHub account, Neon PostgreSQL

## Step 1: Set up Neon Database

1. Go to **neon.tech** → sign in with GitHub
2. Create/select your Carebridge project
3. In SQL Editor, paste contents of `schema.sql` and run it
   - This creates all tables: patients, hospitals, invoices, expenses, messages, auditLog
4. Copy your connection string (already provided)

## Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Add backend deployment config"
git push origin main
```

Ensure these files are committed:
- `server.js`
- `package.json`
- `vercel.json`
- `.env.example` (example only, NOT secrets)

`.env` should NOT be in Git (it's in .gitignore).

## Step 3: Deploy to Vercel

1. Go to **vercel.com** → Dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repo (Carebridge)
4. Configure environment variables:
   - Click "Environment Variables"
   - Add these 2 variables:

```
DATABASE_URL = postgresql://neondb_owner:npg_3NaLjXfkw6pU@ep-proud-water-ahi500e5-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET = (generate random: https://randomkeygen.com/ — copy a 32+ char string)
```

5. Click "Deploy"
6. Wait 2-3 minutes for deployment to complete

## Step 4: Get Your Backend URL

After deployment completes:
1. Vercel shows your deployment URL (e.g., `https://carebridge-portal.vercel.app`)
2. This is your `BACKEND_URL`

## Step 5: Update Frontend API Client

In `lib/api-client.js`, change:
```javascript
const BACKEND_URL = 'https://carebridge-portal.vercel.app';
// or localhost:3000 for local testing
```

Then reload the portal in your browser.

## Step 6: Test Backend Connection

In portal:
1. Log in with PIN **1234**
2. Go to Patient Management
3. Add a new patient → should sync to Neon database
4. Refresh page → patient data persists
5. Edit/delete → should update in database

## Step 7: Monitor & Logs

In Vercel Dashboard:
- Click your project
- Go to "Deployments" tab
- Click latest deployment → "Logs"
- See real-time API requests and errors

## Troubleshooting

**"Database connection failed"**
- Check DATABASE_URL in Vercel env vars
- Make sure connection string is exact (copy from Neon)
- Verify Neon IP whitelist allows Vercel IPs

**"API endpoint not found"**
- Confirm BACKEND_URL in api-client.js matches Vercel deployment URL
- Check server.js routes match `/api/*` pattern

**"Token expired"**
- JWT_SECRET must match between deployments
- Clear browser localStorage and log in again

## Security Checklist

✅ Never commit `.env` to GitHub
✅ Use Vercel's environment variable UI (not plaintext)
✅ Rotate JWT_SECRET every 3 months
✅ Enable Neon backups (auto: 7 days)
✅ Monitor audit logs for suspicious activity
✅ Use HTTPS only (Vercel enforces this)

## Next Steps

- Set up monitoring (Vercel alerts)
- Configure custom domain (optional)
- Enable Neon read replicas for scaling
- Schedule regular database backups

Questions? Ask before proceeding.
