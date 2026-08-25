SOVA LINEUPS - SUPABASE VERSION

1) Open config.js.
2) Keep SUPABASE_URL as provided.
3) Replace PASTE_YOUR_PUBLISHABLE_KEY_HERE with your Supabase Publishable key.
4) Open index.html locally to test, or deploy all files to a static host.

The website uses Supabase Auth for the Admin login and the public lineups table for data.
Do NOT put a Supabase secret/service_role key in config.js.

Current database table expected:
public.lineups(id, map, side, category, title, video_url, description, created_at, updated_at)
