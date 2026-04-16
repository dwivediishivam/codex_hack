# Codex Hack Implementation Plan

## 1. Product Definition

### 1.1 Goal
Build an iOS host application in SwiftUI that lets users create and use AI-generated micro apps. The micro apps are web-based, hosted remotely, and opened inside the iOS app. App creation and edits are driven by Codex/GPT running on a backend job runner.

### 1.2 Product Shape
The system is not an instant native iOS app generator. It is:

- a SwiftUI shell app
- a backend control plane
- an AI generation pipeline
- a hosted web micro-app runtime
- a private/public app gallery

### 1.3 MVP Outcome
The first usable version should allow a logged-in user to:

- create an account and sign in
- prompt for a private micro app
- wait for generation to complete
- open the generated web app inside the iOS app
- edit the app later using prompts
- view previously created apps

Public marketplace support should come after the private flow works reliably.

## 2. Core Constraints

### 2.1 Apple Constraint
The iOS binary cannot dynamically ship arbitrary new native executable code for each generated app. The practical path is to host web apps and render them inside `WKWebView`.

### 2.2 Security Constraint
Do not allow generated apps to access platform data directly. All auth, storage, and permissions must be controlled centrally through the platform backend.

### 2.3 Product Constraint
The first version should generate only constrained micro apps:

- calculators
- forms
- trackers
- planners
- lightweight dashboards
- org/internal workflow utilities

Avoid starting with:

- arbitrary social apps
- apps requiring native hardware features
- highly custom UI/animation-heavy apps
- unrestricted third-party integrations

## 3. Recommended Stack

### 3.1 iOS App
- Swift
- SwiftUI
- `WKWebView` bridge for hosted micro apps
- Supabase Swift SDK for auth/session

### 3.2 Backend
- Node.js with TypeScript
- Host on Render or Railway
- Expose REST API first; GraphQL is unnecessary for MVP
- Background job worker for generation/edit tasks

### 3.3 Database/Auth/Storage
- Supabase Postgres
- Supabase Auth
- Supabase Storage for app assets, screenshots, and generated bundles if needed

### 3.4 Web App Hosting
- Vercel for generated web micro apps
- Each app hosted under a stable subpath or subdomain

### 3.5 AI Generation
- Codex/GPT-based generation runner on server or your current machine for PoC
- The job runner should:
  - read a prompt
  - validate scope
  - generate code/spec
  - run checks
  - commit to git
  - trigger deployment

### 3.6 Git Hosting
- GitHub
- One repo per micro app, or one monorepo for MVP

For MVP, start with one monorepo for generated apps to reduce automation complexity.

## 4. High-Level Architecture

### 4.1 Main Components

1. iOS host app
2. Platform backend API
3. Generation worker
4. Database/auth layer
5. Web app runtime/deployment layer

### 4.2 Request Flow

1. User logs into the iOS app.
2. User submits a prompt: "Make me an app for X."
3. iOS app sends request to backend.
4. Backend creates an `app_generation_job`.
5. Worker picks up the job.
6. Worker performs:
   - feasibility check
   - duplicate check
   - prompt normalization
   - plan generation
   - code/spec generation
   - lint/build checks
   - deployment
   - metadata save
7. Backend marks app as ready.
8. iOS app shows the app in the dashboard.
9. User opens the app inside a web view.

### 4.3 Edit Flow

1. User opens an existing app.
2. User submits an edit prompt.
3. Backend creates an `app_edit_job`.
4. Worker pulls current app context and repo state.
5. Worker generates a patch/change set.
6. Validation runs.
7. New version is deployed.
8. Version history is stored for rollback.

## 5. Recommended MVP Scope

### 5.1 Include
- email auth
- private micro apps
- prompt-to-create
- prompt-to-edit
- app dashboard
- app detail page
- in-app web app viewer
- generation status tracking
- basic version history

### 5.2 Exclude
- public marketplace
- org workspaces
- payments
- native plugin support
- arbitrary external API connections
- code export in-app
- collaborative editing

## 6. Data Model

Use Supabase tables similar to the following.

### 6.1 `profiles`
- `id`
- `email`
- `display_name`
- `created_at`

