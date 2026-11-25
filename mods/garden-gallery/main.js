// Every Code Garden plant in every mood, for tuning the art. Open: herdr-app do mod.open --name garden-gallery
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme } from "herdr";
import { plantMood, plantWidth, MOODS, ALL_SPECIES, GROWTH_NAMES } from "./plant.js";

const SPECIES = ALL_SPECIES.map((s) => s.id);
const H = 34;

export default class Gallery extends View {
  render() {
    const t = theme();
    const cols = [...MOODS.map((m) => ({ label: m.label, m: m.id, g: 3 })), ...[0, 1, 2].map((g) => ({ label: GROWTH_NAMES[g], m: "content", g }))];
    return v_flex().size_full().p(12).gap(2).bg(t.popover).text_size(10).text_color(t.dim).overflow_y_scrollbar()
      .child(h_flex().gap(8).child(div().w(70)).children(cols.map((c) => div().w(plantWidth(H)).truncate().child(c.label))))
      .children(SPECIES.map((s) => h_flex().gap(8).items_center()
        .child(div().w(70).text_color(t.muted).child(s))
        .children(cols.map((c) => div().w(plantWidth(H)).h(H).child(plantMood(c.m, H, { species: s, growth: c.g }))))));
  }
}
