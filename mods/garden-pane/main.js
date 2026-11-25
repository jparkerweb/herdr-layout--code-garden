// Code Garden — derived from Herdr's shipped `pane` mod (Apache-2.0, https://herdr.dev), modified for this layout.
// Code Garden pane header: each agent pane shows its potted plant, its species and how it's doing.
// A pane's header, for layouts that frame their panes:
//   { "tab": "active", "pane": { "header": { "content": { "mod": "garden-pane" } } } }
// Shows the program's icon (the app's program table), the agent's name or
// the terminal's title, the folder, and the agent's status; buttons split, zoom and close
// this pane. Props from the app: { pane, terminal }. Click: focus the pane.

import { View, div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { panes, props, run, theme, home, layout, shared, openOverlay, closeOverlay } from "herdr";
import { plantOf, plantMood, plantWidth, mood, chosenSpecies, choosePlant, roleOf, plantPicker, wateringCan, growthOf } from "./plant.js";

const MONO = "JetBrains Mono";
// Notched-corner pixel box: the colour drawn as two overlapping rects.
const notch = (c) => [
  div().absolute().left(2).right(2).top(0).bottom(0).bg(c),
  div().absolute().left(0).right(0).top(2).bottom(2).bg(c),
];
const frameLines = (c) => [
  div().absolute().left(1).right(1).top(0).h(1).bg(c),
  div().absolute().left(1).right(1).bottom(0).h(1).bg(c),
  div().absolute().left(0).top(1).bottom(1).w(1).bg(c),
  div().absolute().right(0).top(1).bottom(1).w(1).bg(c),
];
const chip = (text, color, iconEl) => h_flex().flex_none().gap(5).px(7).h(20).items_center().relative()
  .children(notch(color + "22")).children(frameLines(color + "66"))
  .font_family(MONO).font_bold().text_size(9.5).text_color(color)
  .when(Boolean(iconEl), el => el.child(iconEl))
  .child(text.toUpperCase());
const bang = (c) => div().relative().flex_none().w(4).h(10)
  .children([div().absolute().left(1).top(0).w(2).h(6).bg(c), div().absolute().left(1).top(8).w(2).h(2).bg(c)]);
// Three little growth bars, rising and falling.
const bars = (c) => h_flex().w(10).h(10).flex_none().items_end().gap(1)
  .children([0, 1, 2].map((i) => div().w(2).h(10).bg(c).loop("height", { from: 3, to: 10, period: 560 + i * 130, easing: "ease-in-out" })));
const tick = (c) => div().relative().flex_none().w(10).h(10)
  .children([[0, 6], [2, 8], [4, 6], [6, 4], [8, 2]].map(([x, y]) => div().absolute().left(x).top(y - 2).w(2).h(4).bg(c)));
const ROLE = (p, isAgent) => (isAgent ? roleOf(chosenSpecies(p.terminal, p.program?.key)) : p.program?.shell ? "Garden Shed" : (p.program?.name ?? "Tool"));

// Match the first visible tab frame, including the active child of a stack.
function paneFrame(node) {
  if (!node || node.hidden) return null;
  if (node.content?.tab && node.content.pane) return node.content.pane;
  let children = node.children ?? [];
  if (node.type === "stack") {
    const visible = children.filter(child => !child.hidden);
    children = [visible.find(child => child.id === node.active) ?? visible[0]];
  }
  for (const child of children) {
    const frame = paneFrame(child);
    if (frame) return frame;
  }
  return null;
}

function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

function folder(cwd) {
  if (!cwd) return "";
  const h = home();
  return cwd === h ? "~" : cwd.startsWith(h + "/") ? "~" + cwd.slice(h.length) : cwd;
}

export default class Pane extends View {
  init() { this.hovered = false; }

  me() {
    return panes().find((p) => p.pane === props()?.pane);
  }

  button(t, id, icon, command, args) {
    return div()
      .id(id)
      .p(3)
      .rounded(4)
      .text_color(t.dim)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => {
        cx.stop_propagation();
        run(command, args);
      })
      .child(svg(`mods/garden-pane/${icon}.svg`).size(14));
  }

  render(cx) {
    const t = theme();
    if (props()?.plantPicker) {
      const { plantPicker: address, key, overlay } = props();
      return plantPicker(t, { current: (shared("garden.plants") ?? {})[address] ?? null, auto: plantOf(key).species, growth: growthOf(address),
        onPick: (species) => { choosePlant(address, species); closeOverlay(overlay); } });
    }
    const p = this.me();
    if (!p) return div();
    const name = p.name || ((p.program?.agent || p.program?.shell) && p.program.name) || p.title || p.program?.name || "shell";
    const st = p.status;
    const pane = p.pane;
    const bottom = paneFrame(layout())?.header?.position === "bottom";
    const isAgent = Boolean(p.program?.agent || st);
    const species = isAgent ? chosenSpecies(p.terminal, p.program?.key) : null;
    const H = 30;
    // Shells get a little wooden garden sign instead of a plant.
    const avatar = species
      ? div().flex_none().w(plantWidth(H)).h(H)
          .child(plantMood(mood(st ?? "idle"), H, { species, growth: growthOf(p.terminal) }))
      : div().flex_none().w(26).h(26).relative()
          .child(div().absolute().left(11).top(16).w(4).h(10).bg("#7A5236"))
          .child(div().absolute().left(1).top(2).w(24).h(15).bg("#B5835A"))
          .child(div().absolute().left(2).top(3).w(22).h(1).bg("#D6A77A"))
          .child(div().absolute().left(1).top(15).w(24).h(2).bg("#8C6243"))
          .child(div().absolute().left(0).top(2).w(26).h(15).flex().items_center().justify_center()
            .font_family(MONO).font_bold().text_size(9).text_color("#3B2618").child(">_"));
    const working = t.working ?? "#7cc4f0";
    const status = st === "working" ? chip("growing", working, bars(working))
      : st === "blocked" ? chip("thirsty · needs you", t.blocked, wateringCan(t.blocked, true))
      : st === "done" ? chip("bloomed", t.done, tick(t.done))
      : species ? chip("resting", t.dim) : null;
    const leaf = t.accent;
    // The plant badge: click it to choose another plant for this agent.
    const role = div().id(`ph-badge-${pane}`).flex_none().px(6).h(18).flex().items_center().gap(4).relative()
      .when(isAgent, (el) => el.cursor_pointer().tooltip("Choose a plant").hover((s) => s.opacity(0.8))
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .on_click((_e, cx) => {
          cx.stop_propagation();
          openOverlay({ mod: "garden-pane", kind: "popup", width: 392, height: 372, props: { plantPicker: p.terminal, key: p.program?.key ?? null } });
        }))
      .children(notch(leaf + "22")).children(frameLines(leaf + "66"))
      .font_family(MONO).font_bold().text_size(9.5).text_color(leaf).child(ROLE(p, isAgent).toUpperCase())
      .when(isAgent, (el) => el.child(svg("mods/workspace-chrome/chevron-down.svg").size(9).flex_none().text_color(leaf)));
    return h_flex()
      .id(`pane-head-${pane}`)
      .size_full()
      .px(10)
      .gap(9)
      .items_center()
      .bg(t.background)
      .when(bottom, el => el.border_t(1))
      .when(!bottom, el => el.border_b(1))
      .border_color(t.border)
      .text_size(12)
      .on_hover((hovered, cx) => { this.hovered = hovered; cx.notify(); })
      .on_click(() => run("pane.focus", { pane }))
      .child(avatar)
      .child(div().flex_none().truncate().max_w(220).font_family(MONO).font_bold().text_color(t.foreground).child(name))
      .child(role)
      .child(div().flex_1().truncate().font_family(MONO).text_size(11).text_color(t.dim).child(folder(p.cwd)))
      .when(Boolean(status), el => el.child(status))
      .when(this.hovered, el => el
        .child(this.button(t, `ph-r-${pane}`, "split-right", "pane.split", { direction: "right", pane }))
        .child(this.button(t, `ph-d-${pane}`, "split-down", "pane.split", { direction: "down", pane }))
        .child(this.button(t, `ph-z-${pane}`, p.zoomed ? "unzoom" : "zoom", "pane.zoom", { pane }))
        .child(this.button(t, `ph-x-${pane}`, "close", "pane.close", { pane })));
  }
}
