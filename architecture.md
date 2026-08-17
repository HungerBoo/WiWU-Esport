# WiWU Esport Website Architecture

## Purpose

This document is the maintainer guide for the WiWU Esport website. It describes the current repository as implemented, not an intended future design. Update this file in the same change whenever a page, asset, navigation route, external integration, content model, or shared UI pattern changes.

## Project Shape

- Type: small, static, multi-page HTML website.
- Language and content: German (`lang="de"`).
- Runtime: browser only; no server-side application code.
- Styling: CSS is embedded in a `<style>` block inside each HTML page. There is no shared stylesheet.
- Behavior: pages contain inline `onclick` attributes for slider controls, but no JavaScript file or inline script is currently present.
- Dependencies: no package manager, framework, build tool, test suite, or local third-party dependency is present.
- Deployment: the Git remote is `https://github.com/HungerBoo/WiWU-Esport.git`, `main` is the local branch, and `CNAME` sets the custom domain to `www.wiwu-esport.de`. No GitHub Actions workflow exists in this repository. Whether every push to `main` publishes is controlled by the repository's GitHub Pages source setting and must be confirmed in GitHub repository settings.

## File Map

| File | Responsibility | Important dependencies |
| --- | --- | --- |
| `index.html` | Homepage for the club; news carousel, club introduction, history section, global footer | `Wiwu_Logo.jpg`, `Geschichte.png`, remote placeholder/news images, Instagram and Prime League links |
| `league-of-legends.html` | League of Legends team page; game logo, team description, five-player roster, team photo | `Wiwu_Logo.jpg`, `League Kader.jpg`, remote League logo and player placeholders, global footer links |
| `super-smash-bros.html` | Super Smash Bros. team page; game logo, team description, one-player roster | `Wiwu_Logo.jpg`, remote placeholder logo/player image, global footer links |
| `impressum.html` | Legal notice with address, email, responsible person, and liability text | `Wiwu_Logo.jpg`, global footer links |
| `Wiwu_Logo.jpg` | Local club logo displayed in every page header | Referenced by all HTML pages |
| `Geschichte.png` | Local history image on the homepage | Referenced by `index.html` |
| `League Kader.jpg` | Local League roster/team image | Referenced by `league-of-legends.html` |
| `CNAME` | Custom-domain configuration marker | Used by the static hosting workflow |
| `.gitignore` | Ignore rules | Currently empty |
| `README.md` | Minimal project label (`WiWU-Esport`) | No setup or deployment instructions currently documented |

## Navigation and Page Relationships

```text
index.html
  -> league-of-legends.html
  -> super-smash-bros.html
  -> impressum.html
  -> Instagram (external, new tab)
  -> Prime League (external, new tab)

league-of-legends.html
  -> index.html
  -> super-smash-bros.html
  -> impressum.html
  -> Instagram (external, new tab)
  -> Prime League (external, new tab)

super-smash-bros.html
  -> index.html
  -> league-of-legends.html
  -> impressum.html
  -> Instagram (external, new tab)
  -> Prime League (external, new tab)

impressum.html
  -> index.html
  -> league-of-legends.html
  -> super-smash-bros.html
  -> impressum.html
  -> Instagram (external, new tab)
  -> Prime League (external, new tab)
```

The game navigation marks the current page with `class="active"`; the homepage and legal page do not have an active navigation marker.

## Shared UI Contract

Every page duplicates the same broad shell:

1. Sticky dark header with the local logo, linked site title, and game navigation.
2. Main content constrained to a centered responsive container.
3. Dark footer with the Impressum link and external Instagram/Prime League icons.
4. Green accent color (`#4a7c59`) on headings, hover states, and footer border.
5. Mobile breakpoint at `max-width: 768px`: navigation wraps, header title shrinks, footer stacks, and content padding is reduced.

Because this shell is duplicated, a change to header, footer, colors, typography, breakpoints, or shared markup must be applied consistently to all four HTML pages and reflected here.

## Page Details

### Homepage: `index.html`

