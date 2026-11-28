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

## 2. Two rigs, three sizes

Dean wants the desktop pet to offer a size choice. That is two rigs, not three:

| Size | What you see | Rig |
|---|---|---|
| **Small** | Head and paws at the edge of a desk, Bongo Cat style | A |
| **Medium** | Head, torso, arms, the desk and whatever he is using | A, zoomed out |
| **Large** | Smudge sitting on the dock, legs over the edge, scene behind him | B |

Small and medium are the **same rig at a different zoom and crop** — one set of parts, two camera
settings, no extra art.

The dock is not. He is seated and side-on, so his legs are visible and his body reads completely
differently. That needs its own parts. It can come second.

## 3. Parts to generate

Each part is its own image on a blank background. Nothing is generated already attached to
anything else.

### Rig A — desk, front on

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

About 18 pieces. The face parts come from the expression sheet, which is better art than the
turnaround and already exists.

### Rig B — dock, seated

Everything above, plus legs, and the head and face redrawn at the three-quarter angle:

| Part | Notes |
|---|---|
| thigh near / far | |
| shin near / far | |
| foot near / far | |
| head, face set | at the seated angle; the front-on set will not reuse |

About 14 more.

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

1. **Rig A parts** — 18 pieces. The compact pet is the smallest useful thing that can ship.
2. **Props for what he already does** — stamp, rod, shovel, lockpick, chest. 6 pieces.
3. **Rig A in DragonBones**, and the animations. No credits, just time.
4. **The hood**, so the wardrobe works at all.
5. **Rig B** — the dock, 14 more pieces and a second rig.
6. Everything else as it is wanted.

Rough total for steps 1, 2 and 4: about 25 pieces. At a few attempts each that is a few hundred
generations, well inside a month's Pro allowance, and it is the point where there is something
running on a desktop to look at.

## 8. Open

- Does the medium size show the desk, or Smudge against the room?
- Does the dock rig need its own face set, or can the front-on faces be reused at an angle? Worth
  testing with two generations before committing to a second full set.
- Where the rarity glow sits relative to the chest: behind it, in front of the lid, or both.
