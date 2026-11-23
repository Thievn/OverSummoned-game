// Writes the update log into updates.html from updates.json. Run after adding an entry (see CHANGELOG.md).
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const data = JSON.parse(readFileSync(root + 'updates.json', 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const when = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
const seenV = new Set();
for (const e of data.entries) {
  if (!e.v || !e.date || !e.title || !Array.isArray(e.items) || !e.items.length) throw new Error('incomplete entry ' + JSON.stringify(e).slice(0, 80));
  if (seenV.has(e.v)) throw new Error('duplicate version ' + e.v);
  seenV.add(e.v);
}
const html = data.entries.map(e => `      <section class="upd-page-entry" id="v${esc(e.v)}">
        <div class="upd-page-when"><time datetime="${esc(e.date)}">${esc(when(e.date))}</time></div>
        <h2>${esc(e.title)}</h2>
        <ul>
${e.items.map(i => `          <li>${esc(i)}</li>`).join('\n')}
        </ul>
      </section>`).join('\n');
const page = readFileSync(root + 'updates.html', 'utf8');
const out = page.replace(/<!-- updates:start -->[\s\S]*?<!-- updates:end -->/, `<!-- updates:start -->\n${html}\n      <!-- updates:end -->`);
if (out === page && !page.includes(html)) throw new Error('markers not found');
writeFileSync(root + 'updates.html', out);
console.log('update log:', data.entries.length, 'entries, newest', data.entries[0].v);
// Keep the service worker version in step with the newest entry, so a new update also refreshes the app.
const swPath = root + 'sw.js';
const sw = readFileSync(swPath, 'utf8');
const sw2 = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${data.entries[0].v}';`);
if (sw2 === sw && !sw.includes(`const VERSION = '${data.entries[0].v}';`)) throw new Error('sw.js VERSION line not found');
writeFileSync(swPath, sw2);
console.log('service worker version:', data.entries[0].v);
