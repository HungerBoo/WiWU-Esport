import { renderLayout } from '../components/layout.js';

export function renderLegal() {
  renderLayout(`
    <article class="legal-page">
      <p class="eyebrow">RECHTLICHES</p>
      <h1>Impressum</h1>
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>Wieländer Wühlmäuse<br>57234 Wilnsdorf</p>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href="mailto:info@wiwu-esport.de">info@wiwu-esport.de</a></p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>Noah Wolff</p>
      <h2>Haftungsausschluss</h2>
      <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
    </article>
  `);
}
