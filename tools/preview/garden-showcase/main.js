// The staged window inside preview.png: the real plant, scene and sky art with made-up
// projects, so no real work shows. Built into Herdr by tools/preview/build_preview.py
// (which copies plant.js, scenes.js and sky.js in beside this file); not part of the layout.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme } from "herdr";
import { plantMood, plantWidth, roleOf, wateringCan, ALL_SPECIES } from "./plant.js";
import { SCENES, drawScene, STRIP_H } from "./scenes.js";
import { grass, skyLayer } from "./sky.js";

const MONO = "JetBrains Mono";
const icon = (name, size = 13) => svg(`mods/workspace-chrome/${name}.svg`).size(size).flex_none();

export default class Showcase extends View {
  render() {
    const t = theme();
    const scene = SCENES.find((s) => s.name === "Pumpkin harvest");

    const header = h_flex().relative().h(58).flex_none().overflow_hidden()
      .child(skyLayer("day"))
      .child(h_flex().relative().size_full().pl(12).pr(10).gap(8).items_center()
        .child(div().flex_none().w(plantWidth(36)).h(36).child(plantMood("content", 36, { species: "sprout" })))
        .child(v_flex().flex_1().min_w(0).gap(1)
          .child(div().text_size(14).font_semibold().text_color("#ffffff").child("Code Garden"))
          .child(div().relative().w_full().h(STRIP_H).overflow_hidden().child(drawScene(scene, "go", 150, 0, true))))
        .child(div().text_color("#ffffffcc").child(icon("search", 15)))
        .child(div().ml(8).text_color("#ffffffcc").child(icon("sidebar", 15))));

    const space = (letter, color, name, tail, on) => h_flex().h(40).px(8).gap(9).items_center().rounded(4)
      .when(on, (el) => el.bg(t.selected))
      .child(h_flex().size(18).flex_none().rounded(2).bg(color).items_center().justify_center().text_size(10.5).font_bold().text_color("#ffffff").child(letter))
      .child(v_flex().flex_1().min_w(0)
        .child(div().text_size(13).line_height("17px").text_color(t.foreground).child(name))
        .child(div().text_size(11).line_height("14px").text_color(t.dim).child(tail)));

    const section = (label, color, n) => h_flex().px(8).pt(8).h(28).gap(6).items_center().text_size(11).font_medium()
      .child(div().text_color(color).child(label)).child(div().text_color(t.dim).child(String(n)));

    const agent = (species, m, growth, name, sub, right, focused = false) => h_flex().h(42).px(6).gap(9).items_center().rounded(4)
      .when(focused, (el) => el.bg(t.selected))
      .child(div().flex_none().w(plantWidth(32)).h(32).child(plantMood(m, 32, { species, growth })))
      .child(v_flex().flex_1().min_w(0)
        .child(div().text_size(13).line_height("17px").text_color(t.foreground).child(name))
        .child(div().text_size(11).line_height("14px").text_color(t.dim).child(sub)))
      .child(right);
    const time = (s) => div().text_size(11).text_color(t.dim).child(s);
    const water = h_flex().gap(4).px(6).h(20).rounded(2).bg(t.blocked + "33").items_center().text_size(10.5).font_semibold().text_color(t.blocked)
      .child(wateringCan(t.blocked, true)).child("Water");
    const bars = () => h_flex().w(14).h(14).items_end().gap(1).children([0, 1, 2].map((i) => div().w(2).h(10).bg(t.working).loop("height", { from: 3, to: 10, period: 600 + i * 140 })));
    const dot = (c) => div().size(7).mx(3).rounded(4).bg(c);
    const ring = div().size(7).mx(3).rounded(4).border(1.5).border_color(t.idle);

    const sidebar = v_flex().w(280).h_full().flex_none().bg(t.chrome).border_r(1).border_color(t.border).text_size(13)
      .child(header)
      .child(h_flex().h(31).pl(16).pr(10).items_center().justify_between().text_size(11.5).text_color(t.dim).child("Spaces").child(icon("plus", 14)))
      .child(v_flex().px(8)
        .child(space("A", "#22a99a", "api-server", "feature/login-flow ↑2", true))
        .child(space("W", "#e3814f", "web-app", "checkout-refactor"))
        .child(space("D", "#5b8def", "docs", "release-notes ↓1")))
      .child(div().h(14))
      .child(h_flex().h(41).px(16).pt(10).items_center().border_t(1).border_color(t.border).gap(6)
        .child(div().text_size(11.5).font_semibold().text_color(t.muted).child("Garden")))
      .child(v_flex().px(8)
        .child(section("Needs you", t.blocked, 1))
        .child(agent("sunflower", "angry", 3, "api-server", "Fix the login redirect", water, true))
        .child(section("Growing", t.working, 2))
        .child(agent("cactus", "stab", 2, "web-app", "Refactor the checkout flow", h_flex().gap(8).items_center().child(time("6m")).child(bars())))
        .child(agent("bonsai", "stab", 1, "web-app", "Bonsai · Sprouting", h_flex().gap(8).items_center().child(time("1m")).child(bars())))
        .child(section("Bloomed", t.done, 1))
        .child(agent("tulips", "happy", 3, "docs", "Write the release notes", h_flex().gap(8).items_center().child(time("2m")).child(dot(t.done))))
        .child(section("Resting", t.dim, 1))
        .child(agent("monstera", "snooze", 3, "api-server", "Monstera · Full grown", h_flex().gap(8).items_center().child(time("3m")).child(ring))))
      .child(div().flex_1())
      .child(grass())
      .child(div().h(2).bg("#3D2A1E"))
      .child(v_flex().px(8).py(6).text_color(t.muted)
        .child(h_flex().h(26).px(8).gap(9).items_center().child(icon("settings", 14)).child("Settings"))
        .child(h_flex().h(26).px(8).gap(9).items_center().text_color(t.dim).child(icon("plus", 14)).child("Add machine")));

    const chip = (text, color, el) => h_flex().gap(5).px(7).h(20).items_center().bg(color + "22").border(1).border_color(color + "66")
      .font_family(MONO).font_bold().text_size(9.5).text_color(color).when(Boolean(el), (x) => x.child(el)).child(text.toUpperCase());
    const line = (c, s) => div().font_family(MONO).text_size(13).line_height("21px").text_color(c).child(s);
    const pane = v_flex().flex_1().h_full().bg(t.background).border(2).border_color(t.accent).rounded(4).overflow_hidden()
      .child(h_flex().h(38).flex_none().px(10).gap(9).items_center().border_b(1).border_color(t.border)
        .child(div().flex_none().w(plantWidth(30)).h(30).child(plantMood("angry", 30, { species: "sunflower" })))
        .child(div().font_family(MONO).font_bold().text_size(12).text_color(t.foreground).child("Claude Code"))
        .child(h_flex().gap(4).px(6).h(18).items_center().bg(t.accent + "22").border(1).border_color(t.accent + "66")
          .font_family(MONO).font_bold().text_size(9.5).text_color(t.accent).child(roleOf("sunflower").toUpperCase()).child(icon("chevron-down", 9)))
        .child(div().flex_1().font_family(MONO).text_size(11).text_color(t.dim).child("~/code/api-server"))
        .child(chip("thirsty · needs you", t.blocked, wateringCan(t.blocked, true))))
      .child(v_flex().p(16).gap(0)
        .child(line(t.ansi2, "❯ fix the login redirect after sign-in"))
        .child(line(t.muted, ""))
        .child(line(t.foreground, "● I traced it to the session cookie being set after the redirect."))
        .child(line(t.foreground, "  Two ways to fix it:"))
        .child(line(t.ansi3, "  1. Set the cookie before redirecting (recommended)"))
        .child(line(t.ansi4, "  2. Redirect from the client once the session is ready"))
        .child(line(t.muted, ""))
        .child(line(t.ansi5, "  Which one should I use?  [1/2]")));

    // The greenhouse: every plant on wooden shelves, each in a different mood.
    const MOODS = ["happy", "stab", "content", "happy", "snooze", "stab", "happy", "content"];
    const shelf = (list, row) => v_flex().gap(0)
      .child(h_flex().px(22).gap(6).items_end().justify_between().children(list.map((sp, i) =>
        div().flex_none().w(plantWidth(46)).h(46).child(plantMood(MOODS[(i + row * 3) % MOODS.length], 46, { species: sp.id })))))
      .child(div().h(6).mx(6).bg("#9A6B45")).child(div().h(3).mx(6).bg("#6B4A2E"))
      .child(h_flex().mx(14).justify_between().child(div().w(4).h(10).bg("#6B4A2E")).child(div().w(4).h(10).bg("#6B4A2E")));
    const greenhouse = v_flex().w(330).h_full().flex_none().bg(t.background).border(1).border_color(t.border).rounded(4).overflow_hidden()
      .child(h_flex().h(38).flex_none().px(12).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_family(MONO).font_bold().text_size(12).text_color(t.foreground).child("Greenhouse"))
        .child(div().font_family(MONO).text_size(11).text_color(t.dim).child("16 plants to pick from")))
      .child(v_flex().flex_1().justify_around().py(6)
        .child(shelf(ALL_SPECIES.slice(0, 4), 0))
        .child(shelf(ALL_SPECIES.slice(4, 8), 1))
        .child(shelf(ALL_SPECIES.slice(8, 12), 2))
        .child(shelf(ALL_SPECIES.slice(12, 16), 3)));

