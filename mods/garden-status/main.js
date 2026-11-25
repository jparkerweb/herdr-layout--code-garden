// Code Garden — derived from Herdr's shipped `workspace-status` mod (Apache-2.0, https://herdr.dev), modified for this layout.
// Code Garden status bar: where you are, then a garden bed with one tiny sprout per agent
// (coloured by how it's doing), then a plant count and the palette hint.

import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, theme, run, window, keys } from "herdr";

// A 9x10 sprout: two leaves on a stem. Working ones sway, thirsty ones blink.
function sprout(t, a, i) {
  const c = t[a.status] ?? t.idle ?? t.dim;
  const leaves = div().absolute().left(0).top(0).w(9).h(6)
    .child(div().absolute().left(0).top(1).w(4).h(3).bg(c))
    .child(div().absolute().left(5).top(0).w(4).h(3).bg(c))
    .child(div().absolute().left(4).top(2).w(1).h(4).bg("#5E9E45"));
  const moving = a.status === "working"
    ? leaves.loop("left", { from: -0.6, to: 0.6, period: 700 + (i % 3) * 120, easing: "ease-in-out" })
    : a.status === "blocked"
      ? leaves.loop("opacity", { from: 0.35, to: 1, period: 600, easing: "linear" })
      : leaves;
  return div().id(`bed-${a.address}`).relative().w(9).h(10).flex_none()
    .tooltip(`${a.space_name || a.program?.name || a.address}: ${a.status}`)
    .on_click(() => run("pane.focus", { pane: a.pane }))
    .child(moving)
    .child(div().absolute().left(4).top(6).w(1).h(3).bg("#5E9E45"))
    .child(div().absolute().left(0).top(9).w(9).h(1).bg("#5A3E2B"));
}

export default class GardenStatus extends View {
  // The palette key as actually bound, not a hardcoded one.
  hint() {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key}  commands` : "commands";
  }

  render() {
    const t = theme();
    const space = spaces().find((s) => s.active);
    const list = agents();
    const count = (s) => list.filter((a) => a.status === s).length;
    const thirsty = count("blocked");
    const growing = count("working");
    const bloomed = count("done");
    const label = (icon, text) => h_flex().gap(6).items_center().child(svg(`mods/workspace-chrome/${icon}.svg`).size(13)).child(text);
    const tally = [
      `${list.length} ${list.length === 1 ? "plant" : "plants"}`,
      growing && `${growing} growing`,
      bloomed && `${bloomed} bloomed`,
    ].filter(Boolean).join(" · ");
    return h_flex().size_full().px(14).gap(16).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(label(space?.machine ? "server" : "monitor", space?.machine ?? "This computer"))
      .when(Boolean(space?.branch), (el) => el.child(label("branch", space.branch)))
      .when(list.length > 0, (el) => el.child(h_flex().gap(3).items_end().h(12).children(list.slice(0, 24).map((a, i) => sprout(t, a, i)))))
      .child(h_flex().gap(6).items_center().child(tally)
        .when(thirsty > 0, (el) => el.child(div().text_color(t.blocked).child(`· ${thirsty} thirsty, ${thirsty === 1 ? "needs" : "need"} you`))))
      .child(div().flex_1())
      .child(div().id("palette").text_color(t.dim).on_click(() => run("app.palette")).child(this.hint()));
  }
}
