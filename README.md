# Sokha AI

A Next.js App Router, TypeScript and Tailwind CSS chat frontend. The app opens in dark mode and includes a light theme. This repository contains the complete application; run commands from this directory.

## Run locally

```powershell
cd Sokha-AI
bun install --frozen-lockfile
bun run dev
```

Open http://localhost:3000.

## Folders

```text
Sokha-AI/
  app/           App Router homepage, root layout, global styles and app icon
  components/    Reusable sidebar, composer, conversation, projects and UI controls
  lib/           Shared data types and initial projects
  public/        Static assets
  tests/         Browser interaction tests
  bun.lock       The single dependency lockfile
```

## Included interactions

- Dark/light themes with a toggle beside incognito, collapsible sidebar, mobile drawer, back/forward navigation.
- New conversations, inline search with Ctrl/Cmd+K, pinned and recent chats.
- Incognito mode with in-memory conversations excluded from browser storage.
- Message entry, animated thinking, simulated streaming, stop and regenerate.
- Copy response, thumbs up/down, rename, pin/unpin and deletion dialogs.
- Attachment picker, removable attachment chips, research and web-search toggles.
- Project selector, project creation, project conversations and project file lists.
- Account menu with theme switching and delete-all confirmation.
- Browser speech dictation where supported, with English/Khmer language selection.
- Keyboard-operated popovers, focus-trapped dialogs and reduced-motion support.

## Frontend scope

Replies are simulated: no AI model, research service, search backend, authentication or subscription service is connected. Research and web-search selections are UI state only. File pickers retain names and sizes; file contents are not uploaded or analyzed. The Ann/Pro profile is a placeholder from the references. Dictation uses the browser's speech-recognition service and requires microphone permission.

Normal chats, project metadata, theme and sidebar preference are saved to this browser's localStorage (`sokha-workspace-v1`). Incognito chats remain in memory and disappear on refresh or a new chat. The initial project choices match the reference: Study notes, Games project and Work.

The homepage (`app/page.tsx`) renders the interactive client component `components/ChatWorkspace.tsx`. Metadata and the document shell live in `app/layout.tsx`. Tailwind uses the existing Turbopack integration in `next.config.ts`.

To integrate a model, replace `demoResponse` in `components/ChatWorkspace.tsx` with a request to a server-side App Router route handler. Keep API keys on the server.

## Validation

```powershell
bun run typecheck
bun run build
bun run test:e2e
```

Browser tests start the production app on port 3100 and use installed Google Chrome. Build before running tests after source changes. To use Playwright's bundled Chromium on another machine, remove `channel: "chrome"` in `playwright.config.ts` and run `bunx playwright install chromium`.

## Git and dependencies

Use Bun for dependency changes and commit `package.json` together with `bun.lock`. Do not add npm or Yarn lockfiles. `.gitignore` excludes dependencies, build outputs, browser-test artifacts, environment files and TypeScript caches. Existing browser data remains available when the app is served from the same origin (for example, `http://localhost:3000`).

Reference setup documentation: [Next.js](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind CSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs).
