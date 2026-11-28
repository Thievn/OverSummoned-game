Written by: Claude (Opus)
Date: 2026-11-28
Status: draft, for Dean to mark up

# Smudge: rigs, parts and props

What to generate once the base model is trained, and why it is this list. Written while
`model_Ew2acRuJ8U8zdTuGAs5iGR7H` was training.

Sits under `docs/direction-cards.md`, which says Smudge is the only animated thing in the game.

---

## 1. What changes

Today a new activity means a whole new drawing. `art2/puppet/` has a separately drawn and
separately cut Smudge for stamping, fishing, lock-picking, digging and sleeping — five sets of
parts for five things he does. A sixth activity means a sixth drawing and a sixth cut.

With a rig, a new activity is **new keyframes on parts that already exist**. It costs an evening
of animating and no credits at all. That is the whole reason for doing this.

## 2. One rig, a scene per activity, three sizes

**Dean's idea, 28 Nov, and it replaces the two-rig plan that was here before.** Not a desk for
everything. Each activity gets its own front-facing scene:

- **fishing** — sitting on the edge of a dock, water in front of him
- **lock-picking** — in front of a safe, head down and barely showing, then popping up with
  whatever he got
- **digging** — a hole in front of him

Size then decides how much of the scene you see, not what he is doing.

| Size | What you see |
|---|---|
| **Small** | Smudge and his prop, no scene at all, transparent behind him |
| **Medium** | Smudge and the near part of the scene |
| **Large** | The whole scene behind him |

**Why this is better than two rigs.** The old plan assumed the poses differ, so it needed a
separate seated rig for the dock. If everything is front-facing, **one rig does all of it.** An
activity becomes a pose on the same parts plus a scene plus a prop. A new activity costs a
background and an object, not a new body.

### Cut every scene at his waist

Front-facing seated is the one awkward case: legs pointing at the camera foreshorten badly and
always look wrong. Dean's own examples already solve it. The dock board, the mound of dirt, the
front of the safe — in each one something stands in front of his lower half.

So make it a rule. **Every scene has a foreground element at waist height and he is never drawn
below it.** No legs, in any activity, ever.

That is why Bongo Cat is cheap to make, and it means six fewer parts, no foreshortening problem,
and a new activity needing a new foreground object rather than a new body.

### The pop-up

The best part of the idea, and it generalises. Every activity gets the same rhythm: head down
working, then up with the thing he found. Lock-picking is the obvious one, but fishing and
digging want it too — he goes under and comes up with a fish.

It works everywhere precisely because there is always a waist-height line to pop up over. It is
animation, not art: the loot props are already on the list below.

A pet that does this is worth glancing at. One that just moves is not.

### Scenes in three layers

Not one picture. Far (water, wall, sky), mid (behind him), near (the dock board, the dirt, the
safe front). Size is then just how many layers are drawn: small none, medium near, large all
three. Costs nothing extra, gives real depth, and parallax comes free later if it is wanted.

### Open: which look

Nine scenes already exist in `art2/scenes/` — dock, vault, outback, archive, speakeasy, fjord,
bondi, blackforest, closet — and they are good. But they are **three-quarter dioramas**, little
stages seen from slightly above, built to match the website. Front-facing is a different
composition.

- **A.** Redo them front-on for the pet. Matches the idea exactly. Scenes need no rigging so they
  are cheap, but it is nine new pieces and the pet stops matching the site.
- **B.** Keep the diorama angle and put Smudge in it at three-quarters. Nothing new to draw, pet
  matches the site, but he is no longer front-facing and the compact size stops working.
- **C.** Front-on for the pet, dioramas stay on the site. Two looks, each right for where it
  lives.

Claude leans C. Dean is thinking about it; not decided.

## 3. Parts to generate

Each part is its own image on a blank background. Nothing is generated already attached to
anything else.

One rig, front-facing, cut off at the waist.

| Part | Notes |
|---|---|
| head | skull, muzzle, ears, no face features |
| eyes | open, half, closed — drawn, swapped, never drawn in code |
| brows | neutral, raised, angry |
| mouth | closed, small open, wide open, tongue out |
| torso | chest and belly, shoulders |
| arm upper L / R | shoulder to elbow |
| arm fore L / R | elbow to wrist |
| paw L / R | the grip, drawn empty |
| tail × 3 | three segments, weighted mesh, so it sways |

About 18 pieces, and **no legs** — the scene's foreground covers everything below the waist.

The face parts come from the expression sheet, which is better art than the turnaround and
already exists.

## 4. Props

**Generated as objects on their own. Never in his hand.**

This is the rule that kills the problem Dean hit, where Scenario drew him gripping a stamp by the
base instead of the handle. Image models are bad at hands holding things, and no prompt fully
fixes it. So the model never draws him holding anything: the prop is its own picture, and a bone
puts it in his paw at the right angle. It also means one rig can hold an unlimited number of
props.

| Prop | For |
|---|---|
| stamp | the ledger, his main job |
| ledger, open | the desk |
| quill | the desk |
| scroll | the pack |
| fishing rod | fishing |
| float | fishing |
| fish | the catch |
| shovel | digging |
| lockpick | picking |
| chest, closed | picking, rewards |
| chest, open | the reward moment, with the rarity glow behind it |
| satchel | his pack |
| coin | payouts |
| snack | idle business |

Fourteen, and each one is cheap.

## 5. Cosmetics

Already drawn and in the repo: `art2/wear/` has the crown, glasses and jetpack. `art2/slots/` has
the face and head-top swap art for the four current poses.

New ones needed: **the hood**, as its own piece rather than part of him, which is the whole point
of training him bare. Then whatever hats come after it.

Every cosmetic follows the cosmetics rule in `docs/direction-cards.md`: generate it **onto** the
base with ControlNet holding the body still, then cut off only the cosmetic. The thing on top is
always the thing that is safe to cut.

## 6. Rules for every generation

1. One subject per image. One part, or one prop. Never a sheet, never a pair.
2. Blank background. Plain white, no shadow, no ground.
3. No hands on props, and no props in hands.
4. Use the trigger word `smudgebase` for body parts. Leave it out for props, or they come out
   covered in fur.
5. Same scale across a set, so the parts fit each other without rescaling.
6. Generate at 1024 or larger. The rig scales down cleanly; it cannot scale up.

## 7. Order

1. **The rig's parts** — 18 pieces. The compact pet is the smallest useful thing that can ship,
   and it needs no scene art at all.
2. **Props for what he already does** — stamp, rod, shovel, lockpick, chest. 6 pieces.
3. **The rig in DragonBones**, and the animations, including the pop-up on every activity. No
   credits, just time.
4. **The hood**, so the wardrobe works at all.
5. **Scenes**, once the look is settled — three layers each, starting with the three Dean named:
   the dock, the safe and the dig.
6. Everything else as it is wanted.

Rough total for steps 1, 2 and 4: about 25 pieces. At a few attempts each that is a few hundred
generations, well inside a month's Pro allowance, and it is the point where there is something
running on a desktop to look at.

## 8. Open

- Which scene look: front-on for the pet, dioramas, or both. See section 2.
- Where the rarity glow sits relative to the chest: behind it, in front of the lid, or both.
- Whether the smallest size is a shaped transparent window, as Bongo Cat does it, or a small
  panel. Dean said no scene behind him, which points at transparent.
