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

## Spieler verwalten

Die Kader stehen in [public/data/players.json](public/data/players.json). Für jeden Spieler kannst du `name`, `role`, `birthDate` und `image` ändern. Das Geburtsdatum muss im ISO-Format `YYYY-MM-DD` eingetragen werden. Die Website berechnet daraus bei jedem Seitenaufruf automatisch das aktuelle Alter. Die derzeit eingetragenen Daten sind Beispielwerte und sollten durch die echten Geburtsdaten ersetzt werden.

Spieler hinzufügen: ein weiteres Objekt in das passende Spiel-Array eintragen. Spieler entfernen: das Objekt aus dem Array löschen. Bilder gehören in `public/images/players/league/` oder `public/images/players/smash/`; der Pfad im JSON muss exakt übereinstimmen. Fehlt ein Bild, wird automatisch das WiWU-Logo angezeigt.

## Datenquellen

Die Prime-League-Werte auf der Startseite stammen aus dem offiziellen Teamprofil: [Wieländer Wühlmäuse auf Prime League](https://www.primeleague.gg/de/leagues/teams/204805-wielaender-wuehlmaeuse). Sie werden aktuell in `src/content/site-data.js` gepflegt und nicht automatisch synchronisiert. Bei einem neuen Split müssen Lifetime- und Saisonwerte dort manuell aktualisiert werden.

Eine spätere automatische Aktualisierung ist grundsätzlich möglich, aber nicht direkt aus GitHub Pages heraus. Ein geplanter GitHub-Action-Job oder ein kleiner Backend-Service müsste die Prime-League-Seite serverseitig abrufen, die Werte in eine versionierte JSON-Datei schreiben und danach den Pages-Build auslösen. Das ist robuster als Browser-Scraping, bleibt aber abhängig von Prime-League-Markup, Rate Limits und den Nutzungsbedingungen der Plattform.

Der Instagram-Bereich nutzt den öffentlichen Profil-Embed von `@wiwu.esport`. Er zeigt Instagram-Inhalte über `instagram.com/embed.js`; GitHub Pages kann ohne Backend keine verlässliche automatische Media-Liste der neuesten Posts abrufen. Dafür wären später ein Professional-Account, eine Meta-App und ein serverseitiger API-Proxy nötig.

## Deployment

`.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages for pushes to `main` and manual workflow runs. In GitHub repository settings, set Pages to **GitHub Actions** as the source. The `CNAME` file is copied into the build output for `www.wiwu-esport.de`.

The Riot API, authentication, database, and private content are not implemented in this static frontend. They must be provided by a separate HTTPS backend; never put Riot credentials in frontend code.

See [architecture.md](architecture.md) for the source layout, module boundaries, and migration plan.