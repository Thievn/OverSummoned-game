# Training source images

Every picture that gets fed to a Scenario model lives here, in the repo, not in a chat window.

This folder exists because source art kept getting lost. A sheet gets made in a chat, used once,
and then nobody can find it a week later when the model needs retraining. If an image matters
enough to train on, it belongs in git.

## How it's laid out

One folder per model.

```
art2/train/smudge-base/        the naked Smudge poses, no cloak
  pose_front.png
  pose_front.txt               the caption for that image
  pose_side.png
  pose_side.txt
  SOURCE.md                    where the images came from and what the model is for
```

**Every image needs a caption file** with the same name and a `.txt` extension. Scenario refuses
to start training on an image with no caption, and a good caption is most of what makes a LoRA
work. One line, plain description, same wording pattern across the set.

## Rules

- **Originals, not screenshots.** A screenshot of a sheet in a browser is not a source image.
- **One pose per file.** Never train on a grid — feed a model a 3x2 sheet and you teach it to
  draw 3x2 sheets. Cut the sheet up first and keep both: the sheet in `_sheets/`, the cut poses
  as the dataset.
- **Say where it came from** in SOURCE.md: who made it, which tool, which prompt if there was
  one, and the date. When a model needs retraining in six months that file is the difference
  between an afternoon and starting over.
- **PNG or JPG.** Keep them as they arrived; don't re-compress a master.

## Models so far

| Folder | What it trains | Status |
|---|---|---|
| `smudge-base/` | Smudge with no cloak, for the rig and for everything worn over him | waiting on the source sheet |
