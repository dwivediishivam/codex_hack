# Required Keys

These are the external values still needed before live integrations can replace the current placeholders.

## iOS / Auth
- Supabase project URL
- Supabase publishable key
- Email/password auth via Supabase Auth

## Backend
- Supabase service role key
- Vercel token
- Vercel project ID
- Vercel team ID if applicable
- GitHub token or GitHub App credentials
- GitHub org or user destination for generated repos
- OpenAI API key for Codex/GPT generation jobs

## Current Direction
- Login is email and password only.
- Password hashing and secure credential storage are handled by Supabase Auth.
- Google login is intentionally skipped for this version.

## Important Constraint
- A ChatGPT/Codex subscription session cannot be used programmatically by the app backend.
- When you want real generated apps from the server worker, that worker will still need an API-backed model credential or another callable generation service.
