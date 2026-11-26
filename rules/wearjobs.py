"""Per-pose wardrobe art for Smudge. Each item is drawn at the angle its pose needs, with that pose as the
reference, instead of one flat picture reused four times. Also a hoodless head per pose, so the cloak+hood
can come off without ever regenerating the otter himself."""
import sys, json

REF = {   # a picture of Smudge already on the art branch, used only to fix the viewing angle and the style
  'stamp': 'art/raw/f/smudge_stamp_1.jpg',
  'fish':  'art/raw/desk/smudge_fish_1.jpg',
  'pick':  'art/raw/desk/smudge_pick_side_1.jpg',
  'dig':   'art/raw/f/smudge_dig_1.jpg',
}
VIEW = {
  'stamp': 'seen straight from the front and very slightly from above, tilted about 8 degrees to the left, as it would sit on the head of someone facing the viewer and looking down at a book',
  'fish':  'seen from the side in profile, facing to the RIGHT, tilted about 8 degrees, as it would sit on the head of someone in side view looking out to the right',
  'pick':  'seen from the side in profile, facing to the RIGHT, tilted about 6 degrees, as it would sit on the head of someone in side view leaning forward',
  'dig':   'seen from the side in profile, facing to the RIGHT, tilted about 10 degrees and foreshortened slightly from above, as it would sit on the head of someone in side view with the head tipped down',
}
STYLE = ("Drawn in exactly the art style of the reference image: bold clean dark navy outlines, bright warm saturated colours, "
         "flat cel shading with two tones and a warm rim light, light painted texture. "
         "Centred on a plain pure white background with a generous white margin. No text, no labels, no ground shadow.")
ALONE = ("IMPORTANT: draw the object completely on its own, floating in empty space. No head, no body, no character, "
         "no animal, no otter, no mannequin, no stand. The object and nothing else.")

ITEMS = {
 'crown':   'a chunky ornate golden crown with five rounded points, each tipped with a small red gem, a band of dark red velvet around the base and a rim of white fur trim along the bottom edge. Heavy and storybook, not a thin circlet',
 'glasses': 'a pair of round wire-rimmed spectacles with thin brass frames, clear glass with a soft white highlight across each lens, and arms that sweep back. Scholarly and delicate',
 'jetpack': 'a small retro brass-and-copper rocket jetpack: two rounded fuel cylinders side by side with riveted bands, a pressure dial, leather shoulder straps, and two short nozzles at the bottom with a lick of orange flame',
}
FIT = {
 'crown':   'Scale it as a crown sized for a small otter head: wide and substantial, clearly wider than it is tall.',
 'glasses': 'Scale it as spectacles sized for a small otter face: wide enough to span both eyes across a broad muzzle.',
 'jetpack': 'Scale it as a pack sized for a small otter back: compact and chunky, about as tall as it is wide.',
}
HEAD = ("Just the HEAD and neck of Smudge the otter apprentice, cut off at the neck, with NO HOOD and NO CLOAK of any kind. "
        "Exactly the same otter face as the reference image: the same warm brown fur, same cream muzzle and chin, same big dark eyes with white highlights, "
        "same pink blush on the cheeks, same whiskers, same friendly expression. Now that the hood is gone, show the full top of his head: "
        "rounded otter head with short smooth fur, a sleek crown, and two small round otter ears set low on the sides. Bare head, uncovered, no hat, no hood, no headwear at all. ")

jobs = []
for pose in ('stamp', 'fish', 'pick', 'dig'):
    for item, desc in ITEMS.items():
        jobs.append((f'art/raw/wear/{item}_{pose}',
                     f'A single game cosmetic item: {desc}. It is {VIEW[pose]}. {FIT[item]} {ALONE} {STYLE}',
                     [REF[pose]], '1:1', 2))
    jobs.append((f'art/raw/wear/head_{pose}',
                 HEAD + f'The head is {VIEW[pose]}. {STYLE}',
                 [REF[pose]], '1:1', 2))

# --- turnaround views, for feeding image-to-3D tools and for future back-facing poses ---
SM = ("Smudge the otter apprentice, exactly the same character as the reference image: a small friendly otter with warm brown fur, "
      "a cream muzzle and chin, big dark eyes with white highlights, pink blush on the cheeks, wearing a teal hooded cloak with the hood up, "
      "and a brown leather backpack holding rolled scrolls and a large feather quill. ")
POSE = ("Standing upright in a relaxed neutral A-pose, both arms hanging slightly away from the body, legs straight and slightly apart, "
        "holding nothing, no props, no book, no tools. Full body from the top of the hood to the feet, nothing cropped. ")
TSTYLE = ("Flat even lighting with no strong shadows, bold clean dark navy outlines, bright warm saturated colours, flat cel shading. "
          "Plain pure white background. No text, no labels, no ground shadow, no floor.")
TREF = 'art/raw/f/smudge_stamp_1.jpg'
_t = [
 ('turn_sheet', SM + POSE + "A character turnaround reference sheet: the SAME character drawn four times in a row, left to right, at exactly the same height and scale, evenly spaced and not touching: "
  "1) front view facing the viewer, 2) three-quarter view turned 45 degrees to his left, 3) full side view in profile facing right, 4) back view seen from directly behind with the hood and backpack facing the viewer. " + TSTYLE, '2:1'),
 ('turn_front', SM + POSE + "Front view, facing the viewer straight on, perfectly symmetrical. " + TSTYLE, '1:1'),
 ('turn_back',  SM + POSE + "Back view, seen from directly behind: the back of the teal hood, the back of the cloak, and the leather backpack with its scrolls and quill facing the viewer. His face is not visible at all. " + TSTYLE, '1:1'),
 ('turn_q_left',  SM + POSE + "Three-quarter view, turned 45 degrees away from the viewer to his left, so part of his face and part of his back and backpack are both visible. " + TSTYLE, '1:1'),
 ('turn_q_right', SM + POSE + "Three-quarter view, turned 45 degrees away from the viewer to his right, so part of his face and part of his back and backpack are both visible. " + TSTYLE, '1:1'),
]
for nm, pr, asp in _t:
    jobs.append((f'art/raw/wear/{nm}', pr, [TREF], asp, 2))

if __name__ == '__main__':
    def q(s): return "'" + s.replace("'", "''") + "'"
    rows = ['(%s,%s,array[%s]::text[],%s,%d)' % (q(p), q(pr), ','.join(q(r) for r in rf), q(a), n)
            for p, pr, rf, a, n in jobs]
    print('insert into public.os_art_job(path,prompt,refs,aspect,n) values\n' + ',\n'.join(rows) + '\nreturning id, path;')