- Metadata includes a description and keywords for the club and its games.
- The "Aktuelle News" area is a horizontally scrollable card list.
- Four cards are displayed for tournament announcement, new players, training, and tournament success.
- The card links target `news-turnier-2025.html`, `news-neue-spieler.html`, `news-training.html`, and `news-erfolg.html`. Those files are not currently present, so these are broken routes until the pages are added or the links are changed.
- Slider arrow buttons call `scrollSlider('left'|'right')`, but the function is not defined in the current HTML and no script is loaded. Native horizontal scrolling remains available through the scrollable container.
- The "Unser Verein" image uses a remote `via.placeholder.com` URL.
- The "Geschichte" section uses local `Geschichte.png` and currently contains only the partial text `Die Wieländer Wühlmäuse wurde`.

### League of Legends: `league-of-legends.html`

- Displays a remote League of Legends logo.
- Shows a centered descriptive text panel with placeholder Lorem Ipsum content.
- Roster contains five cards: Falafl (Top Lane), Zwuck (Jungle), 1Overninja1 (Mid Lane), HungerBoo (ADC), and aTrulixx (Support).
- Player images are remote placeholder URLs.
- Team photo uses local `League Kader.jpg`.
- Slider arrow buttons call `scrollTeamSlider('left'|'right')`, but this function is not defined and no script is loaded.

### Super Smash Bros.: `super-smash-bros.html`

- Displays a remote placeholder game logo.
- Shows a centered descriptive text panel with placeholder Lorem Ipsum content.
- Roster currently contains one player: Martin, whose main is Mr. Game & Watch, age 19.
- Player image is a remote placeholder URL.
- Slider arrow buttons use the same undefined `scrollTeamSlider` handler as the League page.
- There is no local team photo section on this page.

### Legal page: `impressum.html`

- Uses a narrower `800px` main content area.
- Contains club name/address, email link, responsible person, and liability disclaimer.
- The legal text is content-sensitive: changes should be reviewed for legal accuracy, not treated as ordinary copy edits.

## Data and External Resources

There is no data layer or content API. All roster, news, legal, and descriptive content is hard-coded in the HTML.

Remote resources currently include:

- `via.placeholder.com` for news, club, game-logo, and player placeholder images.
- Wikimedia Commons for the Instagram icon.
- `cdn0.gamesports.net` for the Prime League icon.
- A Wikia-hosted League of Legends logo.
- Instagram and Prime League page URLs as external footer destinations.

The site therefore depends on network availability for several images. Before replacing a remote image, preserve meaningful `alt` text and document any new external origin here.

## Known Gaps and Risks

- Shared CSS and shared header/footer markup are duplicated across pages, so drift is likely.
- No JavaScript implementation exists for the referenced slider arrow handlers.
- Four homepage news destinations are missing.
- Several visible sections still use Lorem Ipsum or placeholder images.
- The history copy is incomplete.
- The homepage logo area contains both an empty linked `.logo` anchor and the actual logo image using the same class; this should be understood before changing header layout or accessibility.
- There are no automated checks for broken local links, missing assets, HTML validity, or external resource availability.
- `README.md` does not currently document how to preview or deploy the site.

## Proposed Future Architecture

### GitHub Pages boundary

GitHub Pages is suitable for the current static HTML site and for a future static frontend bundle. It is not a suitable runtime for a Riot API key, database, Redis, background worker, server-side authentication, or protected API logic. Those capabilities must run on a separate backend platform, with the frontend calling that backend over HTTPS.

The likely current setup is **Settings -> Pages -> Deploy from a branch -> `main` / root**, because the repository has a `CNAME` file and no workflow. Under that setup, a push to `main` normally triggers a Pages deployment. This cannot be confirmed from the local clone; verify the Pages settings and the Deployments tab in GitHub. If Pages is configured for **GitHub Actions** instead, publishing requires a workflow, and none currently exists in this repository.

For the future system, use one of these deployment arrangements:

- Keep the static frontend on GitHub Pages and deploy the API, worker, database, and Redis through separate services. This is the smallest change from today.
- Move the frontend to a platform that supports the selected full-stack web runtime if server-rendered authenticated pages are required. Keep the existing custom domain or split a dedicated API subdomain such as `api.wiwu-esport.de`.

Regardless of arrangement, configure CORS, cookie settings, redirects, and environment-specific API URLs explicitly. Never solve the Riot API requirement by putting the Riot key into a GitHub Pages JavaScript bundle.

