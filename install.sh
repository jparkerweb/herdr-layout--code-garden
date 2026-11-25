#!/usr/bin/env sh
# Installs Code Garden into Herdr (macOS / Linux / Git Bash).
#   ./install.sh            install; refuses to touch anything that already exists
#   ./install.sh --update   replace an earlier Code Garden install with this one
#   ./install.sh --no-switch  install without switching to the layout
set -eu

HOME_DIR="${HERDR_APP_HOME:-$HOME/.config/herdr-app}"
SRC="$(cd "$(dirname "$0")" && pwd)"
MODS="garden-chrome garden-spaces garden-agents garden-pane garden-status garden-gallery"
UPDATE=0
SWITCH=1
for arg in "$@"; do
  case "$arg" in
    --update) UPDATE=1 ;;
    --no-switch) SWITCH=0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [ ! -d "$HOME_DIR" ]; then
  echo "Herdr's home folder isn't at $HOME_DIR. Start Herdr once, or set HERDR_APP_HOME." >&2
  exit 1
fi

TARGETS="layouts/code-garden.json layouts/code-garden.svg themes/code-garden.json"
for m in $MODS; do TARGETS="$TARGETS mods/$m"; done

if [ "$UPDATE" -eq 0 ]; then
  taken=""
  for t in $TARGETS; do [ -e "$HOME_DIR/$t" ] && taken="$taken $t"; done
  if [ -n "$taken" ]; then
    echo "These already exist in $HOME_DIR:" >&2
    for t in $taken; do echo "  $t" >&2; done
    echo "If they're an earlier Code Garden, run: ./install.sh --update" >&2
    exit 1
  fi
fi

mkdir -p "$HOME_DIR/layouts" "$HOME_DIR/themes" "$HOME_DIR/mods"
cp "$SRC/layouts/code-garden.json" "$SRC/layouts/code-garden.svg" "$HOME_DIR/layouts/"
cp "$SRC/themes/code-garden.json" "$HOME_DIR/themes/"
for m in $MODS; do
  rm -rf "$HOME_DIR/mods/$m"
  cp -R "$SRC/mods/$m" "$HOME_DIR/mods/$m"
done
echo "Copied Code Garden into $HOME_DIR"

if command -v herdr-app >/dev/null 2>&1; then
  for m in $MODS; do herdr-app check "$HOME_DIR/mods/$m"; done
  if [ "$SWITCH" -eq 1 ]; then
    herdr-app do layout.switch --name code-garden >/dev/null && echo "Switched to Code Garden. Ctrl+Shift+L cycles layouts."
  fi
else
  echo "herdr-app isn't on PATH: switch to \"Code Garden\" in Herdr's settings (Look) or with Ctrl+Shift+L."
fi
