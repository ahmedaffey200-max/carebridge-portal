/* ============================================================
   Carebridge Portal — Deploy static files to Supabase Storage
   Run: node deploy-to-supabase.js
   ============================================================ */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://htvjjwfenvittdritjni.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const BUCKET       = 'portal';

const INCLUDE = [
  'Carebridge Login.html',
  'Carebridge Portal.html',
  'lib',
  'assets',
  '_ds',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.jsx':  'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.md':   'text/plain',
};

async function uploadFile(sb, localPath, remotePath) {
  const buffer      = fs.readFileSync(localPath);
  const ext         = path.extname(localPath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  // Upload as Blob so Supabase Storage stores and serves the correct Content-Type
  const blob = new Blob([buffer], { type: contentType });

  const { error } = await sb.storage.from(BUCKET).upload(remotePath, blob, {
    contentType,
    upsert: true,
    duplex: 'half',
  });

  if (error) {
    console.error('  ✗', remotePath, '-', error.message);
  } else {
    console.log('  ✓', remotePath);
  }
}

async function walkDir(sb, dir, baseDir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(sb, full, baseDir);
    } else {
      const remote = path.relative(baseDir, full).replace(/\\/g, '/');
      await uploadFile(sb, full, remote);
    }
  }
}

async function main() {
  if (!SERVICE_KEY) {
    console.error('\n❌  Missing SUPABASE_SERVICE_KEY in your .env file.\n');
    process.exit(1);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  console.log('\n📦  Ensuring public storage bucket "' + BUCKET + '" exists...');
  const { error: be } = await sb.storage.createBucket(BUCKET, { public: true });
  if (be && !be.message.toLowerCase().includes('already exists')) {
    throw new Error('Bucket error: ' + be.message);
  }

  console.log('\n⬆️   Uploading portal files...\n');
  for (const item of INCLUDE) {
    const full = path.join(__dirname, item);
    if (!fs.existsSync(full)) { console.log('  - skipping:', item); continue; }
    if (fs.statSync(full).isDirectory()) {
      await walkDir(sb, full, __dirname);
    } else {
      await uploadFile(sb, full, item);
    }
  }

  const base = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
  console.log('\n✅  Done!\n');
  console.log('━'.repeat(55));
  console.log('🔗  Share this login URL with your team:\n');
  console.log('   ' + base + '/Carebridge%20Login.html\n');
  console.log('━'.repeat(55));
}

main().catch(console.error);
