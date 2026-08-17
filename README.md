# WiWU Esport

Static-first website for the Wieländer Wühlmäuse. The project uses Vite and browser-native ES modules so it can be developed locally and deployed as generated files to GitHub Pages. HTML entrypoints live in `pages/`; Vite emits the deployable routes at the root of `dist/`.

## Local development

Requirements: Node.js 22 or newer and npm.

```text
npm install
npm run dev
```

Open the local URL printed by Vite. The production-equivalent check is:

```text
npm run build
npm run preview
```

`npm run build` must pass before merging. It creates the deployable `dist/` directory.

## Deployment

`.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages for pushes to `main` and manual workflow runs. In GitHub repository settings, set Pages to **GitHub Actions** as the source. The `CNAME` file is copied into the build output for `www.wiwu-esport.de`.

The Riot API, authentication, database, and private content are not implemented in this static frontend. They must be provided by a separate HTTPS backend; never put Riot credentials in frontend code.

See [architecture.md](architecture.md) for the source layout, module boundaries, and migration plan.