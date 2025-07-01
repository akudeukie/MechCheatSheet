export var save = (() => {
  try {
    if (typeof window !== "undefined") return window.localStorage;
    else return { getItem() {
      return "";
    }, setItem() {
    } };
  } catch (e) {
    return { getItem() {
      return "";
    }, setItem() {
    } };
  }
})();
export var global = {
  seed: 1,
  warseed: 1,
  resource: {},
  evolution: {},
  tech: {},
  city: {},
  space: {},
  interstellar: {},
  portal: {},
  eden: {},
  tauceti: {},
  civic: {},
  race: {},
  genes: {},
  blood: {},
  stats: {
    start: Date.now(),
    days: 0,
    tdays: 0
  },
  event: {
    t: 200,
    l: false
  },
  m_event: {
    t: 499,
    l: false
  }
};
Math.rand = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};
global["seed"] = 2;
global["warseed"] = 2;
export function seededRandom(min, max, alt, useSeed) {
  max = max || 1;
  min = min || 0;
  let seed = useSeed || global[alt ? "warseed" : "seed"];
  let newSeed = (seed * 9301 + 49297) % 233280;
  let rnd = newSeed / 233280;
  if (!useSeed) {
    global[alt ? "warseed" : "seed"] = newSeed;
  }
  return min + rnd * (max - min);
}
export function setGlobal(gameState) {
  global = gameState;
}
if (!global["version"]) {
  global["version"] = "0.2.0";
}
global["version"] = "1.4.8";
delete global["revision"];
delete global["beta"];
if (!global["settings"]) {
  global["settings"] = {
    showEvolve: true,
    showAchieve: false,
    animated: true,
    disableReset: false,
    font: "standard",
    q_merge: "merge_nearby",
    cLabels: true,
    theme: "gruvboxDark",
    locale: "en-US",
    icon: "star"
  };
}
if (!global["eden"]) {
  global["eden"] = {};
}
if (!global.settings["locale"]) {
  global.settings["locale"] = "en-US";
}
export function setupStats() {
  [
    "reset",
    "plasmid",
    "antiplasmid",
    "universes",
    "phage",
    "starved",
    "tstarved",
    "died",
    "tdied",
    "sac",
    "tsac",
    "know",
    "tknow",
    "portals",
    "dkills",
    "attacks",
    "cfood",
    "tfood",
    "cstone",
    "tstone",
    "clumber",
    "tlumber",
    "mad",
    "bioseed",
    "cataclysm",
    "blackhole",
    "ascend",
    "descend",
    "apotheosis",
    "terraform",
    "aiappoc",
    "matrix",
    "retire",
    "eden",
    "geck",
    "dark",
    "harmony",
    "blood",
    "cores",
    "artifact",
    "supercoiled",
    "cattle",
    "tcattle",
    "murders",
    "tmurders",
    "psykill",
    "tpsykill",
    "pdebt",
    "uDead"
  ].forEach(function(k) {
    if (!global.stats.hasOwnProperty(k)) {
      global.stats[k] = 0;
    }
  });
  if (!global.stats["achieve"]) {
    global.stats["achieve"] = {};
  }
  if (!global.stats["feat"]) {
    global.stats["feat"] = {};
  }
  if (!global.stats.hasOwnProperty("womling")) {
    global.stats["womling"] = {
      god: { l: 0 },
      lord: { l: 0 },
      friend: { l: 0 }
    };
  }
  if (!global.stats["spire"]) {
    global.stats["spire"] = {};
  }
  if (!global.stats["synth"]) {
    global.stats["synth"] = {};
  }
  if (!global.stats.hasOwnProperty("banana")) {
    global.stats["banana"] = {
      b1: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b2: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b3: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b4: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b5: { l: false, h: false, a: false, e: false, m: false, mg: false }
    };
  }
  if (!global.stats.hasOwnProperty("endless_hunger")) {
    global.stats["endless_hunger"] = {
      b1: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b2: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b3: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b4: { l: false, h: false, a: false, e: false, m: false, mg: false },
      b5: { l: false, h: false, a: false, e: false, m: false, mg: false }
    };
  }
  if (!global.stats.hasOwnProperty("death_tour")) {
    global.stats["death_tour"] = {
      ct: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 },
      bh: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 },
      di: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 },
      ai: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 },
      vc: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 },
      md: { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 }
    };
  }
  if (global.stats["death_tour"] && !global.stats.death_tour.hasOwnProperty("md")) {
    global.stats.death_tour["md"] = { l: 0, h: 0, a: 0, e: 0, m: 0, mg: 0 };
  }
  if (!global.stats["warlord"]) {
    global.stats["warlord"] = { k: false, p: false, a: false, r: false, g: false };
  }
}
setupStats();
if (!global.race["universe"]) {
  global.race["universe"] = "standard";
}
if (!global.settings["affix"]) {
  global.settings["affix"] = "si";
}
function newGameData() {
  global["race"] = { species: "protoplasm", gods: "none", old_gods: "none", seeded: false };
  global["seed"] = Math.rand(0, 1e4);
  global["warseed"] = Math.rand(0, 1e4);
  global["new"] = true;
}
