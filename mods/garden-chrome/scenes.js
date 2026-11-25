// Little garden scenes that play under "Code Garden": worms, gnomes, wheelbarrows...
//
// A scene is a cast of actors. An actor is a sprite (one or more pixel-map parts) that either
// crosses the strip (one way, a native .transition on `left`) or stays put at a spot while it
// fades in, does its thing (native .loop), and fades out. Nothing here runs a timer: the header
// re-renders a few times per scene (start, go, out) and GPUI does the motion.
//
// Pixel maps: one char per pixel, "." is empty, the palette maps chars to colours.
// Sprites face right; an actor going left is mirrored. The strip is ROWS pixels tall and
// sprites stand on its bottom edge unless lifted with `y`.

import { div } from "gpui-kit";

export const U = 2;       // px per sprite pixel
export const ROWS = 11;   // strip height in sprite pixels
export const STRIP_H = ROWS * U;

// ---- palette
const K = "#2A1A14", W = "#F4F1E8", SKIN = "#F1C49B", PINK = "#F49AA8", Y = "#F6C744", R = "#E0404A";
const G = "#6DBE5A", GL = "#A9E07E", GD = "#3F8A3E", BR = "#7A5236", BRL = "#C9A27A", WING = "#EAF6FF";

// ---- sprites: lists of parts { m, p, x?, y?, loop? }
const part = (m, p, extra = {}) => ({ m, p, ...extra });
const wobble = (period = 300, amp = 0.6) => ["top", 0, -amp, period];
const flap = (period = 240) => ["opacity", 1, 0.15, period];