The current static site is a useful content prototype, but Riot API access and restricted content require a server-side application. The recommended target is a TypeScript monorepo with a modular monolith at first:

```text
Browser
  -> Web app (public pages, dashboards, login UI)
  -> API app (authentication boundary, business modules, Riot proxy)
       -> PostgreSQL (users, teams, content, cached game data)
       -> Redis (short-lived cache, rate limits, job coordination)
       -> Riot API (server-side only)
       -> Object storage (uploaded images and documents)
  -> Background worker (Riot sync, refresh jobs, notifications)
```

This keeps the first version operationally small while enforcing boundaries between UI, business logic, external integrations, and persistence. A separate service should only be introduced later when scale or ownership justifies it; the initial design should not begin as a distributed microservice system.

### Recommended technology direction

- Frontend: Next.js with React and TypeScript, using server rendering for public SEO pages and client components only for interactive dashboards.
- API: TypeScript modular API using NestJS or Fastify. Pick one framework during implementation and keep all Riot and database access behind application modules.
- Database: PostgreSQL with a migration tool and a typed data-access layer such as Prisma or Drizzle. Use one consistently; do not mix ORMs.
- Cache and jobs: Redis for cache entries, API rate limiting, and a durable job queue such as BullMQ. Jobs must be retryable and idempotent.
- Authentication: OIDC-compatible identity provider, with the web app receiving an authenticated session and the API validating short-lived tokens. Do not implement password storage unless there is a strong reason to own that security responsibility.
- Validation: shared TypeScript schemas, for example Zod, at every API boundary. Treat Riot responses and user input as untrusted data.
- Testing: unit tests for domain modules, API integration tests against a disposable PostgreSQL/Redis setup, and browser smoke tests for public and authenticated flows.
- Deployment: deploy the web app and API behind HTTPS, run the worker separately, and provide managed PostgreSQL/Redis. Keep secrets in the hosting secret store, never in the repository or browser bundle.

### Suggested repository structure

```text
.
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── app/                     # Routes, layouts, loading/error states
│   │   │   ├── (public)/            # Homepage, games, news, legal pages
│   │   │   ├── dashboard/           # Authenticated user area
│   │   │   └── admin/               # Restricted staff area
│   │   ├── components/              # Shared visual components
│   │   ├── features/                # UI grouped by business capability
│   │   │   ├── club/
│   │   │   ├── league-of-legends/
│   │   │   ├── smash/
│   │   │   ├── news/
│   │   │   └── account/
│   │   └── lib/                     # API client, auth client, config
│   ├── api/                         # Server-side API modular monolith
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── authorization/
│   │       │   ├── club/
│   │       │   ├── games/
│   │       │   ├── league-of-legends/
│   │       │   ├── smash/
│   │       │   ├── news/
│   │       │   └── media/
│   │       ├── integrations/
│   │       │   └── riot/
│   │       ├── db/
│   │       └── config/
│   └── worker/                      # Scheduled and queued background jobs
│       └── src/jobs/
│           ├── riot-sync/
│           ├── cache-refresh/
│           └── notifications/
├── packages/
│   ├── contracts/                   # Versioned API DTOs and shared schemas
│   ├── domain/                      # Framework-independent business types/rules
│   ├── config/                      # Shared lint, TypeScript, and environment helpers
│   └── ui/                          # Only genuinely reusable design-system components
├── database/
│   ├── migrations/
│   └── seed/
├── tests/
│   ├── integration/
│   └── e2e/
├── infra/                           # Deployment definitions and environment config
├── pnpm-workspace.yaml
├── turbo.json                       # Optional task orchestration
└── README.md
```

The existing root HTML files should be migrated into `apps/web` incrementally. During migration, either keep them as a temporary legacy site or redirect each route after its replacement is verified. Do not make the browser call Riot directly and do not put API keys in `apps/web`.

### Module boundaries

Each API module should own its routes/controllers, input schemas, application services, domain rules, persistence ports, and tests. Modules may depend on shared contracts and domain primitives, but should not reach into another module's database tables or private services.

