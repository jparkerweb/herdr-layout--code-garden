// Code Garden: one cute potted house plant per agent, drawn as pixel art.
// Sprites are ASCII maps (one char = one pixel, "." = empty) turned into rectangles
// once, at load. Every motion is a native .loop(): no timers, no re-renders, and it
// only runs while the plant is on screen.
//
// Moods (the ids the mods pass around; statuses map to them in mood()):
//   working  ("stab")    – growing: leaves sway, the sun shines, sparkles rise
//   blocked  ("angry")   – thirsty: leaves droop, a water drop blinks — needs you
//   waiting  ("scowl")   – very thirsty: droops more, two drops blink fast
//   done     ("happy")   – bloomed: the plant hops, a heart floats up, sparkles
//   idle     ("content") – resting: eyes closed, a slow breeze
//   snooze               – idle 2m+: Zzz drift up
//   urge                 – idle 5m+: a bee buzzes around to wake it
//
// Canvas: 30 x 22 pixels. The plant and its pot use columns 0–23; the right
// six columns are room for the drop, sun, heart and Zzz.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { shared, setShared } from "herdr";

const COLS = 30;
const ROWS = 22;

const EYE = "#2A1A14";
const BLUSH = "#F49AA8";
const WHITE = "#FFFFFF";
const SUN = "#F6D25A";
const SPARK = "#FFF3A8";
const WATER = "#6AAEE0";
const WATER_HI = "#CDEBFF";
const HEART = "#F27BA5";
const ZZZ = "#B9C8F0";

// Turns rows of chars into [x, y, w, color] runs, merging same-color neighbours on a row.
function sprite(rows, palette, top = 0) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === "." || !palette[c]) { x++; continue; }
      let end = x;
      while (row[end + 1] === c) end++;
      out.push([x, y + top, end - x + 1, palette[c]]);
      x = end + 1;
    }
  });
  return out;
}

// The pot, shared by every species (rows 13–21). R rim, r rim shadow, P body, h highlight, p underside.
const POT = [
  "......RRRRRRRRRRRR......",
  "......rrrrrrrrrrrr......",
  ".......PhPPPPPPPPP......",
  ".......PhPPPPPPPPP......",
  ".......PhPPPPPPPPP......",
  ".......PhPPPPPPPPP......",
  "........PPPPPPPP........",
  "........pPPPPPPp........",
  ".........pppppp.........",
];

const LEAF = { G: "#7CC45A", g: "#4F8F3A", L: "#A9E07E", S: "#5E9E45" };

