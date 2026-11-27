"""Concept paintings for the first test batch of 3D accessories. Each is one object on its own, drawn the way
Meshy reads best: a three-quarter view, whole object in frame, plain white, even light, in the same flat
cel-shaded style as Smudge. Plus Smudge in one era outfit (front, side, back) for the outfit test."""
import json
REFS = ['art/raw/ref/dean_front.png', 'art/raw/ref/dean_side.png', 'art/raw/ref/dean_back.png']
OBJ = ("A single game prop drawn on its own, as a 3D modelling reference: {d} Drawn in the exact art style of the "
       "reference images: clean bold outlines, flat cel shading with two tones, warm storybook colours. Three-quarter "
       "view from slightly above so its full shape and depth read clearly. The WHOLE object is in frame with margin "
       "around it, nothing cropped. No character, no hands, nobody holding it. Plain pure white background, flat even "
       "light, no cast shadow, no scenery, no text, no watermark.")
P = {
 'crown':  "a small chunky storybook king's crown in gold, five rounded points each tipped with a little ball, a band set with three oval gems (red, teal, red), sized to sit on a small otter's head. Thick and solid, no thin filigree.",
 'glasses': "a pair of round wire-rimmed reading spectacles with thick dark-brown rims and a little bridge, lenses drawn as pale glass. Chunky and toy-like, not thin.",
 'satchel': "the EXACT brown leather backpack from the back reference image, on its own with no character: same brown leather, same flap, same buckles and straps, with the same rolled parchment scrolls poking out of the top and the same white feather quill tucked in. Match it exactly.",
 'rocket': "a small retro rocket pack worn on the back: two rounded copper-and-brass fuel tanks side by side joined by a riveted plate, little fins, two nozzles pointing down, two short leather shoulder straps. No flames, no smoke, nozzles empty.",
 'rod':   "a 1920s fishing rod: a jointed bamboo rod with brass ferrules and silk-wrapped guides, a round brass reel near the cork handle, and a short length of line ending in a red-and-white bobber. Straight, the whole length visible, laid diagonally.",
 'shovel': "an ancient Roman legionary's digging spade: a wooden T-handle, a straight ash-wood shaft, and a squared iron blade with a riveted bronze collar. Sturdy and simple, the whole length visible, laid diagonally.",
}
jobs = [{'path': f'art/raw/prop/{k}', 'prompt': OBJ.format(d=d), 'refs': REFS, 'aspect': '1:1', 'n': 2} for k, d in P.items()]

SAME = ("This is the SAME otter character as the three reference images and must match them exactly: same height and "
        "proportions, same slim build and long tapering tail, same head size, same warm brown fur with cream chest and "
        "muzzle, same large dark eyes and pink cheek blush, same line weight and flat cel shading. Full body, head to "
        "feet, nothing cropped, standing upright in a relaxed neutral pose with the arms held slightly away from the "
        "body and nothing in his hands. ")
FIT = ("Instead of his cloak he is dressed in a 1920s speakeasy outfit: a charcoal pinstripe waistcoat buttoned over a "
       "cream shirt with rolled sleeves, a small red bow tie, and a grey flat newsboy cap on his head with his two small "
       "round ears showing beneath it. No cloak, no hood, no backpack. His tail and feet are bare fur. ")
STY = "Plain pure white background, flat even light, no cast shadow, no scenery, no text, no watermark."
for k, a in {'front': 'Front view facing the viewer straight on, matching the front reference.',
             'side': 'Full side view in profile facing right, matching the side reference.',
             'back': 'Back view from directly behind, matching the back reference.'}.items():
    jobs.append({'path': f'art/raw/fit/speakeasy_{k}', 'prompt': SAME + FIT + a + ' ' + STY, 'refs': REFS, 'aspect': '1:1', 'n': 2})
if __name__ == '__main__':
    import sys
    rows = ',\n'.join("(%s,%s,ARRAY[%s]::text[],%s,%d,'queued')" % (q(j['path']), q(j['prompt']), ','.join(q(r) for r in j['refs']), q(j['aspect']), j['n'])
                      for j in jobs for q in [lambda s: "'" + s.replace("'", "''") + "'"])
    open('/tmp/propjobs.sql', 'w').write("insert into os_art_job(path,prompt,refs,aspect,n,status) values\n" + rows + "\nreturning id, path;")
    print(len(jobs))
