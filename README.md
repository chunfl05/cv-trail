# CV Trail

A quiet record of every application, interview, and reflection — refactored as a Next.js + React project.

## Setup

1. Create a Supabase project, then run the SQL in `supabase/migrations/` (in order) via the SQL editor, or `supabase db push` if you have the CLI linked.
2. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase project → API settings), and `ALLOWED_EMAIL` (the only email allowed to sign in — this is a single-user app).
3. In Supabase Auth settings, add `http://localhost:3000/auth/callback` (and your deployed domain's equivalent) to the redirect URL allow list.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Enter the `ALLOWED_EMAIL` address and follow the magic link sent to that inbox.

## Structure

```
app/
  layout.js              Root layout, loads Google Fonts + globals.css
  globals.css            All styles (paper/ivory palette, components, modals)
  page.js                Main page — routing state, modal state, layout shell
  login/page.js          Magic-link sign-in form
  login/actions.js       Server Action: requests the magic link (checks ALLOWED_EMAIL)
  auth/callback/route.js Exchanges the magic-link code for a session

components/
  TopBar.js              Top navigation bar
  LeftRail.js            Left sidebar (profile + nav)
  RightRail.js           Right sidebar (this week / needs follow-up)
  Icon.js                All SVG icons in one place
  Dashboard.js           Dashboard view (stats + Sankey + pipeline board)
  Sankey.js              Multi-stage flow visualization (SVG, all geometry)
  KanbanBoard.js         Pipeline columns
  Applications.js        Applications table with filters
  Resumes.js             Resume version cards
  ExperienceBank.js      Experience library CRUD (Supabase-backed)
  Calendar.js            Month calendar + upcoming list
  Retrospective.js       Interview reflections
  modals/
    Modal.js             Generic modal shell (backdrop, esc handler)
    ApplicationModal.js
    ResumeModal.js
    ExperienceModal.js
    EventModal.js
    RetroModal.js

lib/
  store.js               React Context + localStorage persistence (applications, resumes, events, retros)
  experiences.js         useExperiences() hook — Supabase-backed CRUD for the experience bank
  helpers.js             daysSince / fmtDate / statusLabel / etc.
  supabase/
    client.js            Browser Supabase client
    server.js             Server Supabase client + getUser() helper (Server Components/Route Handlers)
    middleware.js         Session refresh + route protection, used by the root middleware.js

supabase/
  migrations/            SQL schema (run in order against your Supabase project)
```

## Data

Applications, resumes, calendar events, and retrospectives still live in `localStorage` under the key `cv-trail-v4` (same shape as the original single-file app — existing data carries over), provided via `<StoreProvider>` / `useStore()`:

```js
const { applications, addApplication, deleteApplication } = useStore();
```

The Experience Bank is the first piece backed by Supabase (Postgres, RLS-scoped to your logged-in user) instead of `localStorage` — see `lib/experiences.js`'s `useExperiences()` hook. Later modules will move the rest of the data over.

## Build for production

```bash
npm run build
npm start
```

To deploy as a static site (no server needed) you can also export. To deploy on Vercel, push to GitHub and import the repo.