const SPECIES = {
  // Claude: a sunflower in a terracotta pot.
  sunflower: {
    role: "Sunflower",
    pot: { R: "#E8957A", r: "#A9543A", P: "#D97757", h: "#EFA488", p: "#B5593B" },
    head: sprite([
      "..........YYYY..........",
      "........YYYYYYYY........",
      ".......YYyOOOOyYY.......",
      ".......YyOOooOOyY.......",
      ".......YyOOooOOyY.......",
      ".......YYyOOOOyYY.......",
      "........YYYYYYYY........",
    ], { Y: "#F6C744", y: "#E0A42A", O: "#8A4B2A", o: "#5E3220" }),
    leaves: sprite([
      "...........SS...........",
      ".....GGG...SS...GGG.....",
      "....GLLGG..SS..GGLLG....",
      ".....GGGgg.SS.ggGGG.....",
      "........ggSSSSgg........",
      "...........SS...........",
    ], LEAF, 7),
  },
  // Codex: a round cactus with a pink bloom, in a blue pot.
  cactus: {
    role: "Cactus",
    pot: { R: "#8E9CFF", r: "#3E4BB8", P: "#5B6CF0", h: "#8E9CFF", p: "#4553C9" },
    head: sprite([
      "..........FfFF..........",
      "...........ff...........",
    ], { F: "#F48FB1", f: "#E0609A" }),
    leaves: sprite([
      "..........CCCC..........",
      ".........CCLCCC.........",
      ".........CLCCsC.........",
      "...CC....CLCCCC....CC...",
      "..CCLC...CsCCCC...CCLC..",
      "..CLCC...CLCCsC...CCLs..",
      "..CCCCCCCCLCCCCCCCCCCC..",
      "......cccCLCCCCccc......",
      ".........CLCCsC.........",
      ".........CCCCCC.........",
      ".........cccccc.........",
    ], { C: "#4FA36B", c: "#2F7A4C", L: "#7FCB8E", s: "#E8F3D8" }, 2),
  },
  // OpenCode: a snake plant with golden edges, in a slate pot.
  snake: {
    role: "Snake Plant",
    pot: { R: "#5A6A90", r: "#252E44", P: "#35425E", h: "#5A6A90", p: "#2A3550" },
    leaves: sprite([
      "...........KK...........",
      ".....K.....KK.....K.....",
      ".....KK...KBBK...KK.....",
      ".....EKK..KKBK..KKE.....",
      "......KBK.EKKE.KBK......",
      "......EKK.KBBK.KKE......",
      ".......KBKEKKEKBK.......",
      ".......EKKKBBKKKE.......",
      "........KBKKKKBK........",
      "........EKKBBKKE........",
      ".........KKKKKK.........",
      ".........kkkkkk.........",
      "..........kkkk..........",
    ], { K: "#3E8A52", k: "#2A5A39", E: "#D9D46A", B: "#6BB070" }),
  },
  // Hermes: a trailing golden pothos in a winged gold pot.
  pothos: {
    role: "Pothos",
    wings: true,
    pot: { R: "#F2C66A", r: "#A87A2A", P: "#E8B04A", h: "#F7DC9A", p: "#B8862E" },
    leaves: sprite([
      "...........PP...........",
      "......PP...PP...PP......",
      ".....PVPP.PVPP.PVPP.....",
      "....PPPPPPPPPPPPPPPP....",
      "...PVPPpPPVPPPPpPPVPP...",
      "...PPPPPPPPPPPPPPPPPP...",
      "....pPPpPPPPPPPPpPPp....",
      "....PP..pPPPPPPp..PP....",
      "....pp............pp....",
      "....pP............Pp....",
      ".....P............P.....",
      "....PVP..........PVP....",
      "....PPP..........PPP....",
      ".....p............p.....",
      ".....P............P.....",
      "....PP............PP....",
    ], { P: "#5FB85A", p: "#3F8A3E", V: "#E8E07A" }, 4),
  },
  // Antigravity: three tulips, red, yellow and blue, in a blue pot.
  tulips: {
    role: "Tulips",
    pot: { R: "#6FB2FF", r: "#2160C4", P: "#3186FF", h: "#8CC4FF", p: "#2A6FDC" },
    head: sprite([
      "..........Y..Y..........",
      "..........YYYY..........",
      "....R..R..YYYY..B..B....",
      "....RRRR...YY...BBBB....",
      "....RRRR........BBBB....",
      ".....RR..........BB.....",
    ], { R: "#F0605A", Y: "#F6C744", B: "#5D9BFF" }, 1),
    leaves: sprite([
      "...........SS...........",
      "...........SS...........",
      "......S....SS....S......",
      "..GG...S...SS...S...GG..",
      "..GGG...S..SS..S...GGG..",
      "...GGG...SSSSSS...GGG...",
      "....GGGG..SSSS..GGGG....",
      "......GGGGSSSSGGGG......",
    ], LEAF, 5),
  },
  // ---- More plants for the picker (double-click a plant to choose).
  monstera: {
    role: "Monstera",
    pot: { R: "#F1EEE6", r: "#B9B3A6", P: "#E4DFD3", h: "#FFFFFF", p: "#C9C3B4" },
    leaves: sprite([
      "..........MMMM..........",
      ".....MMM.MMLLMM.MMM.....",
      "....MMLMM.MM.MM.MMLMM...",
      "...MMMM.MMMMMMMM.MMMM...",
      "...MM.MMMMLMMLMMMM.MM...",
      "...MMMMM.MMMMMM.MMMMM...",
      "....mMMMm.mSSm.mMMMm....",
      ".....mmm...SS...mmm.....",
      "........S..SS..S........",
      ".........S.SS.S.........",
      "..........SSSS..........",
      "...........SS...........",
    ], { M: "#3F9A55", m: "#2B6E3D", L: "#6CC27A", S: "#4F8F3A" }, 1),
  },
  fern: {
    role: "Boston Fern",
    pot: { R: "#C98F6B", r: "#7E5239", P: "#A86E4E", h: "#D3A283", p: "#8A583D" },
    leaves: sprite([
      "...........FF...........",
      ".......F...FF...F.......",
      ".....F.FF.FLLF.FF.F.....",
      "....FLF.FFFFFFFF.FLF....",
      "...FF.FFFLFFFFLFFF.FF...",
      "..FF.FFfFFFFFFFFfFF.FF..",
      ".FF..FfF.ffFFff.FfF..FF.",
      ".F..FF.f...ff...f.FF..F.",
      "...FF..............FF...",
      "..F..................F..",
    ], { F: "#6DBE5A", f: "#3F8A3E", L: "#A9E07E" }, 3),
  },
  aloe: {
    role: "Aloe",
    pot: { R: "#E8D9B0", r: "#A39064", P: "#D4C08E", h: "#F1E6C6", p: "#B09D6C" },
    leaves: sprite([
      "...........AA...........",
      "....A......AA......A....",
      ".....A....AAAA....A.....",
      ".....AA...AsAA...AA.....",
      "......AA..AAsA..AA......",
      "......AsA.AAAA.AsA......",
      ".......AA.AsAA.AA.......",
      ".......AAAAAAAAAA.......",
      "........aAAAAAAa........",
      ".........aaaaaa.........",
    ], { A: "#6FB88A", a: "#4A8C66", s: "#DDF0D8" }, 3),
  },
  lavender: {
    role: "Lavender",
    pot: { R: "#B8C4D6", r: "#6E7A8E", P: "#97A4B8", h: "#CBD5E3", p: "#7A879B" },
    head: sprite([
      "....l...l..ll..l...l....",
      "....V...V..VV..V...V....",
      "...vVv.vVv.VV.vVv.vVv...",
      "....V...V.vVVv.V...V....",
      "...vVv.vVv.VV.vVv.vVv...",
      "....v...V.vVVv.V...v....",
    ], { V: "#9B7BDB", v: "#7A5BC0", l: "#C9B1F4" }, 1),
    leaves: sprite([
      "....S...S..SS..S...S....",
      ".....S...S.SS.S...S.....",
      "...GG.S...SSSS...S.GG...",
      "....GG.S..SSSS..S.GG....",
      ".....GGGSSSSSSSSGGG.....",
      ".......GGGSSSSGGG.......",
    ], { S: "#6E9E5A", G: "#8DB87A" }, 7),
  },
  rose: {
    role: "Rose",
    pot: { R: "#F4C7CF", r: "#B98390", P: "#E8A9B5", h: "#F8D9DF", p: "#C98896" },
    head: sprite([
      "..........rRRr..........",
      ".........RRpRRR.........",
      "........RRrRRpRR........",
      "........RpRRrRRR........",
      ".........RRrRRR.........",
      "..........rRRr..........",
    ], { R: "#E04A5F", r: "#B02E44", p: "#F58A9A" }, 1),
    leaves: sprite([
      "...........SS...........",
      "......GG...SS...GG......",
      ".....GLGG..SS..GGLG.....",
      "......GGgg.SS.ggGG......",
      "........ggSSSSgg........",
      "...........SS...........",
    ], LEAF, 7),
  },
  bonsai: {
    role: "Bonsai",
    pot: { R: "#6E7A8C", r: "#3B4352", P: "#4F5A6B", h: "#7A8698", p: "#3E4756" },
    leaves: sprite([
      "....CCLCCC..............",
      "...CCCCCCCC...CCCC......",
      "...cCCCCCCc..CCLCCC.....",
      "....ccccc...CCCCCCCC....",
      "......T.....cCCCCCCc....",
      "......TT.....ccccTc.....",
      ".......TT......TT.......",
      "........TT...TT.........",
      ".........TTTTT..........",
      "..........TTt...........",
      ".........tTTTt..........",
      "........ttTTTTtt........",
    ], { C: "#5FA850", c: "#3F7F3A", L: "#86C96E", T: "#8C5A3C", t: "#6B4029" }, 1),
  },
  flytrap: {
    role: "Venus Flytrap",
    pot: { R: "#9AA88A", r: "#5C6A50", P: "#7D8C6C", h: "#A9B79A", p: "#627055" },
    head: sprite([
      ".........w.ww.w.........",
      "........GGGGGGGG........",
      "..gG...GrrrrrrrrG...Gg..",
      ".gGrG..GrrrrrrrrG..GrGg.",
      "..gG....GGGGGGGG....Gg..",
      ".........w.ww.w.........",
    ], { G: "#8BC34A", g: "#5E8F2E", r: "#E0505E", w: "#F2F7D0" }, 2),
    leaves: sprite([
      "...g.......SS.......g...",
      "....g......SS......g....",
      ".....gg....SS....gg.....",
      ".......gggSSSSggg.......",
      "..........SSSS..........",
    ], { g: "#6FA83A", S: "#5E9E45" }, 8),
  },
  orchid: {
    role: "Orchid",
    pot: { R: "#E9DDF5", r: "#A897C0", P: "#D6C6EC", h: "#F3ECFB", p: "#B7A5D0" },
    head: sprite([
      "........OoO..OoO........",
      "........OcO..OcO........",
      ".....OoO.oO..Oo.OoO.....",
      ".....OcO........OcO.....",
      "......o..........o......",
    ], { O: "#F2A7D8", o: "#D66BB5", c: "#F6D25A" }, 0),
    leaves: sprite([
      "..........SSSS..........",
      ".......S..S..S..S.......",
      "........S.S..S.S........",
      ".........SS..SS.........",
      "..........SSSS..........",
      "...GGGGG...SS...GGGGG...",
      "..GGLGGGGG.SS.GGGGGLGG..",
      "...GGGGGGGGSSGGGGGGGG...",
      ".....gggggggggggggg.....",
    ], { S: "#6E9E5A", G: "#5FA850", g: "#3F7F3A", L: "#86C96E" }, 3),
  },
  bamboo: {
    role: "Lucky Bamboo",
    pot: { R: "#B8E4F2", r: "#5A9AB0", P: "#7CC1D8", h: "#C8ECF6", p: "#5FA3BA" },
    leaves: sprite([
      "..........G.BG..........",
      "...........BB...........",
      "......GG...nn...GG......",
      ".......BB..BB..BB.......",
      ".......BB..BB..BB.......",
      "......GnnG.BB..nn.......",
      ".......BB..nn..BB.......",
      ".......BB..BB..BBGG.....",
      ".......nn..BB..BB.......",
      ".......BB..BB..nn.......",
      ".......BB.GnnG.BB.......",
      ".......bb..bb..bb.......",
      ".......bb..bb..bb.......",
    ], { B: "#8FCB5A", b: "#5E9A3A", n: "#C9E89A", G: "#5FB85A" }, 0),
  },
  lily: {
    role: "Peace Lily",
    pot: { R: "#4A4F57", r: "#25282D", P: "#353A41", h: "#565C65", p: "#2A2E34" },
    head: sprite([
      ".......W........W.......",
      "......WWW......WWW......",
      "......WyW......WyW......",
      "......WyW......WyW......",
      ".......w........w.......",
    ], { W: "#F4F6EE", w: "#CFD8C4", y: "#F2D46B" }, 1),
    leaves: sprite([
      ".......S...KK...S.......",
      "...KK..S..KKKK..S..KK...",
      "..KKKK.S.KKLKKK.S.KKKK..",
      "..KkKKKS.KKKKKK.SKKKkK..",
      "...kKKKKSkKKKKkSKKKKk...",
      ".....kkkkSSSSSSkkkk.....",
      "..........SSSS..........",
    ], { K: "#3F8A52", k: "#2A5A39", L: "#6BB070", S: "#4F8F3A" }, 6),
  },
  // Everyone else: a little two-leaf sprout in a clay pot.
  sprout: {
    role: "Sprout",
    pot: { R: "#D6B08A", r: "#8C6A4A", P: "#B88B5E", h: "#D6B48C", p: "#8F6A45" },
    leaves: sprite([
      "...........LL...........",
      "..........LLLL..........",
      "....LGGG...SS...GGGL....",
      "...LGGGGG..SS..GGGGGL...",
      "...GGGGGGg.SS.gGGGGGG...",
      "....gGGGGggSSggGGGGg....",
      "......ggggSSSSgggg......",
      "..........SSSS..........",
      "...........SS...........",
      "...........SS...........",
      "...........SS...........",
    ], LEAF, 2),
  },
};

