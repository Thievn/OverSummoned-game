# OverSummoned desktop pet

Smudge sits on your desk, facing you, and farms while you type. Every key you press is one
movement: a stamp coming down, a rod flicking, a shovel going in, a pick turning. The keys fill a
chest, and what is in the chest goes to your account on oversummoned.com.

He counts how many keys you press. He never sees which ones.

## Running it

1. Install Godot 4.3 or newer (the standard build, not the C# one).
2. Open Godot, press Import, and pick this folder's `project.godot`.
3. Press the play button (F5).

He appears in a small window with no frame. Drag him anywhere with the left mouse button.

## Using him

- **Left click** him: that counts as a key, the same as typing.
- **Right click** him: the menu.
- **Click the chest** when one lands on the desk: it opens.

The menu has five tabs:

- **Doing** — what he works on. Stamping makes ink for your summons. Fishing, digging and lock
  picking bring back things from the place each one belongs to.
- **Wardrobe** — hats, glasses, scarves, fur colours, cloak colours and other versions of him.
  Everything goes with everything else and with whatever he is doing. There is a switch at the
  bottom that unlocks the lot, for trying them on.
- **Chests** — how full the chest bar is and how many you have opened.
- **Numbers** — keys all time, today, this session, keys a second now and at your best, your best
  day, days in a row, and how long he has spent on each job.
- **Settings** — size, how he talks, always on top, sound, signing in to your account, and quit.

## Signing in

Open your account on oversummoned.com, go to Desktop pet, and it gives you a code. Type that code
into Settings here. After that everything he finds goes straight to your ledger on the website.

Until you sign in he still works and still counts keys, but nothing is saved to the website.

## What is still missing

- **He only counts keys while his own window has focus.** Counting your typing in other programs
  needs a small Windows add-on, which is not built yet.
- No sound yet.
- Evil Smudge and Ghost Smudge are in the wardrobe list but their drawings are not made yet, so
  picking them changes nothing.

## How he is put together

Nothing is baked into one picture. `art/` holds his body, his two paws, the desk, his hood, every
hat, and every prop as its own file, all drawn on the same 1024 page. `rig.json` says where each
one sits, and `items.json` lists everything he can wear, hold or sit behind.

That is what makes the wardrobe work: a new hat is one picture in `art/` plus one line in
`items.json`, and it fits every activity and every other item at once. His face is not a picture at
all. His eyes and mouth are drawn by the program over the top, which is how he blinks, looks sleepy,
goes wide-eyed and sticks his tongue out when you type fast, without any new art.

The pictures are cut from the drawings by `rules/pet2_cut.py` and `rules/pet2_props.py` in the main
repository, and `rules/pet2_preview.py` draws him the same way outside Godot, for checking the
positions. `rules/sim_pet.py` checks the chest numbers against the browser game.