    const tabs = h_flex().h(42).flex_none().px(10).gap(6).items_center().bg(t.canvas)
      .child(h_flex().h(28).px(10).gap(6).items_center().rounded(6).bg(t.raised).text_size(12.5).text_color(t.foreground).child("Claude Code"))
      .child(h_flex().h(28).px(10).items_center().rounded(6).text_size(12.5).text_color(t.muted).child("server logs"));

    const status = h_flex().h(28).flex_none().px(14).gap(16).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(h_flex().gap(6).items_center().child(icon("monitor")).child("This computer"))
      .child(h_flex().gap(6).items_center().child(icon("branch")).child("feature/login-flow"))
      .child(h_flex().gap(3).items_end().children([t.blocked, t.working, t.working, t.done, t.idle].map((c) => div().relative().w(9).h(10)
        .child(div().absolute().left(0).top(1).w(4).h(3).bg(c)).child(div().absolute().left(5).top(0).w(4).h(3).bg(c))
        .child(div().absolute().left(4).top(2).w(1).h(7).bg("#5E9E45")).child(div().absolute().left(0).top(9).w(9).h(1).bg("#5A3E2B")))))
      .child(div().child("5 plants · 2 growing · 1 bloomed"))
      .child(div().text_color(t.blocked).child("· 1 thirsty, needs you"))
      .child(div().flex_1())
      .child(div().text_color(t.dim).child("Ctrl+Shift+P  commands"));

    return h_flex().size_full().bg(t.canvas)
      .child(sidebar)
      .child(v_flex().flex_1().h_full().child(tabs).child(h_flex().flex_1().p(8).gap(8).child(pane).child(greenhouse)).child(status));
  }
}
