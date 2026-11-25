// Code Garden — derived from Herdr's shipped `workspace-chrome` mod (Apache-2.0, https://herdr.dev), modified for this layout.
import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, run, props, window, shared, setShared, updates, layout } from "herdr";
import { plantMood, plantWidth } from "./plant.js";
import { SCENES, drawScene, sceneLength, STRIP_H } from "./scenes.js";
import { grass, skyLayer, skyNow } from "./sky.js";

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
