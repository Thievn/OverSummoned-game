"""A full 360 turnaround of Smudge, built off the three reference drawings Dean picked (front, side, back).
Every view passes all three as references so the proportions, the height and the style stay the same across
the set -- that was what went wrong when each view was generated on its own. Two sets: dressed as he is, and
a bare otter with nothing on him at all, which becomes the frozen base that cosmetics layer onto."""
import json, os
REFS = ['art/raw/ref/dean_front.png', 'art/raw/ref/dean_side.png', 'art/raw/ref/dean_back.png']

SAME = ("This is the SAME character as the three reference images and must match them exactly: the same otter, "
        "the same height and body proportions, the same slim build and long tapering tail, the same head size "
        "relative to the body, the same warm brown fur with the cream chest and muzzle, the same large dark eyes "
        "and pink cheek blush, the same line weight and the same flat cel shading. Do not make him shorter, "
        "rounder, chubbier or more baby-faced than the references. Same scale and same framing as the references: "
        "full body from the top of the head to the feet, nothing cropped, standing upright in the same relaxed "
        "neutral pose with the arms held slightly away from the body and nothing in his hands. ")
STYLE = ("Flat even lighting, no cast shadow on the ground, no scenery. Plain pure white background. "
         "No text, no labels, no watermark, no border.")
DRESS = "He wears the same teal hooded cloak with the hood up, the same brown leather belt, and the same brown leather backpack with rolled scrolls and a feather quill. "
BARE = ("He is COMPLETELY BARE: no cloak, no hood, no backpack, no scrolls, no quill, no belt, no straps, no "
        "clothing or gear of any kind anywhere on him. Nothing is worn. Because the hood is gone, draw the full "
        "top of his head: a rounded otter head with short sleek fur and two small round otter ears set low on the "
        "sides. His whole body is visible and unobstructed from shoulders to feet, with the cream fur down his "
        "chest and belly. This is a clean base drawing that clothing will be layered onto later, so every part of "
        "his body must be drawn, with nothing hidden or covered. ")

ANG = {
 'q45':   'Turned 45 degrees to the viewer\'s right from the front view: a three-quarter FRONT view, where most of his face is visible along with one side of his body.',
 'q135':  'Turned 135 degrees from the front: a three-quarter BACK view from his right side, where mostly his back is visible and only a sliver of his cheek.',
 'q225':  'Turned 225 degrees from the front: a three-quarter BACK view from his left side, where mostly his back is visible and only a sliver of his other cheek.',
 'q315':  'Turned 315 degrees from the front: a three-quarter FRONT view from his left side, where most of his face is visible along with his other side.',
 'left':  'A full side view in profile facing to the LEFT, the exact mirror of the side reference image.',
}
BASE = {
 'front': 'A front view facing the viewer straight on, symmetrical, matching the front reference image exactly.',
 'side':  'A full side view in profile facing to the RIGHT, matching the side reference image exactly.',
 'back':  'A back view from directly behind, matching the back reference image exactly. His face is not visible.',
}

jobs = []
for k, a in ANG.items():
    jobs.append({'path': f'art/raw/turn/dressed_{k}', 'prompt': SAME + DRESS + a + ' ' + STYLE, 'refs': REFS, 'aspect': '1:1', 'n': 2})
for k, a in list(BASE.items()) + list(ANG.items()):
    jobs.append({'path': f'art/raw/turn/bare_{k}', 'prompt': SAME + BARE + a + ' ' + STYLE, 'refs': REFS, 'aspect': '1:1', 'n': 2})

if __name__ == '__main__':
    json.dump(jobs, open('data/turnjobs.json', 'w'), indent=0)
    print(len(jobs), 'jobs', os.path.getsize('data/turnjobs.json'), 'bytes')