const S = {
  snail: [part([
    "...ss.....",
    "..sSSs..a.",
    ".sSssSs.a.",
    ".sSsSSs.bb",
    "..sSSs..bb",
    "bbbbbbbbbb",
  ], { s: "#8C5A2E", S: "#D19A5B", a: "#6E7A50", b: "#B9C79A" })],
  ant: [part(["........a", "aa.aaa.aa"], { a: "#3B2A20" }, { y: 1 }), part([".a.a.a.a."], { a: "#3B2A20" }, { loop: wobble(180, 0.5) })],
  ladybug: [part([".rrrk.", "rkrrkk", "rrkrrk"], { r: R, k: "#1E1A1A" }, { y: 1 }), part([".k.k.."], { k: "#1E1A1A" }, { loop: wobble(200, 0.5) })],
  bee: [part(["..ww..", ".ww.w."], { w: WING }, { y: 2, loop: flap(120) }), part(["kykyky", "kykykyk"], { y: Y, k: K })],
  butterfly: [
    part(["pp.pp", "pPbPp", "..b.."], { p: "#F27BA5", P: "#FFD1E1", b: "#3B2618" }, { loop: ["opacity", 1, 0, 260] }),
    part(["..b..", "pPbPp", "pp.pp"], { p: "#F27BA5", P: "#FFD1E1", b: "#3B2618" }, { loop: ["opacity", 0, 1, 260] }),
  ],
  monarch: [
    part(["oo.oo", "oYkYo", "..k.."], { o: "#F5A623", Y: "#FFE0A0", k: K }, { loop: ["opacity", 1, 0, 220] }),
    part(["..k..", "oYkYo", "oo.oo"], { o: "#F5A623", Y: "#FFE0A0", k: K }, { loop: ["opacity", 0, 1, 220] }),
  ],
  gardener: [
    part(["..hhh...", ".hhhhh..", "..fff...", "..fkf...", ".oooo...", "oooooo..", ".oooo...", ".oooo..."],
      { h: "#E8C46A", f: SKIN, k: K, o: "#5B8DD9" }),
    part([".l......", ".b......"], { l: "#3B4A6B", b: "#5A3E2B" }, { y: 8, loop: wobble(260, 0.6) }),
    part(["....l...", "....b..."], { l: "#3B4A6B", b: "#5A3E2B" }, { y: 8, loop: ["top", -0.6, 0, 260] }),
  ],
  gnome: [
    part(["...r...", "..rrr..", "..rrr..", ".rrrrr.", ".fffkf.", ".wwwww.", "bwwwwwb", ".bwwwb.", ".bbbbb."],
      { r: "#D8403B", f: SKIN, k: K, w: W, b: "#4A78C4" }),
    part([".k.....", ".....k."], { k: "#5A3E2B" }, { y: 9, loop: wobble(240, 0.6) }),
  ],
  rabbit: [part(["....ee..", "....ee..", "...wwww.", "...wwkwp", "wwwwwww.", "wwwwwww.", ".w.w..w."], { e: "#E6DED4", w: "#D8CFC4", k: K, p: PINK })],
  frog: [part([".kg..gk.", "gggggggg", "gGGGGGGg", "g.g..g.g"], { g: G, G: GL, k: "#1E1A1A" })],
  hedgehog: [part(["..ssss...", ".sssssss.", "sssssssff", "sssssssfk", ".ssssss..", "..l...l.."], { s: BR, f: "#E8C9A0", k: K, l: "#5A3E2B" })],
  robin: [part(["....bb.", "...bbkb", "..bbbby", "bbbrrb.", ".bbrrb.", "...l.l."], { b: "#6B4A3A", k: K, y: Y, r: "#E0704A", l: BRL })],
  bird: [part(["b...b", ".b.b.", "..b.."], { b: "#2F3346" }, { loop: ["top", 0, 1, 300] })],
  dragonfly: [part(["..w.w...", "ttttttth", "..w.w..."], { t: "#3FB8C9", h: "#2A6F8A", w: WING }, { loop: flap(90) })],
  wheelbarrow: [
    part(["wwwwwww", ".wwwww.", "...k..."], { w: "#C0392B", k: "#555" }, { y: 0 }),
    part(["...WW..", "...WW.."], { W: "#333" }, { y: 3 }),
  ],
  pumpkin: [part(["..g..", ".ooo.", "ooOoo", "ooOoo", ".ooo."], { g: GD, o: "#F08A2E", O: "#C96A1A" })],
  tomato: [part([".g.", "rrr", "rrr"], { g: GD, r: R })],
  leaf: [part(["..gg", ".gGg", "gGg.", "g..."], { g: "#E8913A", G: "#F5B86A" })],
  greenleaf: [part(["..gg", ".gGg", "gGg.", "g..."], { g: G, G: GL })],
  seed: [part(["w.w", ".w.", ".k."], { w: W, k: "#B9A98A" })],
  cloud: [
    part(["..cccc....", ".cccccccc.", "cccccccccc"], { c: "#E3E9EF" }),
    part([".d...d...d", "...d...d.."], { d: "#6AAEE0" }, { y: 3, loop: ["opacity", 1, 0, 380] }),
  ],
  balloon: [part(["..rrrr..", ".rrYYrr.", "rrYYYYrr", "rrYYYYrr", ".rrYYrr.", "..rrrr..", "...ll...", "...bb..."], { r: R, Y: Y, l: "#8C6A4A", b: "#8C5A2E" })],
  plane: [part(["w.....", "www...", "wwwwww", ".ww..."], { w: "#FFFFFF" })],
  spider: [part(["l", "l", "l", "l", "l"], { l: "#E3E9EF" }), part(["k.k.k", ".kkk.", "k.k.k"], { k: "#1E1A1A" }, { x: -2, y: 5 })],
  mouse: [part(["....ee.", "..mmmmk", "mmmmmmp", ".m...m."], { e: PINK, m: "#9A9AA6", k: K, p: PINK }), part(["t"], { t: "#9A9AA6" }, { x: -1, y: 2 })],
  cheese: [part(["...y", ".yyy", "yYyy"], { y: "#F6D25A", Y: "#E0B030" })],
  turtle: [part(["..sss...", ".sSsSs..", "sSsSsSsh", ".l..l.hk"], { s: "#5E8F3A", S: "#8FBF5A", h: "#9BC48A", l: "#9BC48A", k: K })],
  chicken: [part(["....rr.", "...www.", "...wkwy", "wwwwww.", ".wwwww.", "..y.y.."], { r: R, w: W, k: K, y: "#F5A623" })],
  chick: [part([".yy", "yky", "yyy", ".o."], { y: "#FFE36A", k: K, o: "#F5A623" })],
  beetle: [part([".gg.", "gGgGk", ".k.k"], { g: "#3A7D6E", G: "#5FC4AE", k: K })],
  cat: [part(["e...e..", "ee.ee..", "ooooo..", "okook.", ".ooooo.tt", ".ooooooo.", ".o.o.o.o."], { e: "#E8913A", o: "#E8913A", k: K, t: "#E8913A" })],
  dog: [part(["...bb..", "..bbbbk", "..bbbbn", "bbbbbb.", "bbbbbb.", ".b.b.b."], { b: "#B07A4A", k: K, n: K }), part(["t"], { t: "#B07A4A" }, { y: 2, loop: ["top", 0, -1, 200] })],
  squirrel: [part(["tt.....", "ttt..ee", "tt.ssss", ".t.sskp", "..ssss.", "..s.s.."], { t: "#C46A2E", e: "#C46A2E", s: "#D9844A", k: K, p: "#8C5A2E" })],
  acorn: [part(["cc", "aa"], { c: "#6B4A2E", a: "#C9A27A" })],
  duck: [part(["..yy..", ".yyko.", "yyyyy.", "yyyyyy", ".yyyy."], { y: "#F6E7A0", k: K, o: "#F5A623" })],
  duckling: [part([".yy", "yko", "yyy"], { y: "#FFE36A", k: K, o: "#F5A623" })],
  firefly: [part(["g"], { g: "#E8F58A" }, { loop: ["opacity", 1, 0.1, 500] })],
  worm: [ // built from humping segments
    part(["pp"], { p: "#E88BA0" }, { x: 0, loop: ["top", 0, -1, 520] }),
    part(["pp"], { p: "#E88BA0" }, { x: 2, loop: ["top", -1, 0, 520] }),
    part(["pp"], { p: "#E88BA0" }, { x: 4, loop: ["top", 0, -1, 520] }),
    part(["pp"], { p: "#E88BA0" }, { x: 6, loop: ["top", -1, 0, 520] }),
    part(["pk"], { p: "#F2A0B4", k: K }, { x: 8 }),
  ],
  caterpillar: [
    part(["gg"], { g: G }, { x: 0, loop: ["top", 0, -1, 400] }),
    part(["gg"], { g: GL }, { x: 2, loop: ["top", -1, 0, 400] }),
    part(["gg"], { g: G }, { x: 4, loop: ["top", 0, -1, 400] }),
    part(["gg"], { g: GL }, { x: 6, loop: ["top", -1, 0, 400] }),
    part(["k.k", "rrr", "rkr"], { r: "#D8403B", k: K }, { x: 8, y: -2 }),
  ],
  mower: [part(["h......", ".h.....", "..h....", "..rrrrr", "..rrrrr", "..k...k"], { h: "#555", r: "#3FAE6A", k: K })],
  tractor: [part(["...ss....", "...s.s...", "rrrrrrrr.", "rrrrrrrre", "KK...KKK.", "KK...KKK."], { s: "#8FB8D0", r: "#D8403B", e: "#555", K: "#2A2A2A" })],
  can: [part(["..kkk...", ".k...k..", "gggggg..", "ggggggggg", "gggggg...", "gggggg..."], { k: "#5E8F7E", g: "#7EBFA8" })],
  drops: [part(["d.", ".d", "d."], { d: "#6AAEE0" }, { loop: ["opacity", 1, 0, 300] })],
  flower: [part([".p.", "pyp", ".p.", ".g.", "gg."], { p: "#F27BA5", y: Y, g: G })],
  yellowflower: [part([".y.", "yoy", ".y.", ".g.", ".gg"], { y: "#F6D25A", o: "#E8913A", g: G })],
  sprout: [part(["g.g", ".g.", ".g."], { g: GL })],
  mole: [part([".mmmm.", "mkmmkm", "mmppmm", "mmmmmm"], { m: "#5A4A44", k: "#1E1A1A", p: PINK })],
  mound: [part(["..dddd..", "dddddddd"], { d: "#6B4A2E" })],
  carrot: [part(["g.g", ".g.", "ooo", ".oo", ".o."], { g: G, o: "#F08A2E" })],
  lantern: [part(["k", "y"], { k: "#555", y: "#FFE36A" }, { loop: ["opacity", 1, 0.5, 700] })],
  heart: [part(["r.r", "rrr", ".r."], { r: "#F27BA5" })],
  note: [part([".kk", ".k.", "kk."], { k: "#FFFFFF" })],
  rainbow: [part(["..rrrrrr..", ".oooooooo.", "yy......yy", "g........g"], { r: "#F0605A", o: "#F5A623", y: "#F6D25A", g: G })],
  star: [part([".y.", "yyy", ".y."], { y: "#FFF3A8" }, { loop: ["opacity", 1, 0.2, 400] })],
  snake: [
    part(["gg"], { g: "#7FB04A" }, { x: 0, loop: ["top", 0, -1, 300] }),
    part(["gg"], { g: "#9CCB5E" }, { x: 2, loop: ["top", -1, 0, 300] }),
    part(["gg"], { g: "#7FB04A" }, { x: 4, loop: ["top", 0, -1, 300] }),
    part(["gg"], { g: "#9CCB5E" }, { x: 6, loop: ["top", -1, 0, 300] }),
    part(["ggg", "gkr"], { g: "#7FB04A", k: K, r: R }, { x: 8, y: -1 }),
  ],
  owl: [part(["o...o", "ooooo", "wkowk", "ooyoo", "obbbo", ".ooo.", ".y.y."], { o: "#8C6A4A", w: W, k: K, y: Y, b: "#C9A27A" })],
  bat: [part(["k.....k", "kk.k.kk", ".kkkkk.", "..k.k.."], { k: "#2F3346" }, { loop: ["top", 0, 1, 180] })],
  pail: [part(["k....k", ".kkkk.", "bbbbbb", ".bbbb.", ".bbbb."], { k: "#777", b: "#5B8DD9" })],
};

