# AGENTS.md

Code Garden is a layout for [Herdr](https://herdr.dev), a desktop app for terminals and coding agents. This repo holds the files someone copies into their Herdr home (`~/.config/herdr-app`): one layout, one theme, six mods. It also holds the docs Herdr's layout gallery (herdr.dev/layouts) needs: `RECIPE.md`, `preview.png`, and the GitHub topic `herdr-layout`. There is no build and no package manager. Mods are plain JavaScript that Herdr loads and hot-reloads.

## Required reading

- **Herdr's own manual:** `~/.config/herdr-app/AGENTS.md` and the type files beside it (`herdr.d.ts`, `gpui-kit.d.ts`). Read the manual before changing any mod. The type files are the truth for this Herdr version. Herdr rewrites all three on every start.
- **[RECIPE.md](RECIPE.md):** what the layout looks like and does, exactly. Read its "Watch out" section before writing UI code.

## Where to edit: the live install, then sync

There are two copies:

| Copy | Path | Role |
|---|---|---|
| Live install | `~/.config/herdr-app/{layouts,themes,mods}` | What Herdr runs. Saving a file there updates the window within a second. |
| This repo | here | What gets shared, committed and pushed. |

The workflow:

1. **Edit the live install** and look at the result in Herdr. Use `herdr-app shot <file.png>` to see the window, `herdr-app status` for errors, and `herdr-app check <mod folder>` after every change.
2. **Run `./sync.sh`** (or `.\sync.ps1`). It copies `plant.js` from `garden-agents` to the other three mods, copies the live layout, theme and mods into the repo (without the files Herdr generates), runs `herdr-app check` on each mod, and shows `git status`.
3. **Update the docs** if anything people can see or do changed (see below), then commit.

The other direction, repo to live install (after a pull, for example), is `./install.sh --update` (`.\install.ps1 -Update`).

Never edit Herdr's shipped mods or layouts (`agents`, `pane`, `main`, ...): Herdr replaces them on every start. The `garden-*` mods are this project's own copies.

## Layout of the repo

- `layouts/code-garden.json`: the window (a copy of Herdr's `main` layout). `layouts/code-garden.svg` is its picture in Herdr's settings.
- `themes/code-garden.json`: the colours.
- `mods/garden-agents`: the Garden list. `plant.js` is the plant sprite engine.
- `mods/garden-pane`: pane headers and the plant picker.
- `mods/garden-spaces`: the two-line spaces list.
- `mods/garden-chrome`: the sky header, scenes and grass footer. `sky.js` holds the sky and grass, `scenes.js` the scenes.
- `mods/garden-status`: the status bar.
- `mods/garden-gallery`: a dev view of every plant in every mood and stage. Open it with `herdr-app do mod.open --name garden-gallery`.
- `install.sh` / `install.ps1`: repo → a Herdr home. They refuse to overwrite unless given `--update`.
- `sync.sh` / `sync.ps1`: live install → repo.
- `tools/preview/`: rebuilds `preview.png` (see below). Not part of the layout; the installers don't copy it.

## Rules

- **`plant.js` lives in four mods** (`garden-agents`, `garden-pane`, `garden-chrome`, `garden-gallery`), because a Herdr mod can't import another mod's files. Edit it only in `mods/garden-agents/plant.js`; `sync` copies it to the other three. The four copies must stay byte-identical.
- **Keep `RECIPE.md` true.** Other people's agents rebuild the layout from it. When behaviour, sizes, colours, timings, counts (plants, scenes) or files change, update the matching section ("What you see", "How it behaves", "Built from", "Watch out", "Done when"). Write exact values, and nothing the build doesn't do.
- **Keep `README.md`'s feature list** in step with `RECIPE.md`.
- **Files derived from Herdr's shipped mods** start with a one-line `// Code Garden — derived from Herdr's shipped ...` comment, and `NOTICE` lists them (Apache-2.0). Keep that line and keep `NOTICE` current if files are added or renamed.
- **No private data in the repo.** That means screenshots of a real Herdr window (real project names, branches, terminal text), personal paths and account names. `preview.png` uses the staged, made-up window in `tools/preview`.
- **No network access and no file reads outside Herdr's home** in the mods. If that ever changes, it must be said in `RECIPE.md` and `README.md` (Herdr's instructions tell installing agents to warn people).

## UI gotchas (each one has broken this layout before)

- Elements are single-use: adding one element to two parents fails the whole render. Build repeated widgets from functions.
- `.loop()` periods must be at least 100 ms. Anything shorter breaks the view when it first draws (`scenes.js` clamps every loop).
- Popups size to their content. A `flex_1().min_h(0)` area inside a popup collapses to zero height.
- Anything positioned past an element's edge can widen it. The scene layer is absolutely positioned and clipped, and the measured strip width is clamped.
- `.transition()` animates changes to an element with a stable id. Scenes key their ids by play number so each play starts fresh.
- Only call `setShared` in render when the value actually changed.
- Animate with `.loop()` / `.transition()`, never with timer-driven re-renders. Timers are for data (the sky's hour, the next scene).

## Rebuilding preview.png

Rebuild it when the look changes noticeably. Herdr must be running with Code Garden installed and the window maximized (the poster is a 1600 × 640 overlay), and Python needs Pillow:

```sh
python tools/preview/build_preview.py   # writes preview.png; add --keep to leave the staged mods in Herdr
```

It stages `garden-showcase` (a fake window with made-up projects) and `garden-poster` (sky, title, cast) into Herdr, screenshots both, composes them, and removes them again. To change what the preview shows, edit `tools/preview/garden-*/main.js`. They import the repo's `plant.js`, `sky.js` and `scenes.js`, which the script copies in beside them.

## Releasing

Commit and push to `main`. Herdr's gallery reads the repo directly; there are no versions or tags. The layout and mods record `cloned_from` Herdr 0.1.17: after building against a newer Herdr, say so in `RECIPE.md` and `README.md`.