- `auth`: session/token validation and identity-provider integration.
- `authorization`: roles, permissions, membership checks, and resource policies.
- `users`: profiles and external identity mapping.
- `club`: clubs, teams, rosters, memberships, and staff-managed metadata.
- `games`: the catalog of supported games and game-specific configuration.
- `league-of-legends`: Riot account links, summoner profiles, match summaries, rankings, and team statistics.
- `smash`: Smash-specific players, rosters, events, and statistics without forcing League concepts onto it.
- `news`: public and restricted editorial content, drafts, publishing, and visibility rules.
- `media`: upload metadata and references to object storage; binary files should not live in PostgreSQL.
- `integrations/riot`: the only module allowed to know Riot endpoint details, headers, regional routing, retries, and response mapping.

## Riot API Integration Design

Riot integration must be a server-side adapter, never a frontend data fetch. Store Riot identifiers rather than relying on mutable display names: platform/region, Riot ID game name and tag where applicable, and the stable PUUID. Keep Riot API response shapes separate from internal domain models so a Riot API change does not leak through the whole application.

Recommended request flow:

1. The browser requests an application endpoint such as `/api/league-of-legends/players/:id`.
2. The API checks authentication and authorization for the requested resource.
3. The League module reads a fresh-enough normalized record from PostgreSQL/cache.
4. A cache miss schedules or performs a rate-limited Riot adapter request; it does not expose the Riot key.
5. The adapter maps the response into internal models and records fetch time, source, and failure state.
6. The API returns a stable application response with loading, stale, unavailable, and not-found states.

Use background jobs for match-history and statistics refreshes. Cache data with explicit TTLs, add exponential backoff for transient failures, and enforce both application-level and Riot-region rate limits. Never assume that a user's display name is unique or permanent. Document the exact Riot products, regions, consent requirements, and allowed data retention before implementation; those details are product and compliance decisions, not merely infrastructure settings.

## Authentication and Restricted Content

Use identity-provider authentication and application authorization as separate concerns:

- Authentication answers who the user is.
- Authorization answers what that user may read or change.

Start with roles such as `public`, `member`, `coach`, `editor`, and `admin`, but implement permissions as named capabilities so roles can evolve without scattering role checks through UI code. Enforce every restriction in the API and database query layer; hiding a navigation item is only a usability feature, not a security boundary.

Suggested protected resources include private team pages, internal announcements, player administration, editorial drafts, and staff tools. Store an audit record for administrative mutations, avoid logging tokens or personal data, and provide account deletion/data export paths if user data is retained.

## API and Content Conventions

- Version public API contracts, for example `/api/v1/...`, when the first API is released.
- Return consistent error objects with a safe user message and a server-side correlation ID.
- Paginate match history, news, and other growing collections.
- Keep public content cacheable and private responses explicitly non-cacheable unless the cache is user-aware.
- Use feature flags or configuration for optional games and integrations; adding Smash should not require changing League code.
- Treat editorial content as records with status (`draft`, `published`, `archived`), author, timestamps, and visibility policy rather than hard-coded HTML.

## Migration Path

1. Move shared styling and shell markup into the new web app while preserving the current public routes and German content.
2. Add the API skeleton, environment validation, PostgreSQL migrations, and health checks without exposing Riot functionality yet.
3. Add the auth provider and authorization policies; protect a small test page before protecting real content.
4. Implement the Riot adapter behind a feature flag, beginning with account lookup and one read-only statistic.
5. Add cache and worker refresh jobs, then migrate roster and statistics pages from hard-coded content to API-backed data.
6. Add news/content management and restricted team areas.
7. Replace placeholders and broken news routes, then retire the legacy root HTML files after route and browser checks pass.

Each migration step should preserve a working public site and update this document, route inventory, environment variable documentation, and tests in the same change.

## Change Protocol

For every future edit:

1. Identify whether the change affects a page, shared duplicated shell, local asset, external URL, route, content area, or deployment behavior.
2. Update the affected HTML/assets.
3. Update this `architecture.md` in the same change with the new file map, relationship, behavior, or known-gap information.
4. Check local links and asset paths when routes or filenames change. For this repository, a practical baseline is to inspect all `href` and `src` references and verify local targets exist.
5. Keep this document factual and current; remove a known gap once it is actually resolved.

## Preview

This is a static site and can be opened directly in a browser from `index.html`. A simple local HTTP server is preferable when checking relative links and browser behavior, for example:

```text
python3 -m http.server
```

No build step is required by the current repository.