### 6.2 `micro_apps`
- `id`
- `owner_id`
- `name`
- `slug`
- `description`
- `visibility` (`private`, `public`, `org`)
- `status` (`draft`, `generating`, `ready`, `failed`, `archived`)
- `current_version_id`
- `deployment_url`
- `app_type`
- `created_at`
- `updated_at`

### 6.3 `micro_app_versions`
- `id`
- `micro_app_id`
- `version_number`
- `prompt_snapshot`
- `plan_snapshot`
- `repo_commit_sha`
- `deployment_url`
- `changelog`
- `status`
- `created_at`

### 6.4 `generation_jobs`
- `id`
- `micro_app_id`
- `job_type` (`create`, `edit`, `rebuild`)
- `status` (`queued`, `running`, `failed`, `completed`)
- `input_prompt`
- `normalized_prompt`
- `failure_reason`
- `started_at`
- `completed_at`

### 6.5 `app_assets`
- `id`
- `micro_app_id`
- `asset_type`
- `storage_path`
- `created_at`

### 6.6 `app_events`
- `id`
- `micro_app_id`
- `event_type`
- `payload`
- `created_at`

## 7. Backend Services

Split the backend into simple modules.

### 7.1 API Service
Responsibilities:

- authenticate requests from iOS app
- create/list/update micro apps
- create generation jobs
- expose job status
- expose version history
- return signed session/context data for web apps

### 7.2 Generation Worker
Responsibilities:

- fetch queued jobs
- prepare prompts for Codex
- generate code/spec
- run validation
- write repo changes
- deploy the app
- update database records

### 7.3 Web App Session Service
Responsibilities:

- mint short-lived access tokens for embedded micro apps
- scope each app to its owner and app ID
- prevent cross-app data access

## 8. Web Micro App Strategy

There are two viable implementation models.

### 8.1 Model A: Shared Runtime + Generated Config
Codex generates a structured app spec consumed by a fixed web runtime.

Benefits:

- fastest to make reliable
- easier to secure
- easier to moderate
- best for MVP

Limits:

- less flexible than arbitrary code

### 8.2 Model B: Generated Standalone Web Apps
Codex generates a small Next.js/React app for each request.

Benefits:

- much more flexible
- can create richer custom apps

Limits:

- harder to validate
- harder to secure
- harder to keep consistent
- larger deployment surface

### 8.3 Recommendation
Start with Model A for the first build:

- one shared web runtime
- a schema for UI/layout
- a schema for forms/fields
- a schema for actions/calculations
- a schema for storage bindings

Then add Model B later for "advanced mode".

## 9. Generation Pipeline

### 9.1 Create Job Steps

1. Receive user prompt.
2. Normalize prompt into a structured product request.
3. Run a feasibility classifier.
4. Run duplicate detection against existing apps/templates.
5. Generate an app plan.
6. Generate output:
   - runtime config for MVP, or
   - code bundle for advanced mode
7. Validate output.
8. Commit changes to repo.
9. Deploy to Vercel.
10. Save metadata and mark ready.

### 9.2 Edit Job Steps

1. Fetch current version.
2. Convert edit prompt into a change request.
3. Generate patch.
4. Validate backward compatibility.
5. Deploy new version.
6. Persist changelog.

### 9.3 Validation Checks
- JSON/schema validity
- required UI fields present
- invalid routes blocked
- unsupported component types blocked
- deployment build succeeds
- app loads in browser smoke test

## 10. Repo Strategy

### 10.1 MVP Repo Layout
Use a multi-project layout:

- `codex_hack/` for iOS
- `backend/` for API + worker
- `web-runtime/` for shared micro app runtime
- `generated-apps/` for generated configs or app outputs

Current repo only contains the iOS project, so these directories should be added incrementally.

### 10.2 Git Strategy
- keep platform code in the main repo
- keep generated app outputs under `generated-apps/` initially
- add per-app repos only once generation quality is stable

## 11. iOS App Implementation Plan

### 11.1 Phase 1 Screens
- splash/loading
- auth
- home/dashboard
- create app
- app detail
- generation status
- micro app viewer
- settings

### 11.2 SwiftUI Modules
- `AppEntry`
- `Auth`
- `Dashboard`
- `CreateApp`
- `AppDetail`
- `AppViewer`
- `Settings`
- `Networking`
- `Models`

### 11.3 iOS Responsibilities
- handle auth state
- fetch app list
- submit app creation/edit prompts
- poll or subscribe for generation status
- embed `WKWebView`
- pass session token to web app safely

