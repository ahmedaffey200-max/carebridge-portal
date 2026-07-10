const STORAGE = 'https://htvjjwfenvittdritjni.supabase.co/storage/v1/object/public/portal';
const SELF    = 'https://htvjjwfenvittdritjni.supabase.co/functions/v1/portal';

Deno.serve(async (req: Request) => {
  const url   = new URL(req.url);
  const page  = url.searchParams.get('page') || 'login';
  const isApp = page === 'app';

  const file = isApp ? 'Carebridge Portal.html' : 'Carebridge Login.html';
  const raw  = await fetch(`${STORAGE}/${encodeURIComponent(file)}`);
  let html   = await raw.text();

  // Makes all relative assets (CSS, JS, images) load from Supabase Storage
  html = html.replace('<head>', `<head>\n  <base href="${STORAGE}/">`);

  if (isApp) {
    // Auth guard redirect → login function
    html = html.replace("'Carebridge Login.html'", `'${SELF}'`);
    // Sign-out link is rendered by React after load, so intercept via click
    html = html.replace('</body>', `<script>
document.addEventListener('click', function(e) {
  var a = e.target.closest('a.cb-signout');
  if (a) { e.preventDefault(); window.location.href = '${SELF}'; }
});
</script>\n</body>`);
  } else {
    // Login page: fix redirect to portal after successful sign-in
    html = html.replace('"Carebridge Portal.html?role="', `"${SELF}?page=app&role="`);
  }

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
});
