# Foundry Deployment

## Current Split

- `web/` is a pure frontend.
- `backend/` owns all app generation, Supabase writes, generated app storage, and hosted micro-app runtime pages.
- `Supabase` remains the shared auth, database, and object storage layer.

This means the frontend can now run on `Emergent`, `Vercel`, or both at the same time, as long as both point at the same backend URL.

## Recommended Hosting

- `Frontend`: Emergent
- `Frontend mirror`: Vercel
- `Backend API`: Render
- `Data/Auth/Storage`: Supabase

## Emergent Frontend Env Vars

Set these in the Emergent project for `web/`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Important:

- Do not put `SUPABASE_SERVICE_ROLE_KEY` in Emergent.
- Do not put `OPENAI_API_KEY` in Emergent.
- The frontend no longer needs backend-only secrets.

## Vercel Frontend Env Vars

If you keep the existing Vercel frontend live, use the same three variables there:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Render Backend Env Vars

Set these in the Render service for `backend/`:

```bash
NODE_ENV=production
PORT=10000
APP_BASE_URL=https://your-backend-service.onrender.com
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GENERATED_APPS_BUCKET=generated-apps
GENERATED_APP_USER_DATA_BUCKET=generated-app-user-data
```

Optional backend variables:

```bash
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_DB_URL=postgresql://...
SUPABASE_DB_PASSWORD=...
CODEX_BIN=codex
CODEX_MODEL=
CODEX_WORKSPACE_ROOT=
CODEX_TIMEOUT_MS=120000
VERCEL_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
GITHUB_TOKEN=
GITHUB_ORG=
```

## Frontend Portability

Generated custom apps now store `deployment_url` as an absolute backend-hosted URL like:

`https://your-backend-service.onrender.com/micro-app-hosted/<id>?ownerId=<user>`

That means:

- the frontend shell stays unchanged
- Emergent and Vercel both open the same live backend-hosted micro app
- real micro-app capabilities can be added in backend only

## Current Hosted Capability Set

New generated hosted apps can resolve into working backend-driven tools such as:

- image to PDF
- image studio: resize, rotate, grayscale, watermark, convert format
- text to PDF
- QR code generation
- CSV to JSON and JSON to CSV conversion
- persistent tracker apps with saved backend state

## Deploy Commands

### Frontend

```bash
cd web
npm install
npm run build
```

### Backend

```bash
cd backend
npm install
npm run build
npm start
```
