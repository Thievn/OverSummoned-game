# smudge-base — the naked Smudge model

**What it's for.** A character LoRA of Smudge with no cloak, so he can be generated in the parts
a rig needs, and so the cloak and every cosmetic can go on as separate layers over the top.

**Base architecture.** Z-Image LoRA (`zimage-lora`). Scenario recommends it as the highest
training fidelity for a stylised character. A LoRA trained on any Z-Image variant works across
all three Z-Image models at inference.

**Dataset size.** 5 to 15 images recommended, 50 maximum.

## Images

Nothing here yet.

Wanted: the eight-pose turnaround of Smudge with no cloak, arms out, on a white background. Made
by Poppy Rose (Grok). There is a second version of the same sheet with the cloak on — keep that
one too, in `_sheets/`, but do not train on it.

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