const PLANTS = [
  { match: (k) => k.includes("hermes"), species: "pothos" },
  { match: (k) => k.includes("claude"), species: "sunflower" },
  { match: (k) => k.includes("codex"), species: "cactus" },
  { match: (k) => k.includes("opencode"), species: "snake" },
  { match: (k) => k.includes("antigravity") || k === "agy", species: "tulips" },
];

export function plantOf(key) {
  const k = String(key ?? "").toLowerCase();
  const species = PLANTS.find((p) => p.match(k))?.species ?? "sprout";
  return { species, role: SPECIES[species].role };
}
export const speciesOf = (key) => plantOf(key).species;

// Every plant, in the order the picker shows them.
export const ALL_SPECIES = Object.entries(SPECIES).map(([id, s]) => ({ id, role: s.role }));
export const roleOf = (species) => SPECIES[species]?.role ?? SPECIES.sprout.role;

// The plant someone picked for this agent (double-click), else its program's own.
export function chosenSpecies(address, key) {
  const picked = (shared("garden.plants") ?? {})[address];
  return SPECIES[picked] ? picked : plantOf(key).species;
}
export function choosePlant(address, species) {
  const all = { ...(shared("garden.plants") ?? {}) };
  if (species) all[address] = species;
  else delete all[address];
  setShared("garden.plants", all);
}

