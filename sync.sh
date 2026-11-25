#!/usr/bin/env sh
# Copies your live Code Garden (the one Herdr runs, in ~/.config/herdr-app) back into this repo.
# Edit and try things in the live install, then run this and commit. (The other direction is
# ./install.sh --update.)
#
#   1. copies mods/garden-agents/plant.js to garden-pane, garden-chrome and garden-gallery
#      in the live install, so the four copies match (Herdr reloads them)
#   2. replaces the repo's layout, theme and mod folders with the live ones, leaving out the
#      files Herdr writes itself (gpui-kit.d.ts, jsconfig.json, *.error)
#   3. runs herdr-app check on every mod in the repo and shows what changed
set -eu

HOME_DIR="${HERDR_APP_HOME:-$HOME/.config/herdr-app}"
REPO="$(cd "$(dirname "$0")" && pwd)"
MODS="garden-chrome garden-spaces garden-agents garden-pane garden-status garden-gallery"

[ -d "$HOME_DIR/mods/garden-agents" ] || { echo "No Code Garden install in $HOME_DIR (set HERDR_APP_HOME?)" >&2; exit 1; }

for m in garden-pane garden-chrome garden-gallery; do
  if ! cmp -s "$HOME_DIR/mods/garden-agents/plant.js" "$HOME_DIR/mods/$m/plant.js"; then
    cp "$HOME_DIR/mods/garden-agents/plant.js" "$HOME_DIR/mods/$m/plant.js"
    echo "plant.js -> $m"
  fi
done

cp "$HOME_DIR/layouts/code-garden.json" "$HOME_DIR/layouts/code-garden.svg" "$REPO/layouts/"
cp "$HOME_DIR/themes/code-garden.json" "$REPO/themes/"
for m in $MODS; do
  rm -rf "$REPO/mods/$m"
  mkdir -p "$REPO/mods/$m"
  for f in "$HOME_DIR/mods/$m"/* "$HOME_DIR/mods/$m"/.[!.]*; do
    [ -e "$f" ] || continue
    case "$(basename "$f")" in gpui-kit.d.ts|jsconfig.json|*.error) continue ;; esac
    cp -R "$f" "$REPO/mods/$m/"
  done
done

failed=0
for m in $MODS; do
  out="$(herdr-app check "$REPO/mods/$m" 2>&1)" || failed=1
  printf '%s\n' "$out" | grep -v WARN | tail -1
done
git -C "$REPO" status --short
[ "$failed" -eq 0 ] || { echo "A check failed: fix it before committing." >&2; exit 1; }
