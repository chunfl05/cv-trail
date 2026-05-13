# CV Trail

A quiet record of every application, interview, and reflection — refactored as a Next.js + React project.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
app/
  layout.js              Root layout, loads Google Fonts + globals.css
  globals.css            All styles (paper/ivory palette, components, modals)
  page.js                Main page — routing state, modal state, layout shell

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
  Calendar.js            Month calendar + upcoming list
  Retrospective.js       Interview reflections
  modals/
    Modal.js             Generic modal shell (backdrop, esc handler)
    ApplicationModal.js
    ResumeModal.js
    EventModal.js
    RetroModal.js

lib/
  store.js               React Context + localStorage persistence
  helpers.js             daysSince / fmtDate / statusLabel / etc.
```

## Data

Everything lives in `localStorage` under the key `cv-trail-v4`. Same shape as the original single-file app — your existing data carries over.

State is provided via `<StoreProvider>` and consumed with `useStore()`:

```js
const { applications, addApplication, deleteApplication } = useStore();
```

## Build for production

```bash
npm run build
npm start
```

To deploy as a static site (no server needed) you can also export. To deploy on Vercel, push to GitHub and import the repo.