// Growth: plants grow taller the longer their agent has worked (in total).
// The agents list keeps the time and publishes each agent's stage in shared "garden.growth".
export const GROWTH_AT = [0, 2 * 60000, 6 * 60000, 15 * 60000];
export const GROWTH_NAMES = ["Seedling", "Sprouting", "Leafy", "Full grown"];
export const stageFor = (ms) => GROWTH_AT.reduce((s, at, i) => (ms >= at ? i : s), 0);
export const growthOf = (address) => (shared("garden.growth") ?? {})[address] ?? 3;
// How far (in pixels) the foliage still sits down in the pot at each stage.
const SUNK = [6, 4, 2, 0];

const POTS = Object.fromEntries(Object.entries(SPECIES).map(([k, s]) => [k, sprite(POT, s.pot, 13)]));

export const BLOCKED_SCOWL = 60 * 1000;
export const IDLE_SNOOZE = 120 * 1000;
export const IDLE_URGE = 300 * 1000;

export function mood(status, waited = 0) {
  if (status === "working") return "stab";
  if (status === "blocked") return waited < BLOCKED_SCOWL ? "angry" : "scowl";
  if (status === "done") return "happy";
  if (status === "idle") {
    if (waited >= IDLE_URGE) return "urge";
    if (waited >= IDLE_SNOOZE) return "snooze";
  }
  return "content";
}

