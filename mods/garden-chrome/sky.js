// Code Garden: the pixel sky over the sidebar header (follows the local hour) and the grass strip
// along the sidebar footer. Shared with the preview tools in the repo (tools/preview).
import { div } from "gpui-kit";
import { v_flex } from "gpui-base";

// A strip of pixel grass with the odd flower, drawn once: blade heights come from a fixed seed.
const GRASS = (() => {
  const out = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const greens = ["#4F8F3A", "#5E9E45", "#7CC45A", "#6AB04E"];
  for (let x = 0; x < 520; x += 3) {
    const h = 4 + Math.floor(rnd() * 9);
    out.push([x, 14 - h, 3, h, greens[Math.floor(rnd() * greens.length)]]);
    if (rnd() < 0.07) {
      const petal = ["#F27BA5", "#F6C744", "#B9C8F0", "#FFFFFF"][Math.floor(rnd() * 4)];
      out.push([x, 14 - h - 4, 3, 3, petal], [x + 1, 14 - h - 1, 1, 1, "#5E9E45"]);
    }
  }
  return out;
})();
const grass = () => div().relative().w_full().h(16).flex_none().overflow_hidden()
  .children(GRASS.map(([x, y, w, h, c]) => div().absolute().left(x).top(y).w(w).h(h).bg(c)))
  // A little butterfly drifting along the grass.
  .child(div().absolute().left(0).top(0).w(8).h(16)
    .child(div().absolute().left(0).top(0).w(8).h(6)
      .child(div().absolute().left(0).top(0).w(3).h(3).bg("#F6C744").loop("opacity", { from: 0.5, to: 1, period: 260 }))
      .child(div().absolute().left(5).top(0).w(3).h(3).bg("#F6C744").loop("opacity", { from: 1, to: 0.5, period: 260 }))
      .child(div().absolute().left(3).top(1).w(2).h(4).bg("#3B2618"))
      .loop("top", { from: -1, to: 3, period: 900, easing: "ease-in-out" }))
    .loop("left", { from: 10, to: 220, period: 14000, easing: "ease-in-out" }));

// ---- The sky over the garden: pixel bands that follow the local time of day.
const SKIES = {
  night: { bands: ["#0b1026", "#0f1631", "#131c3b", "#172245", "#1b2850", "#20305a"] },
  dawn: { bands: ["#2b2d5c", "#4a3c6e", "#7a4f78", "#b0607a", "#d97c6f", "#eea36f"] },
  day: { bands: ["#2a6db0", "#3479bb", "#3f86c4", "#4b93cc", "#5aa0d4", "#6cadda"] },
  dusk: { bands: ["#1f1d48", "#3b2a5e", "#653871", "#9a4670", "#cc5d5e", "#e8875a"] },
};
function skyNow(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}
const px = (x, y, w, h, c) => div().absolute().left(x).top(y).w(w).h(h).bg(c);
const STARS = [[12, 6], [34, 18], [58, 8], [83, 26], [101, 5], [126, 15], [149, 30], [171, 9], [192, 21], [214, 6], [236, 28], [252, 12], [70, 38], [140, 42]];
function cloud(x, y, period, from, to) {
  const c = "#ffffff70", s = "#ffffff40";
  return div().absolute().left(0).top(0).w(400).h(60)
    .child(div().absolute().left(x).top(y).w(24).h(10)
      .child(px(6, 0, 8, 3, c)).child(px(2, 3, 18, 3, c)).child(px(0, 6, 24, 3, c)).child(px(2, 8, 20, 2, s)))
    .loop("left", { from, to, period, easing: "linear" });
}
function skyLayer(kind) {
  const sky = SKIES[kind];
  let layer = div().absolute().left(0).top(0).right(0).bottom(0).overflow_hidden()
    .child(v_flex().absolute().left(0).top(0).right(0).bottom(0).children(sky.bands.map((b) => div().w_full().flex_1().bg(b))));
  if (kind === "night") {
    layer = layer.children(STARS.map(([x, y], i) => px(x, y, i % 3 ? 1.5 : 2, i % 3 ? 1.5 : 2, "#f4f1d0").loop("opacity", { from: 0.15, to: 1, period: 900 + (i * 377) % 1700, easing: "ease-in-out" })));
    // A crescent moon.
    layer = layer.child(div().absolute().left(168).top(8).w(12).h(12)
      .child(px(3, 0, 6, 2, "#f4ecc2")).child(px(1, 2, 4, 8, "#f4ecc2")).child(px(3, 10, 6, 2, "#f4ecc2")).child(px(0, 4, 2, 4, "#f4ecc2"))
      .child(px(5, 2, 2, 2, "#d9cf9c")).child(px(5, 8, 2, 2, "#d9cf9c")));
    // A firefly or two over the grass line.
    layer = layer.child(px(40, 40, 2, 2, "#e8f58a").loop("opacity", { from: 0, to: 1, period: 1300 }));
    layer = layer.child(px(120, 34, 2, 2, "#e8f58a").loop("opacity", { from: 1, to: 0, period: 1700 }));
  } else {
    const low = kind !== "day";
    const sunY = low ? 28 : 7;
    const sunC = low ? "#ffb25c" : "#ffe07a";
    const rays = div().absolute().left(0).top(0).w(400).h(60)
      .child(px(171, sunY - 4, 2, 2, sunC)).child(px(171, sunY + 14, 2, 2, sunC))
      .child(px(162, sunY + 5, 2, 2, sunC)).child(px(180, sunY + 5, 2, 2, sunC))
      .loop("opacity", { from: 0.3, to: 1, period: 1600, easing: "ease-in-out" });
    layer = layer.child(rays)
      .child(div().absolute().left(166).top(sunY).w(12).h(12)
        .child(px(3, 0, 6, 12, sunC)).child(px(0, 3, 12, 6, sunC)).child(px(1, 1, 10, 10, sunC)).child(px(3, 2, 3, 2, "#fff6c9")));
    layer = layer.child(cloud(20, 8, 46000, -60, 220)).child(cloud(120, 22, 61000, -140, 140));
  }
  return layer;
}

export { grass, skyLayer, skyNow, SKIES };
