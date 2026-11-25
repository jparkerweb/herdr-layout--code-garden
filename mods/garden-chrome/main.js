// Code Garden — derived from Herdr's shipped `workspace-chrome` mod (Apache-2.0, https://herdr.dev), modified for this layout.
import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, run, props, window, shared, setShared, updates, layout } from "herdr";
import { plantMood, plantWidth } from "./plant.js";
import { SCENES, drawScene, sceneLength, STRIP_H } from "./scenes.js";

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

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  // Mods edited before the rail went by width still read the flag.
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 268) : window()?.platform === "macos" ? 76 : 44 });
}


// ---- The sky over the garden: pixel bands that follow the local time of day.
const SKIES = {
  night: { bands: ["#0b1026", "#0f1631", "#131c3b", "#172245", "#1b2850", "#20305a"], hello: "night garden" },
  dawn: { bands: ["#2b2d5c", "#4a3c6e", "#7a4f78", "#b0607a", "#d97c6f", "#eea36f"], hello: "good morning, gardener" },
  day: { bands: ["#2a6db0", "#3479bb", "#3f86c4", "#4b93cc", "#5aa0d4", "#6cadda"], hello: "sunny afternoon" },
  dusk: { bands: ["#1f1d48", "#3b2a5e", "#653871", "#9a4670", "#cc5d5e", "#e8875a"], hello: "evening glow" },
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

export default class WorkspaceChrome extends View {
  init(_props, cx) {
    // The sky changes with the hour: look again each minute (data, not animation).
    this.sky = skyNow();
    if (props()?.footer) return;
    cx.timer.every(60000, (cx) => { const k = skyNow(); if (k !== this.sky) { this.sky = k; cx.notify(); } });
    // Garden scenes: one plays at random every few minutes (the first soon after start).
    this.play = 0;
    this.waiting = 0;
    this.stripW = 150;
    this.queue = [];
    this.later(6000, cx);
  }

  // The next scene in a shuffled deck, so all of them come round before any repeats.
  pick() {
    if (!this.queue.length) this.queue = SCENES.map((_, i) => i).sort(() => Math.random() - 0.5);
    return SCENES[this.queue.pop()];
  }

  later(ms, cx) {
    const token = ++this.waiting;
    cx.timer.after(ms, (cx) => { if (token === this.waiting) this.start(cx); });
  }

  // start -> (a moment) go -> (its length) out -> (a fade) gone, then wait 2 to 4 minutes.
  start(cx) {
    const play = ++this.play;
    this.scene = this.pick();
    this.phase = "start";
    cx.notify();
    const still = (cx) => play === this.play;
    cx.timer.after(120, (cx) => { if (!still(cx)) return; this.phase = "go"; cx.notify(); });
    cx.timer.after(120 + sceneLength(this.scene), (cx) => { if (!still(cx)) return; this.phase = "out"; cx.notify(); });
    cx.timer.after(900 + sceneLength(this.scene), (cx) => {
      if (!still(cx)) return;
      this.scene = null;
      cx.notify();
      this.later(120000 + Math.random() * 120000, cx);
    });
  }

  button(id, label, action) {
    const t = theme();
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.muted).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }
  render() {
    const t = theme();
    const collapsed = narrow();
    if (props()?.footer) {
      const row = (id, icon, label, dim, action) => h_flex().id(id).h(28).px(8).gap(9).items_center().rounded(8)
        .when(collapsed, el => el.relative().w(32).px(0).justify_center().tooltip(label))
        .text_color(dim ? t.dim : t.muted).hover(s => s.bg(t.hover).text_color(t.foreground)).cursor_pointer()
        .on_click(action).child(svg(`mods/garden-chrome/${icon}.svg`).size(14))
        .when(!collapsed, el => el.child(label));
      const ready = div().size(6).rounded_full().bg(t.accent);
      return v_flex().size_full().bg(t.chrome).px(8).pb(8).text_size(13)
        .child(div().mx(-8).child(grass()))
        .child(div().mx(-8).h(2).mb(4).bg("#3D2A1E"))
        .when(collapsed, el => el.px(0).items_center())
        .child(row("settings", "settings", "Settings", false, () => run("app.settings"))
          .when(Boolean(updates().app.ready), el => el.child(collapsed ? ready.absolute().top(5).right(6) : ready)))
        .child(row("machine", "plus", "Add machine", true, () => run("mod.open", { name: "machine-add" })));
    }
    const kind = this.sky ?? skyNow();
    const onSky = "#ffffff";
    const skyButton = (id, icon, action) => div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(3)
      .text_color("#ffffffcc").hover((s) => s.bg("#ffffff26").text_color(onSky))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(svg(`mods/garden-chrome/${icon}.svg`).size(15));
    return h_flex().relative().size_full().overflow_hidden().bg(t.chrome)
      .child(skyLayer(kind))
      .child(h_flex().relative().size_full().pl(collapsed ? 6 : 12).pr(10).gap(4).items_center().text_size(13.5)
        .when(window()?.platform === "macos" && !window()?.fullscreen && !collapsed, el => el.pl(76))
        .when(!collapsed, el => el.child(h_flex().flex_1().gap(8).items_center()
          .child(div().flex_none().w(plantWidth(36)).h(36).child(plantMood(kind === "night" ? "snooze" : "content", 36, { species: "sprout" })))
          .child(v_flex().flex_1().min_w(0).gap(1)
            .child(div().text_size(14).font_semibold().text_color(onSky).child("Code Garden"))
            // The scene strip: click it to play another scene now.
            .child(div().id("scene-strip").w_full().min_w(0).h(STRIP_H).relative().overflow_hidden().cursor_pointer()
              .tooltip(this.scene ? this.scene.name : "Click for a garden scene")
              .on_size_change((size, cx) => { const w = Math.max(40, Math.min(420, size.width)); if (Math.abs(w - this.stripW) > 1) { this.stripW = w; cx.notify(); } })
              .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
              .on_click((_e, cx) => { this.waiting++; this.start(cx); })
              .when(Boolean(this.scene), (el) => el.child(drawScene(this.scene, this.phase, this.stripW, this.play)))))))
        .when(!collapsed, el => el.child(skyButton("search", "search", () => run("mod.open", { name: "picker" }))))
        // On the macOS rail the traffic lights fill the row; the agents list's » unfolds it.
        .when(!(collapsed && window()?.platform === "macos"), el => el.child(skyButton("sidebar-toggle", "sidebar", toggleSidebar))));
  }
}
