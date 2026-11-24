# OverSummoned

Private archive of everything OverSummoned.

**Live site:** [oversummoned.com](https://oversummoned.com) still deploys from [`Thievn/the-den`](https://github.com/Thievn/the-den). This repo is a copy. Do not point Vercel or DNS at this repository.

A separate private repo, [`Thievn/oversummoned`](https://github.com/Thievn/oversummoned), already existed (idle RPG card collector, created 2026-11-23). It was left untouched. This repo is `OverSummoned-game` because that name was taken.

## Layout

| Where | What |
| --- | --- |
| `main` | Exact copy of `the-den`'s `main` (initial commit only). |
| `oversummoned-v3` | Latest OverSummoned site code from `the-den` (full history). |
| `oversummoned-v2`, `oversummoned-landing`, `cursor/thievns-den-landing-4d7d` | Earlier `the-den` branches, also mirrored with history. |
| `extras` (this branch) | The `the-den` `main` README plus all box-only work under `extras/`. |

Site history on the mirrored branches is unchanged from `the-den`. Box-only work lives only on `extras`.

## extras/

| Folder | Contents |
| --- | --- |
| `extras/godot/` | Godot 4 desktop clicker project (source, assets, packaged zips under 50 MB). |
| `extras/companion-preview/` | Clicker companion / landing preview site (no `node_modules`, build output, or Vercel metadata). |
| `extras/blender/` | Summoner `.blend` files, scripts, item renders, and preview gif/mp4. |
| `extras/desktop-plan/` | Early desktop overlay and companion mockups. |
| `extras/bible/` | OverSummoned game bible and plan docs. |
| `extras/assets/` | Character, background, and logo art. |
| `extras/brand/` | Logo options and icon build scripts. |
| `extras/kit/` | Card kit: portraits, frames, icons, compose tools. |
| `extras/mocks/` | HTML/PNG mockups and concepts. |
| `extras/card-gear-mock/` | Card + gear mock pages and shots. |
| `extras/pixellab/` | PixelLab sprite previews. |
| `extras/parody/` | Parody character portraits and card art. |
| `extras/copy/` | Extra copy / layout images. |
| `extras/emails/` | Auth email templates and SMTP setup scripts (no live keys). |
| `extras/migrations/` | OverSummoned SQL migrations. |
| `extras/sql/` | Premigration function backup (no secrets). |
| `extras/live-screenshots/` | Screenshots of the live site. |

## What was left out

- Secrets: `oversummoned-claude-login.txt`, `companion-preview/.env.local` (Vercel token), `node_modules/`, `.vercel/`, and `/workspace/secrets/`.
- Caches and build output: Godot `.godot/`, `dist/`, `__pycache__/`, Blender `summoner.blend1` autosave.
- Files over 50 MB (Git LFS is not set up): `oversummoned-kit.tar.gz` (71.5 MB, same contents as `extras/kit/`), `blender/preview/summoner_cast_loop_alpha.mov` (82.6 MB). The smaller gif and mp4 of that loop are included.
- Render frame dumps: `blender/preview/frames/` and `blender/preview/comp/`. The useful sprite frames under `blender/frames/` are included.
- Duplicate tarballs of folders already copied: `oversummoned-assets.tar.gz`, `oversummoned-mocks-bundle.tar.gz`.
- Working clones of `Thievn/oversummoned` on the box (`oversummoned-deploy/`, `oversummoned-analytics/`), including their `.vercel` project files. That repo still exists on GitHub.
- `thirstcheck-resend-backup.json` (ThirstCheck domain/API key inventory, not OverSummoned source).

Nothing in this copy should be treated as a deploy target. Keep production hooked to `Thievn/the-den`.
