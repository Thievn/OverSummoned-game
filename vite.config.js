import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function artManifest() {
  const virtualId = '\0virtual:art';
  return {
    name: 'art-manifest',
    resolveId(source) {
      if (source === 'virtual:art') return virtualId;
    },
    load(source) {
      if (source !== virtualId) return null;
      const raw = JSON.parse(
        fs.readFileSync(new URL('./public/assets/oversummoned/manifest.json', import.meta.url), 'utf8'),
      );
      const characters = {};
      for (const c of raw.characters) {
        const animations = {};
        for (const [name, clip] of Object.entries(c.animations)) {
          animations[name] = {
            sheet: clip.sheet,
            frame_count: clip.frame_count,
            fps: clip.fps,
            loop: Boolean(clip.loop),
            frame_width: clip.frame_width,
            frame_height: clip.frame_height,
          };
        }
        characters[c.id] = {
          id: c.id,
          title: c.title,
          kind: c.kind,
          facing: c.facing,
          know_how: c.know_how || '',
          frame_width: c.frame_width,
          frame_height: c.frame_height,
          feet_anchor_x: c.baseline.feet_anchor_x,
          feet_offset_from_bottom_px: c.baseline.feet_offset_from_bottom_px,
          animations,
        };
      }
      const backgrounds = {};
      for (const b of raw.backgrounds.items) {
        backgrounds[b.id] = {
          id: b.id,
          file: b.file,
          ground_y: b.ground_y,
          width: b.width,
          height: b.height,
        };
      }
      const slim = {
        characters,
        backgrounds,
        groundY: raw.backgrounds.items[0].ground_y,
        imgW: raw.backgrounds.items[0].width,
        imgH: raw.backgrounds.items[0].height,
      };
      return `export default ${JSON.stringify(slim)};`;
    },
  };
}

function waitlistDev() {
  return {
    name: 'waitlist-dev',
    configureServer(server) {
      server.middlewares.use('/api/waitlist', (req, res) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            let body = {};
            if (raw) body = JSON.parse(raw);
            const { processWaitlist } = await import('./api/waitlist-core.js');
            const result = await processWaitlist({
              method: req.method || 'GET',
              body,
              ip: req.socket?.remoteAddress || 'local',
              env: process.env,
              fetch: globalThis.fetch,
            });
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'invalid' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), artManifest(), waitlistDev()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