### 11.4 `WKWebView` Notes
- use a dedicated `WebView` wrapper
- inject only scoped auth/session data
- avoid letting apps navigate arbitrarily outside allowed domains
- block unknown domains

## 12. Backend API Plan

Initial routes:

- `POST /auth/session/mobile`
- `GET /micro-apps`
- `POST /micro-apps`
- `GET /micro-apps/:id`
- `POST /micro-apps/:id/edit`
- `GET /micro-apps/:id/versions`
- `GET /jobs/:id`
- `POST /micro-apps/:id/web-session`

For MVP, polling is fine. Realtime updates can come later.

## 13. Deployment Plan

### 13.1 Supabase
Use for:

- auth
- database
- storage
- row-level security

### 13.2 Render vs Railway

Render is better if you want:
- a more conventional long-running API/worker deployment
- clearer service separation

Railway is better if you want:
- faster setup
- easier early experimentation

Recommendation:
- use Render for the API and worker if you expect the project to grow
- use Railway only if speed of setup matters more than infra clarity

### 13.3 Vercel
Use for:

- shared runtime deployment
- generated app previews
- production hosting of web micro apps

## 14. Security Plan

### 14.1 Non-Negotiable Rules
- all generated apps are sandboxed
- no direct database credentials in generated apps
- all data access goes through platform APIs
- every web session token is short-lived
- every app is scoped by user ID and app ID

### 14.2 Public Apps
Do not enable public publishing in the first version without:

- moderation review
- abuse checks
- content policy
- deploy validation

## 15. Suggested Build Phases

### Phase 0: Foundation
- define architecture
- set up Supabase project
- set up backend service
- add environment handling
- wire Swift app to auth

### Phase 1: Private App Platform
- sign in/sign up in iOS
- app list screen
- create app prompt screen
- job creation API
- generation worker stub
- fake generated app deployment for end-to-end testing

### Phase 2: Real Generation
- integrate Codex runner
- create runtime config schema
- generate simple calculators/forms/trackers
- deploy to Vercel
- open generated app in `WKWebView`

### Phase 3: Prompt Editing
- versioning model
- edit app flow
- rollback support
- deployment history

### Phase 4: Public Gallery
- discovery feed
- clone/remix
- moderation queue

## 16. Immediate Build Order

This is the exact order I should execute in the repo.

1. Add project structure for backend and runtime.
2. Integrate Supabase auth in the iOS app.
3. Build SwiftUI shells for auth, dashboard, and create-app flow.
4. Create backend API with health check, auth verification, and micro-app CRUD.
5. Add database schema and migrations in Supabase.
6. Build a fake generation worker that creates a placeholder app entry and URL.
7. Create shared web runtime deployed on Vercel.
8. Add `WKWebView` viewer in the iOS app.
9. Replace fake worker with real Codex generation flow.
10. Add edit/versioning flow.

## 17. PoC Success Criteria

The PoC is successful if:

- a user can sign in on iPhone
- a user can prompt for an app
- a backend job is created
- Codex or a stub worker produces a deployable web app/config
- the app appears in the user dashboard
- the app opens inside the iOS host app
- the user can request one edit and see a new version deployed

## 18. Recommended First Technical Compromises

To keep momentum high, accept these compromises initially:

- private apps only
- polling instead of realtime
- one shared runtime instead of arbitrary generated apps
- one deployment environment
- one monorepo for generated outputs
- simple prompt categories with guardrails

## 19. Biggest Risks

### 19.1 Product Risk
If generation is too open-ended too early, quality will collapse.

Mitigation:
- constrain allowed app types
- use templates
- use structured specs

### 19.2 Infra Risk
If every app is a custom code deployment from day one, maintenance cost will spike.

Mitigation:
- shared runtime first

### 19.3 Apple Review Risk
If this is positioned as an unrestricted app store inside an app, review risk increases.

Mitigation:
- frame as user-generated tools/workflows
- keep the first version private and utility-focused

## 20. Next Step After This Plan

The next implementation step should be to convert the existing starter SwiftUI app into a real shell with:

- auth screen
- dashboard screen
- create-app screen
- placeholder viewer screen

At the same time, add a backend skeleton and the Supabase schema so the project stops being only a frontend starter.