// Sprites that are drawn standing on the wheelbarrow / held: loads.
const width = (parts) => Math.max(...parts.map((p) => (p.x ?? 0) + Math.max(...p.m.map((r) => r.length))));
const height = (parts) => Math.max(...parts.map((p) => (p.y ?? 0) + p.m.length));

// ---- scenes. Actor fields:
//   s: sprite name, or [[name, dx, dy], ...] to stack sprites into one actor (e.g. a gardener + barrow)
//   go: crossing time in seconds (omit for an actor that stays at `at`, 0..1 across the strip)
//   at: where a staying actor stands; dir: "left" to walk right-to-left; delay: seconds before it starts
//   y: lift off the ground (sprite pixels); bob: [amp, ms] hop/float loop
const A = (s, o = {}) => ({ s, ...o });
const crew = (...xs) => xs; // readability

export const SCENES = [
  { name: "Earthworm commute", cast: [A("worm", { go: 24 })] },
  { name: "Worm race", cast: [A("worm", { go: 20 }), A("worm", { go: 26, delay: 0.5, y: 3 })] },
  { name: "The snail's long journey", cast: [A("snail", { go: 40 })] },
  { name: "Snail vs. worm", cast: [A("snail", { go: 34 }), A("worm", { go: 30, delay: 1, y: 7 })] },
  { name: "Ant parade", cast: [0, 1, 2, 3, 4, 5].map((i) => A("ant", { go: 18, delay: i * 0.9 })) },
  { name: "Ants hauling a leaf", cast: [A([["ant", 0, 0], ["greenleaf", 2, 2]], { go: 20 }), A("ant", { go: 20, delay: 1.2 })] },
  { name: "Ants with crumbs of cheese", cast: [A([["ant", 0, 0], ["cheese", 3, 2]], { go: 19 }), A([["ant", 0, 0], ["cheese", 3, 2]], { go: 19, delay: 2 })] },
  { name: "Ladybug stroll", cast: [A("ladybug", { go: 16 })] },
  { name: "Ladybug family", cast: [A("ladybug", { go: 15 }), A("ladybug", { go: 15, delay: 1.1 }), A("ladybug", { go: 15, delay: 1.9 })] },
  { name: "Busy bee", cast: [A("bee", { go: 9, y: 5, bob: [2, 500] })] },
  { name: "Bee swarm", cast: [A("bee", { go: 8, y: 6, bob: [2, 420] }), A("bee", { go: 9, y: 3, delay: 0.4, bob: [2, 520] }), A("bee", { go: 8.5, y: 7, delay: 0.9, bob: [1.5, 380] })] },
  { name: "Butterfly flutter", cast: [A("butterfly", { go: 12, y: 5, bob: [3, 900] })] },
  { name: "Two butterflies dancing", cast: [A("butterfly", { go: 12, y: 6, bob: [3, 800] }), A("monarch", { go: 13, y: 3, delay: 0.6, bob: [3, 1000] })] },
  { name: "Monarch migration", cast: [0, 1, 2, 3].map((i) => A("monarch", { go: 14, y: 3 + (i % 2) * 4, delay: i * 1.4, bob: [2, 700 + i * 90] })) },
  { name: "Gardener with a wheelbarrow", cast: [A([["gardener", 0, 0], ["wheelbarrow", 6, 6]], { go: 18 })] },
  { name: "Pumpkin harvest", cast: [A([["gardener", 0, 0], ["wheelbarrow", 6, 6], ["pumpkin", 7, 1], ["pumpkin", 10, 2]], { go: 20 })] },
  { name: "Barrow full of flowers", cast: [A([["gardener", 0, 0], ["wheelbarrow", 6, 6], ["flower", 7, 1], ["yellowflower", 9, 1], ["flower", 11, 1]], { go: 18 })] },
  { name: "Tomato delivery", cast: [A([["gardener", 0, 0], ["wheelbarrow", 6, 6], ["tomato", 7, 3], ["tomato", 9, 3], ["tomato", 11, 3]], { go: 17 })] },
  { name: "A gnome goes for a walk", cast: [A("gnome", { go: 20 })] },
  { name: "Gnome chased by a bee", cast: [A("gnome", { go: 11 }), A("bee", { go: 10, delay: 1, y: 6, bob: [2, 300] })] },
  { name: "Gnome conga line", cast: [0, 1, 2].map((i) => A("gnome", { go: 18, delay: i * 1.3 })) },
  { name: "Gnome with a lantern", cast: [A([["gnome", 0, 0], ["lantern", 7, 4]], { go: 22 })] },
  { name: "Bunny hop", cast: [A("rabbit", { go: 12, bob: [4, 420] })] },
  { name: "Bunny found a carrot", cast: [A([["rabbit", 0, 0], ["carrot", 8, 1]], { go: 13, bob: [3, 460] })] },
  { name: "Leapfrog", cast: [A("frog", { go: 11, bob: [5, 520] }), A("frog", { go: 11, delay: 0.26, bob: [5, 520] })] },
  { name: "Hedgehog waddle", cast: [A("hedgehog", { go: 22, bob: [0.6, 300] })] },
  { name: "Robin hop", cast: [A("robin", { go: 14, bob: [2, 300] })] },
  { name: "Birds flying over", cast: [A("bird", { go: 8, y: 7 }), A("bird", { go: 8, y: 5, delay: 0.3 }), A("bird", { go: 8, y: 8, delay: 0.5 })] },
  { name: "Very hungry caterpillar", cast: [A("caterpillar", { go: 26 })] },
  { name: "Caterpillar, then butterfly", cast: [A("caterpillar", { go: 22 }), A("butterfly", { go: 12, y: 6, delay: 9, bob: [3, 900] })] },
  { name: "Dragonfly zip", cast: [A("dragonfly", { go: 4, y: 6, bob: [1, 300] })] },
  { name: "Mole peeks out", cast: [A("mound", { at: 0.5 }), A("mole", { at: 0.53, pop: true })] },
  { name: "Whack-a-mole", cast: [A("mound", { at: 0.2 }), A("mole", { at: 0.23, pop: true }), A("mound", { at: 0.55 }), A("mole", { at: 0.58, pop: true, delay: 0.5 }), A("mound", { at: 0.85 }), A("mole", { at: 0.88, pop: true, delay: 1 })] },
  { name: "Watering the garden", cast: [A([["gardener", 0, 0], ["can", 6, 4], ["drops", 15, 7]], { go: 22 })] },
  { name: "Mowing the lawn", cast: [A([["gardener", 0, 0], ["mower", 5, 5]], { go: 16 })] },
  { name: "Tractor time", cast: [A("tractor", { go: 16, bob: [0.5, 200] })] },
  { name: "Cat on the prowl", cast: [A("cat", { go: 18 })] },
  { name: "Cat chases mouse", cast: [A("mouse", { go: 7 }), A("cat", { go: 7, delay: 0.7 })] },
  { name: "Dog chases butterfly", cast: [A("butterfly", { go: 9, y: 6, bob: [3, 700] }), A("dog", { go: 9, delay: 0.8, bob: [1, 260] })] },
  { name: "Squirrel with an acorn", cast: [A([["squirrel", 0, 0], ["acorn", 7, 3]], { go: 10, bob: [2, 300] })] },
  { name: "Duck family outing", cast: [A("duck", { go: 20 }), A("duckling", { go: 20, delay: 1.3 }), A("duckling", { go: 20, delay: 2.1 }), A("duckling", { go: 20, delay: 2.9 })] },
  { name: "Mother hen and chicks", cast: [A("chicken", { go: 22, bob: [0.8, 400] }), A("chick", { go: 22, delay: 1.4, bob: [1, 300] }), A("chick", { go: 22, delay: 2.2, bob: [1, 330] })] },
  { name: "Fireflies", cast: [0, 1, 2, 3, 4].map((i) => A("firefly", { go: 16 + i * 2, y: 2 + ((i * 3) % 8), delay: i * 0.7, bob: [2, 900 + i * 150] })) },
  { name: "Runaway pumpkin", cast: [A("pumpkin", { go: 7, bob: [1, 160] })] },
  { name: "Tomato tumble", cast: [A("tomato", { go: 6, bob: [2, 200] }), A("tomato", { go: 6.5, delay: 0.4, bob: [2, 220] })] },
  { name: "Autumn leaf drifting", cast: [A("leaf", { go: 14, y: 5, bob: [4, 1300] })] },
  { name: "Falling leaves", cast: [0, 1, 2].map((i) => A(i % 2 ? "leaf" : "greenleaf", { go: 13 + i, y: 3 + i * 2, delay: i * 1.5, bob: [3, 1100 + i * 200] })) },
  { name: "Dandelion seeds", cast: [0, 1, 2, 3].map((i) => A("seed", { go: 15 + i * 2, y: 3 + (i % 3) * 3, delay: i * 1.2, bob: [3, 1500 + i * 200] })) },
  { name: "A passing rain cloud", cast: [A("cloud", { go: 18, y: 4 })] },
  { name: "Hot air balloon", cast: [A("balloon", { go: 26, y: 2, bob: [1.5, 2000] })] },
  { name: "Paper airplane", cast: [A("plane", { go: 6, y: 6, bob: [2, 900] })] },
  { name: "Itsy bitsy spider", cast: [A("spider", { at: 0.5, y: 3, bob: [3, 1600] })] },
  { name: "Mouse found the cheese", cast: [A("cheese", { at: 0.75 }), A("mouse", { go: 9 })] },
  { name: "Turtle trek", cast: [A("turtle", { go: 36 })] },
  { name: "Beetle hurry", cast: [A("beetle", { go: 8, bob: [0.5, 160] })] },
  { name: "Snake in the grass", cast: [A("snake", { go: 16 })] },
  { name: "Flowers bloom", cast: [0.15, 0.35, 0.55, 0.75].map((at, i) => A(i % 2 ? "yellowflower" : "flower", { at, pop: true, delay: i * 0.6 })) },
  { name: "Sprouts popping up", cast: [0.1, 0.3, 0.5, 0.7, 0.9].map((at, i) => A("sprout", { at, pop: true, delay: i * 0.4 })) },
  { name: "Rainbow after the rain", cast: [A("rainbow", { at: 0.4, y: 2 })] },
  { name: "Night owl", cast: [A("owl", { at: 0.6, bob: [0.6, 1800] }), A("star", { at: 0.2, y: 7 }), A("star", { at: 0.85, y: 8 })] },
  { name: "Bats at dusk", cast: [A("bat", { go: 7, y: 6 }), A("bat", { go: 8, y: 3, delay: 0.5 })] },
  { name: "Bee meets a flower", cast: [A("flower", { at: 0.7 }), A("bee", { go: 10, y: 6, bob: [2, 400] })] },
  { name: "A gift for the gnome", cast: [A("gnome", { at: 0.75 }), A([["rabbit", 0, 0], ["heart", 3, -3]], { go: 9, bob: [3, 420] })] },
  { name: "Singing robin", cast: [A("robin", { at: 0.5, bob: [0.8, 600] }), A("note", { at: 0.62, y: 6, bob: [2, 900] })] },
  { name: "Duckling catch-up", cast: [A("duck", { go: 14 }), A("duckling", { go: 9, delay: 3, bob: [1, 200] })] },
  { name: "Sandcastle bucket brigade", cast: [A([["gardener", 0, 0], ["pail", 7, 4]], { go: 18 }), A([["gnome", 0, 0], ["pail", 7, 4]], { go: 18, delay: 1.6 })] },
  { name: "Frog chases a dragonfly", cast: [A("dragonfly", { go: 8, y: 7, bob: [1, 300] }), A("frog", { go: 8, delay: 0.6, bob: [5, 520] })] },
  { name: "Leftward snail", cast: [A("snail", { go: 38, dir: "left" })] },
  { name: "Bunny goes home", cast: [A("rabbit", { go: 12, dir: "left", bob: [4, 420] })] },
  { name: "Gnome forgot something", cast: [A("gnome", { go: 9 }), A("gnome", { go: 9, dir: "left", delay: 10 })] },
];