export const MOODS = [
  { id: "stab", label: "Growing" },
  { id: "angry", label: "Thirsty" },
  { id: "scowl", label: "Very thirsty" },
  { id: "happy", label: "Bloomed" },
  { id: "content", label: "Resting" },
  { id: "snooze", label: "Snoozing" },
  { id: "urge", label: "Bee alarm" },
];

export const plantWidth = (height) => Math.round((height * COLS) / ROWS);

// One plant in one mood. `still` draws it without motion; `pace` (1..2) speeds the sway up.
export function plantMood(m, height, { still = false, species = "sprout", pace = 1, growth = 3 } = {}) {
  const sp = SPECIES[species] ?? SPECIES.sprout;
  const u = height / ROWS;
  const px = (v) => v * u;
  const fast = (ms) => Math.round(ms / Math.max(1, Math.min(2, pace)));
  const motion = (el, prop, policy) => (still ? el : el.loop(prop, policy));
  // Rects overlap a hair so neighbouring pixels never show a seam when scaled.
  const rect = (x, y, w, h, c) => div().absolute().left(px(x)).top(px(y)).w(px(w) + 0.35).h(px(h) + 0.35).bg(c);
  const layer = (items) => div().absolute().left(0).top(0).w(px(COLS)).h(px(ROWS)).children(items);
  const runs = (list) => list.map(([x, y, w, c]) => rect(x, y, w, 1, c));

  const growing = m === "stab";
  const thirsty = m === "angry" || m === "scowl";
  const parched = m === "scowl";
  const bloomed = m === "happy";
  const snoozing = m === "snooze";
  const urging = m === "urge";
  const resting = m === "content" || snoozing;

  // The face lives on the pot. Pot body spans columns 7–16, centred on 11.5.
  const face = bloomed
    ? [rect(8.5, 16.4, 2, 0.8, EYE), rect(8, 17.1, 0.8, 0.9, EYE), rect(10.2, 17.1, 0.8, 0.9, EYE),
       rect(12.5, 16.4, 2, 0.8, EYE), rect(12, 17.1, 0.8, 0.9, EYE), rect(14.2, 17.1, 0.8, 0.9, EYE),
       rect(10.7, 18.2, 1.6, 0.9, EYE)]
    : resting
      ? [rect(8.5, 17, 2, 0.8, EYE), rect(12.5, 17, 2, 0.8, EYE), rect(11, 18.3, 1, 0.8, EYE)]
      : urging
        ? [rect(8.6, 15.8, 1.8, 2.4, EYE), rect(12.6, 15.8, 1.8, 2.4, EYE), rect(8.8, 16, 0.7, 0.7, WHITE), rect(12.8, 16, 0.7, 0.7, WHITE), rect(10.9, 18.5, 1.2, 1.2, EYE)]
        : thirsty
          ? [rect(9, 16.2, 1, 2, EYE), rect(13, 16.2, 1, 2, EYE), rect(8.4, 15.6, 1.6, 0.6, EYE), rect(13, 15.6, 1.6, 0.6, EYE), rect(10.9, 18.6, 1.2, 0.7, EYE)]
          : [rect(9, 16, 1, 2, EYE), rect(13, 16, 1, 2, EYE), rect(9, 16, 0.5, 0.6, WHITE), rect(13, 16, 0.5, 0.6, WHITE), rect(10.8, 18.4, 1.4, 0.7, EYE)];
  const blush = [rect(7.7, 18.2, 1.2, 0.8, BLUSH), rect(14.1, 18.2, 1.2, 0.8, BLUSH)];
  const tear = thirsty ? [motion(rect(15.6, 15.2, 0.8, 1.2, WATER), "opacity", { from: 0.2, to: 1, period: 900, easing: "ease-in-out" })] : [];

  // Hermes' pot has little white wings that flap.
  const wings = sp.wings
    ? [false, true].map((right) => {
        const x = (v) => (right ? 23 - v : v);
        const w = layer([rect(x(1) - (right ? 2 : 0), 14.5, 3, 1, "#F5F1E6"), rect(x(2) - (right ? 1 : 0), 15.5, 2, 1, "#F5F1E6"), rect(x(3), 16.5, 1, 1, "#C9C3B4")]);
        return motion(w, "top", { from: 0, to: px(-0.8), period: bloomed || urging ? 260 : growing ? fast(520) : 1200, easing: "ease-in-out" });
      })
    : [];

  // Leaves sway in the breeze; thirsty plants droop instead.
  const swayPeriod = growing ? fast(900) : bloomed ? 500 : 2600;
  let foliage = layer(runs(sp.leaves));
  let head = sp.head ? layer(runs(sp.head)) : null;
  if (thirsty) {
    const drop = parched ? 1.6 : 1;
    foliage = motion(foliage, "top", { from: px(0.2), to: px(drop), period: parched ? 900 : 1800, easing: "ease-in-out" });
    if (head) head = motion(head, "top", { from: px(0.6), to: px(drop + 0.8), period: parched ? 900 : 1800, easing: "ease-in-out" });
  } else {
    foliage = motion(foliage, "left", { from: px(-0.5), to: px(0.5), period: swayPeriod, easing: "ease-in-out" });
    if (head) head = motion(head, "left", { from: px(-0.7), to: px(0.7), period: swayPeriod, easing: "ease-in-out" });
  }

  // Props in the room on the right (columns 23–29) and above.
  const props = [];
  if (growing) {
    const sun = layer([rect(25, 1, 3, 3, SUN), rect(26, 0, 1, 5, SUN), rect(24, 2, 5, 1, SUN), rect(25.5, 1.5, 1, 1, SPARK)]);
    props.push(motion(sun, "opacity", { from: 0.55, to: 1, period: fast(1100), easing: "ease-in-out" }));
    const sparks = layer([rect(24, 12, 1, 1, SPARK), rect(27, 9, 1, 1, "#B5E08A"), rect(22, 7, 1, 1, SPARK)]);
    const fading = motion(sparks, "opacity", { from: 1, to: 0, period: fast(1400), easing: "ease-in" });
    props.push(motion(layer([fading]), "top", { from: 0, to: px(-5), period: fast(1400), easing: "ease-out" }));
  } else if (thirsty) {
    const dropShape = (x, y, s = 1) => [
      rect(x + 1 * s, y, 1 * s, 1 * s, WATER),
      rect(x + 0.5 * s, y + 1 * s, 2 * s, 1 * s, WATER),
      rect(x, y + 2 * s, 3 * s, 2 * s, WATER),
      rect(x + 0.5 * s, y + 4 * s, 2 * s, 1 * s, WATER),
      rect(x + 0.6 * s, y + 2.2 * s, 0.8 * s, 0.9 * s, WATER_HI),
    ];
    const drops = layer(parched ? [...dropShape(24, 2, 1.2), ...dropShape(27.5, 9, 0.8)] : dropShape(24.5, 3, 1.1));
    props.push(motion(drops, "opacity", { from: 0.25, to: 1, period: parched ? 320 : 640, easing: "linear" }));
  } else if (bloomed) {
    const heart = layer([rect(24, 4, 2, 1, HEART), rect(27, 4, 2, 1, HEART), rect(24, 5, 5, 1, HEART), rect(25, 6, 3, 1, HEART), rect(26, 7, 1, 1, HEART), rect(24.4, 4.2, 0.8, 0.8, "#FFD1E1")]);
    props.push(motion(heart, "top", { from: px(2), to: px(-3), period: 1300, easing: "ease-out" }));
    const star = (x, y) => [rect(x, y + 1, 3, 1, SPARK), rect(x + 1, y, 1, 3, SPARK)];
    props.push(motion(layer([...star(21, 0), ...star(26, 11), ...star(1, 3)]), "opacity", { from: 0.15, to: 1, period: 420, easing: "ease-in-out" }));
  } else if (snoozing) {
    const z = (x, y, s, c) => [rect(x, y, 3 * s, s, c), rect(x + 1 * s, y + 1 * s, s, s, c), rect(x, y + 2 * s, 3 * s, s, c)];
    props.push(motion(layer([...z(22, 9, 0.8, ZZZ), ...z(24.5, 5, 1, "#D6DEFA"), ...z(26.5, 0.5, 1.2, ZZZ)]), "top", { from: 0, to: px(-2.5), period: 2000, easing: "ease-out" }));
  } else if (urging) {
    const bee = layer([
      rect(24, 3, 1, 1, "#E8F4FF"), rect(26, 3, 1, 1, "#E8F4FF"),   // wings
      rect(23, 4, 1, 2, "#2A1A14"), rect(24, 4, 1, 2, SUN), rect(25, 4, 1, 2, "#2A1A14"), rect(26, 4, 1, 2, SUN), rect(27, 4.5, 1, 1, "#2A1A14"),
    ]);
    const wiggle = motion(bee, "top", { from: px(-0.8), to: px(0.8), period: 160, easing: "linear" });
    props.push(motion(layer([wiggle]), "left", { from: px(-6), to: px(1), period: 1400, easing: "ease-in-out" }));
  }

  // A young plant still sits down in its pot: its foliage is shifted down and cut off at the rim.
  const sunk = SUNK[Math.max(0, Math.min(3, growth | 0))];
  const greens = sunk
    ? [div().absolute().left(0).top(0).w(px(COLS)).h(px(13.4)).overflow_hidden()
        .child(div().absolute().left(0).top(px(sunk)).w(px(COLS)).h(px(ROWS)).child(foliage).when(Boolean(head), (el) => el.child(head)))]
    : [foliage, ...(head ? [head] : [])];
  let plant = layer([...wings, ...runs(POTS[species] ?? POTS.sprout), ...greens, ...blush, ...face, ...tear]);
  if (bloomed) plant = motion(plant, "top", { from: 0, to: px(-1.5), period: 320, easing: "ease-in-out" });
  else if (urging) plant = motion(plant, "left", { from: px(-0.3), to: px(0.3), period: 120, easing: "linear" });
  else if (snoozing) plant = motion(plant, "top", { from: 0, to: px(0.4), period: 2000, easing: "ease-in-out" });

  return div().relative().flex_none().w(px(COLS)).h(px(ROWS)).child(plant).children(props);
}

