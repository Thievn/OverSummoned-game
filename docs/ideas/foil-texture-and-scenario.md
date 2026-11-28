Written by: Grok
Date: 2026-11-28
Status: idea

# Foil texture, and using Scenario for the card art

Two connected ideas. One is a seamless foil texture that moves under the card border. The other is using Scenario (scenario.com) to make the card art in a consistent style.

## The foil

Dean wants a seamless, loopable foil texture that he can animate in Scenario.

I made a pearly foil tile, soft diagonal bands of lilac, blue, pink and mint, that wraps cleanly in both directions: scroll it left, right, up or down forever and you never see a seam. It comes in a 2048 and a 4096 size, plus a more subtle version for lower rarities.

The textures now live in this repo, under `docs/ideas/assets/foil/`. That folder is with the idea docs, not with the live game art in `assets/v2/`, because the foil is not wired into the game yet. `docs/` is already kept off the live site. Copies are also on Dean's Drive, in the older v3 frames folder: https://drive.google.com/drive/folders/18zZylDrG0qahMznWo2np4_YsMZ-uNnFs.

| File | What it is |
|---|---|
| [`foil_seamless_2048.png`](assets/foil/foil_seamless_2048.png) | Seamless tile, 2048 x 2048. The one to use in the game. |
| [`foil_seamless_4096.png`](assets/foil/foil_seamless_4096.png) | The same tile, 4096 x 4096, for print or a close-up. |
| [`foil_seamless_subtle.png`](assets/foil/foil_seamless_subtle.png) | A quieter version, for lower rarities. |
| [`foil_tile_preview_2x2.png`](assets/foil/foil_tile_preview_2x2.png) | Four copies of the 2048 tile in a square, so you can see it tiles. |
| [`foil_tile_preview_subtle_diag_offset_2x2.png`](assets/foil/foil_tile_preview_subtle_diag_offset_2x2.png) | The same check for the subtle version, offset on the diagonal. |

How it is used:

- Each frame has a foil mask that is white only over the border ring. The texture scrolls underneath the mask, so only the border shimmers. The art, the text and the numbers never move.
- On rarer frames the shimmer is stronger. On the rare I would keep it faint and blue, to match the family it belongs to.
- The same mask works on the back, because the back border is the same as the front's.

Why it fits `docs/direction-cards.md`. Section 1 says Smudge is the only animated thing and heroes are static art. A shimmer on the border is not a hero animating, and it costs nothing per hero, because it is one texture and one mask. If Claude reads section 1 more strictly than that, it is the one place my idea might clash, and Dean should decide. Section 8 step 4 already mentions a foil treatment for rare cards.

Two things worth settling:

- **Does foil follow rarity or follow the form?** I made a separate true-summon frame for human cards, so the choice exists. My lean is rarity: rare and above shimmer, whatever the form.
- **Is it live or baked?** For the game and for Steam trading cards, a live scrolling texture under a mask is light and works on any card. A pre-made looping video of the shimmer from Scenario is nicer for trailers and store pages, but is a separate file per use.

## Scenario

Dean is getting a Scenario plan (the Black Friday yearly deal, which he said includes 5,000 credits). I checked how it would fit.

- **Why it suits this game.** The whole problem with fifty cards, and more every set, is that they all have to look like the same game. Scenario lets you train a custom model on your own art, so new cards come out in the same style. That matches step 1 in `docs/direction-cards.md` section 8: train one model on the character style, covering both animal and human forms.
- **Other things it does that we need.** Transparent cutouts (for the pop-out cards), upscaling, seamless textures like the foil, and short animations.
- **Claude can drive it.** Scenario has an official MCP server. As far as I could tell it lets an assistant upload reference images, start a custom model training run and generate with the trained model, all from chat. In Claude Code it is added with `claude mcp add --transport http --scope user scenario https://mcp.scenario.com/mcp` and signed into through the browser. Check this against Scenario's current docs before relying on it.
- **Before buying:** make sure the plan Dean picks includes custom model training. One guide I read said training starts at a higher tier than the cheapest one. The sale was said to end on 29 November.
- **First credits.** Train one style model on existing card art and Smudge. Make three test characters in both forms. Look at them next to the current cards. Only then run big batches, and note what a card actually costs in credits so the budget is real.
- **What I would not use it for.** One-off key art, where a top general image model can still beat a trained style model.

None of this spends anything. It is a plan for after Dean signs up.
