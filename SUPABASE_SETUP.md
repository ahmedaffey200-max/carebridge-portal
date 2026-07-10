# Carebridge Portal — Supabase Setup

## Step 1: Run the SQL schema

1. Go to your Supabase dashboard → **SQL Editor**
2. Paste the contents of `supabase-schema.sql` and click **Run**

## Step 2: Create your admin user

1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: your email (e.g. `carebridgeinter@gmail.com`)
   - **Password**: your chosen password
4. Click **Create user**

## Step 3: Login

Open `Carebridge Login.html` and sign in with:
- **Username**: the email you created in Step 2
- **Password**: the password you set

Your data automatically syncs to Supabase after every change.

## How it works

- All portal data (patients, hospitals, financials, etc.) is stored in the `portal_state` table in Supabase
- On page load, the latest data is pulled from Supabase
- Every change syncs to Supabase within 1.5 seconds
- localStorage is used as an instant local cache
- If offline, the portal still works — it syncs when back online