export function plant(status, height, waited = 0, species = "sprout") {
  return plantMood(mood(status, waited), height, { species });
}

// A pixel watering can (16 x 12), for "needs you": click it to go water that agent.
export function wateringCan(c, pouring = false) {
  const r = (x, y, w, h, col = c) => div().absolute().left(x).top(y).w(w).h(h).bg(col);
  const drops = div().absolute().left(0).top(0).w(16).h(14)
    .child(r(15, 8, 1, 2, "#6AAEE0")).child(r(14, 11, 1, 2, "#6AAEE0"));
  return div().relative().w(16).h(14).flex_none()
    .child(r(3, 1, 6, 1)).child(r(2, 2, 1, 3)).child(r(9, 2, 1, 3))        // handle
    .child(r(1, 5, 10, 7)).child(r(2, 6, 3, 1, "#ffffff55"))              // body
    .child(r(11, 7, 2, 1)).child(r(12, 6, 2, 1)).child(r(13, 5, 2, 1))     // spout
    .child(pouring ? drops.loop("opacity", { from: 0.1, to: 1, period: 500, easing: "linear" }) : drops.opacity(0));
}

// The plant picker: every plant as a still preview, plus "Automatic" (the program's own).
// `current` is the picked species or null; onPick(species | null) gets the choice.
export function plantPicker(t, { current, auto, growth = 3, onPick, onClose }) {
  const H = 34;
  const cell = (id, label, species, on) => v_flex().id(`pick-${id}`).w(70).h(64).flex_none().items_center().justify_center().gap(2)
    .rounded(3).border(1).border_color(on ? t.accent : "#00000000").when(on, (el) => el.bg(t.selected))
    .cursor_pointer().hover((el) => el.bg(t.hover))
    .on_click((_e, cx) => { cx.stop_propagation(); onPick(id === "auto" ? null : id); })
    .child(div().w(plantWidth(H)).h(H).child(plantMood("content", H, { still: true, species, growth: 3 })))
    .child(div().w_full().text_center().truncate().text_size(10).text_color(on ? t.foreground : t.muted).child(label));
  const cells = [cell("auto", "Automatic", auto, !current), ...ALL_SPECIES.map((s) => cell(s.id, s.role, s.id, current === s.id))];
  const rows = [];
  for (let i = 0; i < cells.length; i += 5) rows.push(h_flex().gap(4).children(cells.slice(i, i + 5)));
  // Popups size to their content: give the picker a definite width and let the grid set the height.
  return v_flex().w(392).flex_none().p(10).gap(6).bg(t.popover).text_size(12)
    .child(h_flex().items_center().justify_between()
      .child(div().font_semibold().text_color(t.foreground).child("Choose a plant"))
      .child(div().text_size(10.5).text_color(t.dim).child(GROWTH_NAMES[growth] ?? "")))
    .child(v_flex().flex_none().gap(4).children(rows));
}
