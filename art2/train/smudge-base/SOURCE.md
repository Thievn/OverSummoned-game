# smudge-base — the naked Smudge model

**What it's for.** A character LoRA of Smudge with no cloak, so he can be generated in the parts
a rig needs, and so the cloak and every cosmetic can go on as separate layers over the top.

**Base architecture.** Z-Image LoRA (`zimage-lora`). Scenario recommends it as the highest
training fidelity for a stylised character. A LoRA trained on any Z-Image variant works across
all three Z-Image models at inference.

**Dataset size.** 5 to 15 images recommended, 50 maximum.

## Images

Eight poses, one per file, 1024x1024 on white, all at the same scale.

They came from `Smudge 360 - bare base` in Dean's Scenario project, which was only a 1240x678
contact sheet. Topaz Image Upscale (Standard V2, 4x, face enhancement off) took it to
4960x2712, which is about 1240x1200 a pose, and `rules/cut_turnaround.py` found each figure and
put it on its own square. Face enhancement was left off on purpose: it is tuned for photographs
of people and makes a mess of a drawn animal.

Cost: 10 CU for the upscale.

There is no higher-resolution original. Dean checked; the eight-pose sheets were never rendered
as separate files.

**Known limitation.** His face drifts between the eight views. `01_front` has proper eyes and
brows; `05_back` and `07_side_left` are nearly featureless and read as a real otter rather than
the character. So this model is for the **body**, which is what a rig needs. His face comes from
the expression art, which is separate and much better.

Already in the repo and **not** suitable for this model, because he is wearing the cloak in all
of them:

- `art2/turn/smudge_turnaround_sheet.jpg` — three views, front, side, back
- `art2/turn/smudge_front.png`, `smudge_side.png`, `smudge_back.png`

## Captions

One `.txt` per image, same stem. Keep the wording pattern identical across the set and change
only the pose, so the model learns the pose words rather than the sentence shape. Something like:

```
smudge the otter, no cloak, standing front on, arms out, bold ink outline, flat cel shading, white background
```