// ---- drawing
function rects(m, p, ox, oy, mirrorW) {
  const out = [];
  m.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === "." || !p[c]) { x++; continue; }
      let end = x;
      while (row[end + 1] === c) end++;
      const w = end - x + 1;
      const px = mirrorW == null ? ox + x : mirrorW - (ox + x) - w;
      out.push(div().absolute().left(px * U).top((oy + y) * U).w(w * U + 0.3).h(U + 0.3).bg(p[c]));
      x = end + 1;
    }
  });
  return out;
}

// One actor's sprite: its parts (and stacked sprites), mirrored when it walks left.
function body(actor) {
  const pieces = typeof actor.s === "string" ? [[actor.s, 0, 0]] : actor.s;
  const parts = pieces.flatMap(([name, dx, dy]) => (S[name] ?? []).map((p) => ({ ...p, x: (p.x ?? 0) + dx, y: (p.y ?? 0) + dy })));
  const minX = Math.min(0, ...parts.map((p) => p.x));
  const minY = Math.min(0, ...parts.map((p) => p.y));
  const norm = parts.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY }));
  const w = width(norm), h = height(norm);
  const mirror = actor.dir === "left" ? w : null;
  const el = div().absolute().left(0).top(0).w(w * U).h(h * U).children(norm.map((p) => {
    let layer = div().absolute().left(0).top(0).w(w * U).h(h * U).children(rects(p.m, p.p, p.x, p.y, mirror));
    if (p.loop) {
      const [prop, from, to, period] = p.loop;
      layer = layer.loop(prop, { from: prop === "opacity" ? from : from * U, to: prop === "opacity" ? to : to * U, period: Math.max(100, period), easing: "ease-in-out" });
    }
    return layer;
  }));
  return { el, w: w * U, h: h * U };
}

