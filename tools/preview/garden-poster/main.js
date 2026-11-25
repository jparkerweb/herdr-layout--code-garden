// The poster behind preview.png: a big pixel sky, the title, and the garden cast at 3x size
// (scenes.js is staged with U = 6). The window screenshot is pasted into the dark frame on the
// right. Built by tools/preview/build_preview.py; not part of the layout.
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { plantMood, plantWidth } from "./plant.js";
import { SCENES, drawScene, STRIP_H } from "./scenes.js";

const W = 1600, H = 640;
const px = (x, y, w, h, c) => div().absolute().left(x).top(y).w(w).h(h).bg(c);
const BANDS = ["#2a6db0", "#2f74b6", "#3479bb", "#3a80c0", "#3f86c4", "#458dc8", "#4b93cc", "#529ad0", "#5aa0d4", "#62a7d7", "#6cadda", "#78b5dd"];
const scene = (name, x, y, w) => div().absolute().left(x).top(y).w(w).h(STRIP_H).child(drawScene(SCENES.find((s) => s.name === name), "go", w, 0, true));

function cloud(x, y, s) {
  const c = "#ffffffe6", d = "#e3ecf5";
  return div().absolute().left(x).top(y).w(24 * s).h(10 * s)
    .child(px(6 * s, 0, 8 * s, 3 * s, c)).child(px(2 * s, 3 * s, 18 * s, 3 * s, c)).child(px(0, 6 * s, 24 * s, 3 * s, c)).child(px(2 * s, 8 * s, 20 * s, 2 * s, d));
}

// A pixel hill of grass with flowers.
function hill() {
  const out = [];
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const greens = ["#4F8F3A", "#5E9E45", "#7CC45A", "#6AB04E"];
  for (let x = 0; x < W; x += 6) {
    const h = 10 + Math.floor(rnd() * 16);
    out.push(px(x, 548 - h, 6, h + 2, greens[Math.floor(rnd() * 4)]));
    if (rnd() < 0.08) {
      const c = ["#F27BA5", "#F6C744", "#FFFFFF", "#B9C8F0", "#E0404A"][Math.floor(rnd() * 5)];
      out.push(px(x - 3, 548 - h - 12, 12, 4, c), px(x + 1, 548 - h - 16, 4, 12, c), px(x + 1, 548 - h - 11, 4, 4, "#FFE36A"));
    }
  }
  return out;
}

export default class Poster extends View {
  render() {
    const title = (dx, dy, c) => div().absolute().left(48 + dx).top(54 + dy).text_size(82).font_bold().text_color(c).child("Code Garden");
    const line = (y, plant, text) => h_flex().absolute().left(54).top(y).gap(14).items_center()
      .child(div().w(plantWidth(30)).h(30).child(plantMood("happy", 30, { species: plant, still: true })))
      .child(div().text_size(21).font_semibold().text_color("#ffffff").child(text));
    // The cast along the hill: big potted plants.
    const pots = [["sunflower", "happy", 40], ["cactus", "stab", 160], ["tulips", "happy", 268], ["pothos", "content", 380], ["bonsai", "stab", 486]]
      .map(([sp, m, x]) => div().absolute().left(x).top(548 - 96).w(plantWidth(96)).h(96).child(plantMood(m, 96, { species: sp })));
    return div().relative().w(W).h(H).overflow_hidden()
      .child(v_flex().absolute().left(0).top(0).w(W).h(H).children(BANDS.map((b) => div().w_full().flex_1().bg(b))))
      // sun
      .child(div().absolute().left(604).top(8).w(84).h(84)
        .child(px(24, 0, 36, 84, "#ffe07a")).child(px(0, 24, 84, 36, "#ffe07a")).child(px(8, 8, 68, 68, "#ffe07a")).child(px(24, 16, 18, 12, "#fff6c9")))
      .child(cloud(330, 6, 3)).child(cloud(30, 10, 2))
      // title with a chunky pixel shadow
      .child(title(5, 5, "#1f4d2a")).child(title(0, 0, "#ffffff"))
      .child(div().absolute().left(54).top(156).text_size(24).text_color("#eaf6ff").child("a cozy pixel garden for your coding agents"))
      .child(line(212, "sunflower", "Every agent is a potted plant with a face"))
      .child(line(252, "flytrap", "Plants grow taller the longer agents work"))
      .child(line(292, "lily", "Thirsty plants need you — grab the watering can"))
      .child(line(332, "monstera", "16 plants to pick from · 70 little garden scenes"))
      .child(line(372, "lavender", "Day & night pixel skies"))
      // the garden
      .children(hill())
      .child(px(0, 546, W, H - 546, "#5A3E2B")).child(px(0, 546, W, 6, "#6B4A2E"))
      .children(pots)
      .child(scene("Pumpkin harvest", 560, 548 - STRIP_H + 2, 150))
      .child(scene("Duck family outing", 900, 548 - STRIP_H + 2, 300))
      .child(scene("Bunny found a carrot", 1380, 548 - STRIP_H + 2, 200))
      .child(scene("A gnome goes for a walk", 1240, 548 - STRIP_H + 2, 140))
      .child(scene("Busy bee", 520, 420, 60))
      .child(div().absolute().left(56).top(H - 64).text_size(17).font_semibold().text_color("#F4E9DC").child("a layout for Herdr  ·  herdr.dev/layouts"))
      // the frame the window screenshot goes into (filled in afterwards)
      .child(px(706, 26, 840, 456, "#0f1712"));
  }
}