// How long a scene runs (ms), from its slowest actor.
export function sceneLength(scene) {
  return Math.max(...scene.cast.map((a) => ((a.delay ?? 0) + (a.go ?? 9)) * 1000)) + 400;
}

// Draws one scene in a strip `width` px wide. phase: "start" (everyone off-stage / hidden),
// "go" (crossing, or shown), "out" (staying actors fade away). `play` keys the elements so
// each new play starts its transitions fresh.
export function drawScene(scene, phase, width, play, preview = false) {
  return div().absolute().left(0).top(0).w(width).h(STRIP_H).overflow_hidden().children(scene.cast.map((actor, i) => {
    const { el, w, h } = body(actor);
    const lift = (actor.y ?? 0) * U;
    const top = STRIP_H - h - lift;
    let inner = div().absolute().left(0).top(0).w(w).h(h).child(el);
    if (actor.bob) inner = inner.loop("top", { from: 0, to: -actor.bob[0] * U, period: Math.max(100, actor.bob[1]), easing: "ease-in-out" });
    const id = `scene-${play}-${i}`;
    if (actor.go && preview) {
      // A still: crossing actors spread out by their delays, mid-strip.
      const x = Math.max(0, width * 0.55 - w - (actor.delay ?? 0) * 7 * U);
      return div().absolute().left(x).top(top).w(w).h(h).child(inner);
    }
    if (actor.go) {
      const left = actor.dir === "left";
      const from = left ? width + 2 : -w - 2;
      const to = left ? -w - 2 : width + 2;
      return div().id(id).absolute().top(top).w(w).h(h)
        .left(phase === "start" ? from : to)
        .transition("left", { duration: actor.go * 1000, delay: (actor.delay ?? 0) * 1000, easing: "linear" })
        .child(inner);
    }
    // Staying actors fade (and moles/flowers pop up out of the ground).
    const x = Math.max(0, Math.min(width - w, (actor.at ?? 0.5) * width - w / 2));
    const shown = phase === "go";
    const delay = shown ? (actor.delay ?? 0) * 1000 : 0;
    if (actor.pop) {
      // Rises out of the ground and sinks back, clipped at the ground line.
      const riser = div().id(`${id}-r`).absolute().left(0).w(w).h(h).top(shown ? 0 : h)
        .transition("top", { duration: 700, delay, easing: "ease-out" })
        .child(inner);
      return div().id(id).absolute().left(x).top(top).w(w).h(h).overflow_hidden().child(riser);
    }
    return div().id(id).absolute().left(x).top(top).w(w).h(h)
      .opacity(shown ? 1 : 0)
      .transition("opacity", { duration: 500, delay, easing: "ease-in-out" })
      .child(inner);
  }));
}
