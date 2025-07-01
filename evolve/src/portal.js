import { global, seededRandom } from "./vars.js";
export const monsters = {
  fire_elm: {
    weapon: {
      laser: 1.05,
      flame: 0,
      plasma: 0.25,
      kinetic: 0.5,
      missile: 0.5,
      sonic: 1,
      shotgun: 0.75,
      tesla: 0.65,
      claws: 0.5,
      venom: 0.62,
      cold: 1.25,
      shock: 0.68,
      fire: 0,
      acid: 0.25,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.3,
      ice: 1.12,
      magma: 0,
      axe: 0.5,
      hammer: 0.5
    },
    nozone: {
      freeze: true,
      flooded: true
    },
    amp: {
      hot: 1.75,
      humid: 0.8,
      steam: 0.9
    }
  },
  water_elm: {
    weapon: {
      laser: 0.65,
      flame: 0.5,
      plasma: 1,
      kinetic: 0.2,
      missile: 0.5,
      sonic: 0.5,
      shotgun: 0.25,
      tesla: 0.75,
      claws: 0.4,
      venom: 0.8,
      cold: 1.1,
      shock: 0.68,
      fire: 0.8,
      acid: 0.25,
      stone: 0.4,
      iron: 0.3,
      flesh: 0.5,
      ice: 1.1,
      magma: 0.75,
      axe: 0.45,
      hammer: 0.45
    },
    nozone: {
      hot: true,
      freeze: true
    },
    amp: {
      steam: 1.5,
      river: 1.1,
      flooded: 2,
      rain: 1.75,
      humid: 1.25
    }
  },
  rock_golem: {
    weapon: {
      laser: 1,
      flame: 0.5,
      plasma: 1,
      kinetic: 0.65,
      missile: 0.95,
      sonic: 0.75,
      shotgun: 0.35,
      tesla: 0,
      claws: 0.7,
      venom: 0.25,
      cold: 0.35,
      shock: 0,
      fire: 0.9,
      acid: 1,
      stone: 0.5,
      iron: 0.65,
      flesh: 0.3,
      ice: 0.3,
      magma: 0.9,
      axe: 0.2,
      hammer: 1
    },
    nozone: {},
    amp: {}
  },
  bone_golem: {
    weapon: {
      laser: 0.45,
      flame: 0.35,
      plasma: 0.55,
      kinetic: 1,
      missile: 1,
      sonic: 0.75,
      shotgun: 0.75,
      tesla: 0.15,
      claws: 0.75,
      venom: 0,
      cold: 0.2,
      shock: 0.15,
      fire: 0.4,
      acid: 0.85,
      stone: 0.9,
      iron: 1,
      flesh: 0.15,
      ice: 0.3,
      magma: 0.9,
      axe: 0.65,
      hammer: 1.2
    },
    nozone: {},
    amp: {}
  },
  mech_dino: {
    weapon: {
      laser: 0.85,
      flame: 0.05,
      plasma: 0.55,
      kinetic: 0.45,
      missile: 0.5,
      sonic: 0.35,
      shotgun: 0.5,
      tesla: 1,
      claws: 0.38,
      venom: 0.1,
      cold: 0.5,
      shock: 1.1,
      fire: 0.5,
      acid: 0.75,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.15,
      ice: 0.3,
      magma: 0.9,
      axe: 0.6,
      hammer: 0.4
    },
    nozone: {},
    amp: {}
  },
  plant: {
    weapon: {
      laser: 0.42,
      flame: 1,
      plasma: 0.65,
      kinetic: 0.2,
      missile: 0.25,
      sonic: 0.75,
      shotgun: 0.35,
      tesla: 0.38,
      claws: 0.25,
      venom: 0.25,
      cold: 0.65,
      shock: 0.28,
      fire: 1,
      acid: 0.45,
      stone: 0.6,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.55,
      magma: 1,
      axe: 0.25,
      hammer: 0.15
    },
    nozone: {},
    amp: {}
  },
  crazed: {
    weapon: {
      laser: 0.5,
      flame: 0.85,
      plasma: 0.65,
      kinetic: 1,
      missile: 0.35,
      sonic: 0.15,
      shotgun: 0.95,
      tesla: 0.6,
      claws: 1,
      venom: 0.5,
      cold: 0.5,
      shock: 0.75,
      fire: 0.5,
      acid: 0.5,
      stone: 0.7,
      iron: 0.8,
      flesh: 0.9,
      ice: 0.4,
      magma: 0.5,
      axe: 1,
      hammer: 0.75
    },
    nozone: {},
    amp: {}
  },
  minotaur: {
    weapon: {
      laser: 0.32,
      flame: 0.5,
      plasma: 0.82,
      kinetic: 0.44,
      missile: 1,
      sonic: 0.15,
      shotgun: 0.2,
      tesla: 0.35,
      claws: 0.6,
      venom: 1.1,
      cold: 0.5,
      shock: 0.3,
      fire: 0.5,
      acid: 1,
      stone: 0.6,
      iron: 0.9,
      flesh: 0.3,
      ice: 0.4,
      magma: 0.55,
      axe: 0.75,
      hammer: 0.6
    },
    nozone: {},
    amp: {}
  },
  ooze: {
    weapon: {
      laser: 0.2,
      flame: 0.65,
      plasma: 1,
      kinetic: 0,
      missile: 0,
      sonic: 0.85,
      shotgun: 0,
      tesla: 0.15,
      claws: 0,
      venom: 0.15,
      cold: 1.5,
      shock: 0.2,
      fire: 0.6,
      acid: 0.5,
      stone: 0,
      iron: 0,
      flesh: 0,
      ice: 1.25,
      magma: 0.7,
      axe: 0,
      hammer: 0
    },
    nozone: {},
    amp: {}
  },
  zombie: {
    weapon: {
      laser: 0.35,
      flame: 1,
      plasma: 0.45,
      kinetic: 0.08,
      missile: 0.8,
      sonic: 0.18,
      shotgun: 0.95,
      tesla: 0.05,
      claws: 0.85,
      venom: 0,
      cold: 0.2,
      shock: 0.35,
      fire: 0.95,
      acid: 0.5,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.35,
      ice: 0.25,
      magma: 0.9,
      axe: 1,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  raptor: {
    weapon: {
      laser: 0.68,
      flame: 0.55,
      plasma: 0.85,
      kinetic: 1,
      missile: 0.44,
      sonic: 0.22,
      shotgun: 0.33,
      tesla: 0.66,
      claws: 0.85,
      venom: 0.5,
      cold: 0.5,
      shock: 0.88,
      fire: 0.6,
      acid: 0.6,
      stone: 1,
      iron: 0.85,
      flesh: 0.45,
      ice: 0.5,
      magma: 0.65,
      axe: 0.9,
      hammer: 0.6
    },
    nozone: {},
    amp: {}
  },
  frost_giant: {
    weapon: {
      laser: 0.9,
      flame: 0.82,
      plasma: 1,
      kinetic: 0.25,
      missile: 0.08,
      sonic: 0.45,
      shotgun: 0.28,
      tesla: 0.5,
      claws: 0.35,
      venom: 0.15,
      cold: 0,
      shock: 0.6,
      fire: 1.2,
      acid: 0.5,
      stone: 0.35,
      iron: 1,
      flesh: 0.3,
      ice: 0,
      magma: 1.1,
      axe: 0.5,
      hammer: 1
    },
    nozone: {
      hot: true
    },
    amp: {
      freeze: 2.5,
      hail: 1.65
    }
  },
  swarm: {
    weapon: {
      laser: 0.02,
      flame: 1,
      plasma: 0.04,
      kinetic: 0.01,
      missile: 0.08,
      sonic: 0.66,
      shotgun: 0.38,
      tesla: 0.45,
      claws: 0.05,
      venom: 0.01,
      cold: 0.8,
      shock: 0.75,
      fire: 0.8,
      acid: 0.75,
      stone: 0.03,
      iron: 0.03,
      flesh: 0.03,
      ice: 0.3,
      magma: 0.5,
      axe: 0.01,
      hammer: 0.05
    },
    nozone: {},
    amp: {}
  },
  dragon: {
    weapon: {
      laser: 0.18,
      flame: 0,
      plasma: 0.12,
      kinetic: 0.35,
      missile: 1,
      sonic: 0.22,
      shotgun: 0.65,
      tesla: 0.15,
      claws: 0.38,
      venom: 0.88,
      cold: 0.8,
      shock: 0.35,
      fire: 0,
      acid: 0.85,
      stone: 0.03,
      iron: 0.03,
      flesh: 0.03,
      ice: 0.3,
      magma: 0,
      axe: 0.4,
      hammer: 0.55
    },
    nozone: {},
    amp: {}
  },
  mech_dragon: {
    weapon: {
      laser: 0.84,
      flame: 0.1,
      plasma: 0.68,
      kinetic: 0.18,
      missile: 0.75,
      sonic: 0.22,
      shotgun: 0.28,
      tesla: 1,
      claws: 0.28,
      venom: 0,
      cold: 0.35,
      shock: 1,
      fire: 0.15,
      acid: 0.72,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.2,
      magma: 0.15,
      axe: 0.25,
      hammer: 0.8
    },
    nozone: {},
    amp: {}
  },
  construct: {
    weapon: {
      laser: 0.5,
      flame: 0.2,
      plasma: 0.6,
      kinetic: 0.34,
      missile: 0.9,
      sonic: 0.08,
      shotgun: 0.28,
      tesla: 1,
      claws: 0.28,
      venom: 0,
      cold: 0.45,
      shock: 1.1,
      fire: 0.22,
      acid: 0.68,
      stone: 0.55,
      iron: 0.55,
      flesh: 0.4,
      ice: 0.4,
      magma: 0.18,
      axe: 0.42,
      hammer: 0.95
    },
    nozone: {},
    amp: {}
  },
  beholder: {
    weapon: {
      laser: 0.75,
      flame: 0.15,
      plasma: 1,
      kinetic: 0.45,
      missile: 0.05,
      sonic: 0.01,
      shotgun: 0.12,
      tesla: 0.3,
      claws: 0.48,
      venom: 0.9,
      cold: 0.88,
      shock: 0.24,
      fire: 0.18,
      acid: 0.9,
      stone: 0.72,
      iron: 0.45,
      flesh: 0.85,
      ice: 0.92,
      magma: 0.16,
      axe: 0.44,
      hammer: 0.08
    },
    nozone: {},
    amp: {}
  },
  worm: {
    weapon: {
      laser: 0.55,
      flame: 0.38,
      plasma: 0.45,
      kinetic: 0.2,
      missile: 0.05,
      sonic: 1,
      shotgun: 0.02,
      tesla: 0.01,
      claws: 0.18,
      venom: 0.65,
      cold: 1,
      shock: 0.02,
      fire: 0.38,
      acid: 0.48,
      stone: 0.22,
      iron: 0.24,
      flesh: 0.35,
      ice: 1,
      magma: 0.4,
      axe: 0.15,
      hammer: 0.05
    },
    nozone: {},
    amp: {}
  },
  hydra: {
    weapon: {
      laser: 0.85,
      flame: 0.75,
      plasma: 0.85,
      kinetic: 0.25,
      missile: 0.45,
      sonic: 0.5,
      shotgun: 0.6,
      tesla: 0.65,
      claws: 0.3,
      venom: 0.65,
      cold: 0.55,
      shock: 0.65,
      fire: 0.75,
      acid: 0.85,
      stone: 0.25,
      iron: 0.15,
      flesh: 0.2,
      ice: 0.55,
      magma: 0.75,
      axe: 0.45,
      hammer: 0.65
    },
    nozone: {},
    amp: {}
  },
  colossus: {
    weapon: {
      laser: 1,
      flame: 0.05,
      plasma: 0.75,
      kinetic: 0.45,
      missile: 1,
      sonic: 0.35,
      shotgun: 0.35,
      tesla: 0.5,
      claws: 0.48,
      venom: 0.22,
      cold: 0.25,
      shock: 0.65,
      fire: 0.15,
      acid: 0.95,
      stone: 0.55,
      iron: 0.95,
      flesh: 0.25,
      ice: 0.35,
      magma: 0.2,
      axe: 0.55,
      hammer: 0.35
    },
    nozone: {},
    amp: {}
  },
  lich: {
    weapon: {
      laser: 0.1,
      flame: 0.1,
      plasma: 0.1,
      kinetic: 0.45,
      missile: 0.75,
      sonic: 0.35,
      shotgun: 0.75,
      tesla: 0.5,
      claws: 0.4,
      venom: 0.01,
      cold: 0.1,
      shock: 0.5,
      fire: 0.1,
      acid: 0.1,
      stone: 0.35,
      iron: 0.25,
      flesh: 0.95,
      ice: 0.1,
      magma: 0.1,
      axe: 0.4,
      hammer: 1
    },
    nozone: {},
    amp: {}
  },
  ape: {
    weapon: {
      laser: 1,
      flame: 0.95,
      plasma: 0.85,
      kinetic: 0.5,
      missile: 0.5,
      sonic: 0.05,
      shotgun: 0.35,
      tesla: 0.68,
      claws: 0.65,
      venom: 0.95,
      cold: 0.5,
      shock: 0.5,
      fire: 0.75,
      acid: 0.65,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.5,
      magma: 0.75,
      axe: 0.65,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  bandit: {
    weapon: {
      laser: 0.65,
      flame: 0.5,
      plasma: 0.85,
      kinetic: 1,
      missile: 0.5,
      sonic: 0.25,
      shotgun: 0.75,
      tesla: 0.25,
      claws: 1,
      venom: 0.15,
      cold: 0.5,
      shock: 0.25,
      fire: 0.5,
      acid: 0.5,
      stone: 0.5,
      iron: 0.8,
      flesh: 0.5,
      ice: 0.5,
      magma: 0.5,
      axe: 1,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  croc: {
    weapon: {
      laser: 0.65,
      flame: 0.05,
      plasma: 0.6,
      kinetic: 0.5,
      missile: 0.5,
      sonic: 1,
      shotgun: 0.2,
      tesla: 0.75,
      claws: 1,
      venom: 0.5,
      cold: 1,
      shock: 0.75,
      fire: 0.05,
      acid: 0.08,
      stone: 0.6,
      iron: 0.5,
      flesh: 0.25,
      ice: 0.95,
      magma: 0.05,
      axe: 0.75,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  djinni: {
    weapon: {
      laser: 0,
      flame: 0.35,
      plasma: 1,
      kinetic: 0.15,
      missile: 0,
      sonic: 0.65,
      shotgun: 0.22,
      tesla: 0.4,
      claws: 0.18,
      venom: 0.12,
      cold: 0.9,
      shock: 0.45,
      fire: 0.3,
      acid: 0.1,
      stone: 0.2,
      iron: 0.95,
      flesh: 0.2,
      ice: 0.9,
      magma: 0.3,
      axe: 0.12,
      hammer: 0
    },
    nozone: {},
    amp: {}
  },
  snake: {
    weapon: {
      laser: 0.5,
      flame: 0.5,
      plasma: 0.5,
      kinetic: 0.5,
      missile: 0.5,
      sonic: 0.5,
      shotgun: 0.5,
      tesla: 0.5,
      claws: 0.5,
      venom: 0.02,
      cold: 0.75,
      shock: 0.5,
      fire: 0.5,
      acid: 0.5,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.75,
      magma: 0.5,
      axe: 0.5,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  centipede: {
    weapon: {
      laser: 0.5,
      flame: 0.85,
      plasma: 0.95,
      kinetic: 0.65,
      missile: 0.6,
      sonic: 0,
      shotgun: 0.5,
      tesla: 0.01,
      claws: 0.65,
      venom: 0.01,
      cold: 0,
      shock: 0.01,
      fire: 0.88,
      acid: 0.95,
      stone: 0.6,
      iron: 0.45,
      flesh: 0.55,
      ice: 0,
      magma: 0.88,
      axe: 0.7,
      hammer: 0.4
    },
    nozone: {},
    amp: {}
  },
  spider: {
    weapon: {
      laser: 0.65,
      flame: 1,
      plasma: 0.22,
      kinetic: 0.75,
      missile: 0.15,
      sonic: 0.38,
      shotgun: 0.9,
      tesla: 0.18,
      claws: 0.12,
      venom: 0.05,
      cold: 0.5,
      shock: 0.32,
      fire: 1,
      acid: 0.65,
      stone: 0.8,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.5,
      magma: 1,
      axe: 0.18,
      hammer: 0.75
    },
    nozone: {},
    amp: {}
  },
  manticore: {
    weapon: {
      laser: 0.05,
      flame: 0.25,
      plasma: 0.95,
      kinetic: 0.5,
      missile: 0.15,
      sonic: 0.48,
      shotgun: 0.4,
      tesla: 0.6,
      claws: 0.5,
      venom: 0.5,
      cold: 0.8,
      shock: 0.75,
      fire: 0.15,
      acid: 0.95,
      stone: 0.25,
      iron: 0.5,
      flesh: 0.8,
      ice: 0.8,
      magma: 0.15,
      axe: 0.5,
      hammer: 0.25
    },
    nozone: {},
    amp: {}
  },
  fiend: {
    weapon: {
      laser: 0.75,
      flame: 0.25,
      plasma: 0.5,
      kinetic: 0.25,
      missile: 0.75,
      sonic: 0.25,
      shotgun: 0.5,
      tesla: 0.5,
      claws: 0.65,
      venom: 0.1,
      cold: 0.65,
      shock: 0.5,
      fire: 0.2,
      acid: 0.5,
      stone: 0.25,
      iron: 0.75,
      flesh: 1,
      ice: 0.65,
      magma: 0.2,
      axe: 0.75,
      hammer: 0.25
    },
    nozone: {},
    amp: {}
  },
  bat: {
    weapon: {
      laser: 0.16,
      flame: 0.18,
      plasma: 0.12,
      kinetic: 0.25,
      missile: 0.02,
      sonic: 1,
      shotgun: 0.9,
      tesla: 0.58,
      claws: 0.1,
      venom: 0.1,
      cold: 0.8,
      shock: 0.65,
      fire: 0.15,
      acid: 0.5,
      stone: 0.1,
      iron: 0.1,
      flesh: 0.5,
      ice: 0.8,
      magma: 0.2,
      axe: 0.1,
      hammer: 0.1
    },
    nozone: {},
    amp: {}
  },
  medusa: {
    weapon: {
      laser: 0.35,
      flame: 0.1,
      plasma: 0.3,
      kinetic: 0.95,
      missile: 1,
      sonic: 0.15,
      shotgun: 0.88,
      tesla: 0.26,
      claws: 0.42,
      venom: 0.3,
      cold: 0.48,
      shock: 0.28,
      fire: 0.1,
      acid: 0.85,
      stone: 1,
      iron: 0.25,
      flesh: 0.75,
      ice: 0.52,
      magma: 0.12,
      axe: 0.34,
      hammer: 1
    },
    nozone: {},
    amp: {}
  },
  ettin: {
    weapon: {
      laser: 0.5,
      flame: 0.35,
      plasma: 0.8,
      kinetic: 0.5,
      missile: 0.25,
      sonic: 0.3,
      shotgun: 0.6,
      tesla: 0.09,
      claws: 0.5,
      venom: 0.95,
      cold: 0.3,
      shock: 0.8,
      fire: 0.38,
      acid: 0.9,
      stone: 0.6,
      iron: 0.75,
      flesh: 0.4,
      ice: 0.28,
      magma: 0.32,
      axe: 0.45,
      hammer: 0.25
    },
    nozone: {},
    amp: {}
  },
  faceless: {
    weapon: {
      laser: 0.6,
      flame: 0.28,
      plasma: 0.6,
      kinetic: 0,
      missile: 0.05,
      sonic: 0.8,
      shotgun: 0.15,
      tesla: 1,
      claws: 0.02,
      venom: 0.01,
      cold: 0,
      shock: 1,
      fire: 0.25,
      acid: 0.55,
      stone: 0.15,
      iron: 0.15,
      flesh: 0.95,
      ice: 0,
      magma: 0.25,
      axe: 0.01,
      hammer: 0.05
    },
    nozone: {},
    amp: {}
  },
  enchanted: {
    weapon: {
      laser: 1,
      flame: 0.02,
      plasma: 0.95,
      kinetic: 0.2,
      missile: 0.7,
      sonic: 0.05,
      shotgun: 0.65,
      tesla: 0.01,
      claws: 0.1,
      venom: 0,
      cold: 0.5,
      shock: 0.01,
      fire: 0.02,
      acid: 1,
      stone: 0.25,
      iron: 0.75,
      flesh: 0.1,
      ice: 0.5,
      magma: 0.03,
      axe: 0.1,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  gargoyle: {
    weapon: {
      laser: 0.15,
      flame: 0.4,
      plasma: 0.3,
      kinetic: 0.5,
      missile: 0.5,
      sonic: 0.85,
      shotgun: 1,
      tesla: 0.2,
      claws: 0.45,
      venom: 0.05,
      cold: 0.15,
      shock: 0.08,
      fire: 0.38,
      acid: 0.85,
      stone: 1,
      iron: 0.85,
      flesh: 0.25,
      ice: 0.15,
      magma: 0.35,
      axe: 0.42,
      hammer: 1
    },
    nozone: {},
    amp: {}
  },
  chimera: {
    weapon: {
      laser: 0.38,
      flame: 0.6,
      plasma: 0.42,
      kinetic: 0.85,
      missile: 0.35,
      sonic: 0.5,
      shotgun: 0.65,
      tesla: 0.8,
      claws: 0.92,
      venom: 0.5,
      cold: 0.45,
      shock: 0.8,
      fire: 0.56,
      acid: 0.4,
      stone: 0.5,
      iron: 0.5,
      flesh: 0.5,
      ice: 0.48,
      magma: 0.54,
      axe: 0.88,
      hammer: 0.42
    },
    nozone: {},
    amp: {}
  },
  gorgon: {
    weapon: {
      laser: 0.65,
      flame: 0.65,
      plasma: 0.64,
      kinetic: 0.65,
      missile: 0.66,
      sonic: 0.65,
      shotgun: 0.65,
      tesla: 0.65,
      claws: 0.65,
      venom: 0.65,
      cold: 0.65,
      shock: 0.65,
      fire: 0.65,
      acid: 0.65,
      stone: 0.65,
      iron: 0.65,
      flesh: 0.65,
      ice: 0.65,
      magma: 0.65,
      axe: 0.65,
      hammer: 0.65
    },
    nozone: {},
    amp: {}
  },
  kraken: {
    weapon: {
      laser: 0.75,
      flame: 0.35,
      plasma: 0.75,
      kinetic: 0.35,
      missile: 0.5,
      sonic: 0.18,
      shotgun: 0.05,
      tesla: 0.85,
      claws: 0.32,
      venom: 0.8,
      cold: 0.66,
      shock: 0.82,
      fire: 0.33,
      acid: 0.75,
      stone: 0.45,
      iron: 0.35,
      flesh: 0.4,
      ice: 0.66,
      magma: 0.33,
      axe: 0.36,
      hammer: 0.5
    },
    nozone: {},
    amp: {}
  },
  homunculus: {
    weapon: {
      laser: 0.05,
      flame: 1,
      plasma: 0.1,
      kinetic: 0.85,
      missile: 0.65,
      sonic: 0.5,
      shotgun: 0.75,
      tesla: 0.2,
      claws: 0.85,
      venom: 0.4,
      cold: 0.12,
      shock: 0.22,
      fire: 1,
      acid: 0.13,
      stone: 0.65,
      iron: 0.68,
      flesh: 0.95,
      ice: 0.18,
      magma: 0.9,
      axe: 0.85,
      hammer: 0.65
    },
    nozone: {},
    amp: {}
  },
  giant_chicken: {
    weapon: {
      laser: 0.95,
      flame: 0.95,
      plasma: 0.95,
      kinetic: 0.95,
      missile: 0.95,
      sonic: 0.95,
      shotgun: 0.95,
      tesla: 0.95,
      claws: 0.95,
      venom: 0.96,
      cold: 0.95,
      shock: 0.95,
      fire: 0.95,
      acid: 0.95,
      stone: 0.95,
      iron: 0.95,
      flesh: 0.94,
      ice: 0.95,
      magma: 0.95,
      axe: 0.95,
      hammer: 0.95
    },
    nozone: {},
    amp: {}
  },
  skeleton_pack: {
    weapon: {
      laser: 0.5,
      flame: 0.1,
      plasma: 0.5,
      kinetic: 1,
      missile: 1.2,
      sonic: 0.5,
      shotgun: 1.05,
      tesla: 0.2,
      claws: 0.65,
      venom: 0,
      cold: 0.11,
      shock: 0.22,
      fire: 0.1,
      acid: 0.5,
      stone: 1,
      iron: 0.65,
      flesh: 0.25,
      ice: 0.1,
      magma: 0.12,
      axe: 0.15,
      hammer: 1.08
    },
    nozone: {},
    amp: {}
  }
};
export function mechCost(size, infernal, standardize) {
  let soul = 9999;
  let cost = 1e7;
  switch (size) {
    case "small":
      {
        let baseCost = global.blood["prepared"] && global.blood.prepared >= 2 ? 5e4 : 75e3;
        cost = infernal ? baseCost * 2.5 : baseCost;
        soul = infernal ? 20 : 1;
      }
      break;
    case "medium":
      {
        cost = infernal ? 45e4 : 18e4;
        soul = infernal ? 100 : 4;
      }
      break;
    case "large":
      {
        cost = infernal ? 925e3 : 375e3;
        soul = infernal ? 500 : 20;
      }
      break;
    case "titan":
      {
        cost = infernal ? 15e5 : 75e4;
        soul = infernal ? 1500 : 75;
      }
      break;
    case "collector":
      {
        let baseCost = global.blood["prepared"] && global.blood.prepared >= 2 ? 8e3 : 1e4;
        cost = infernal ? baseCost * 2.5 : baseCost;
        soul = 1;
      }
      break;
    case "minion":
      {
        let baseCost = global.blood["prepared"] && global.blood.prepared >= 2 ? 3e4 : 5e4;
        cost = infernal ? baseCost * 2.5 : baseCost;
        soul = infernal ? 10 : 1;
      }
      break;
    case "fiend":
      {
        cost = infernal ? 3e5 : 125e3;
        soul = infernal ? 40 : 4;
      }
      break;
    case "cyberdemon":
      {
        cost = infernal ? 625e3 : 25e4;
        soul = infernal ? 120 : 12;
      }
      break;
    case "archfiend":
      {
        cost = infernal ? 12e5 : 6e5;
        soul = infernal ? 250 : 25;
      }
      break;
  }
  if (standardize) {
    return {
      Soul_Gem() {
        return soul;
      },
      Supply() {
        return cost;
      }
    };
  }
  return { s: soul, c: cost };
}
function bossResists(boss) {
  let weak = `laser`;
  let resist = `laser`;
  let standardList = ["laser", "flame", "plasma", "kinetic", "missile", "sonic", "shotgun", "tesla"];
  Object.keys(monsters[boss].weapon).forEach(function(weapon) {
    if (global.race["warlord"] || standardList.includes(weapon)) {
      if (checkBossResist(boss, weapon) > checkBossResist(boss, weak)) {
        weak = weapon;
      }
      if (checkBossResist(boss, weapon) < checkBossResist(boss, resist)) {
        resist = weapon;
      }
    }
  });
  if (weak === resist) {
    weak = "none";
    resist = "none";
  }
  return { w: weak, r: resist };
}
export function checkBossResist(boss, weapon) {
  let effectiveness = monsters[boss].weapon[weapon];
  let seed = global.stats.reset + (global.portal?.spire?.count || 1);
  let seed_r1 = Math.floor(seededRandom(0, 25e3, false, seed + (global.portal?.spire?.count || 1) * 2));
  let seed_w1 = Math.floor(seededRandom(0, 25e3, false, seed + global.stats.reset * 2));
  let weaponList = global.race["warlord"] ? ["laser", "kinetic", "shotgun", "missile", "flame", "plasma", "sonic", "tesla", "claws", "venom", "cold", "shock", "fire", "acid", "stone", "iron", "flesh", "ice", "magma", "axe", "hammer"] : ["laser", "kinetic", "shotgun", "missile", "flame", "plasma", "sonic", "tesla"];
  let resist = weaponList[Math.floor(seededRandom(0, weaponList.length, false, seed_r1))];
  let weak = weaponList[Math.floor(seededRandom(0, weaponList.length, false, seed_w1))];
  if (weapon === resist) {
    let seed_r2 = Math.floor(seededRandom(0, 25e3, false, seed_r1 + (global.portal?.spire?.count || 1) * 3));
    effectiveness -= Math.floor(seededRandom(0, 26, false, seed_r2)) / 100;
    if (effectiveness < 0) {
      effectiveness = 0;
    }
  } else if (weapon === weak) {
    let seed_w2 = Math.floor(seededRandom(0, 25e3, false, seed_w1 + global.stats.reset * 3));
    effectiveness += Math.floor(seededRandom(0, 26, false, seed_w2)) / 100;
  }
  return effectiveness;
}
export function validWeapons(size, type, point) {
  let weaponList = ["laser", "kinetic", "shotgun", "missile", "flame", "plasma", "sonic", "tesla"];
  if (global.race["warlord"]) {
    switch (size) {
      case "minion":
        if (type === "harpy") {
          weaponList = ["claws", "venom"];
        } else if (type === "hound") {
          weaponList = ["cold", "shock", "fire", "acid"];
        } else if (type === "barghest") {
          weaponList = ["claws", "venom"];
        }
        break;
      case "fiend":
        if (type === "minotaur") {
          weaponList = ["axe", "hammer"];
        } else if (type === "nightmare") {
          weaponList = ["cold", "shock", "fire", "acid"];
        } else if (type === "golem") {
          weaponList = ["stone", "iron", "flesh", "ice", "magma"];
        }
        break;
      case "archfiend":
        if (point === void 0 || point === false) {
          weaponList = ["claws", "venom", "cold", "shock", "fire", "acid"];
          switch (type) {
            case "dragon":
              weaponList = ["claws", "cold", "shock", "fire", "acid"];
              break;
            case "snake":
              weaponList = ["venom", "cold", "shock", "fire", "acid"];
              break;
            case "gorgon":
              weaponList = ["axe", "hammer", "cold", "shock", "fire", "acid"];
              break;
            case "hydra":
              weaponList = ["cold", "shock", "fire", "acid"];
              break;
          }
        } else {
          switch (type) {
            case "dragon":
              weaponList = point === 0 ? ["claws"] : ["cold", "shock", "fire", "acid"];
              break;
            case "snake":
              weaponList = point === 0 ? ["venom"] : ["cold", "shock", "fire", "acid"];
              break;
            case "gorgon":
              weaponList = point === 0 ? ["axe", "hammer"] : ["cold", "shock", "fire", "acid"];
              break;
            case "hydra":
              let list = ["cold", "shock", "fire", "acid"];
              weaponList = [list[point]];
              break;
          }
        }
        break;
    }
  }
  return weaponList;
}
export function validEquipment(size, type, point) {
  let equipList = ["special", "shields", "sonar", "grapple", "infrared", "flare", "radiator", "coolant", "ablative", "stabilizer", "seals"];
  if (global.race["warlord"]) {
    switch (size) {
      case "minion":
        equipList = ["scavenger", "scouter", "darkvision", "echo", "thermal", "manashield", "cold", "heat", "athletic", "lucky", "stoneskin"];
        break;
      case "fiend":
      case "archfiend":
        equipList = ["darkvision", "echo", "thermal", "manashield", "cold", "heat", "athletic", "lucky", "stoneskin"];
        break;
    }
  }
  return equipList;
}
export function mechSize(s) {
  switch (s) {
    case "minion":
      return 1;
    case "small":
      return 2;
    case "fiend":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 3 : 4;
    case "medium":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 4 : 5;
    case "cyberdemon":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 6 : 8;
    case "large":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 8 : 10;
    case "archfiend":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 15 : 20;
    case "titan":
      return global.blood["prepared"] && global.blood.prepared >= 2 ? 20 : 25;
    case "collector":
      return 1;
    case "default":
      return 25;
  }
}
export function genSpireFloor() {
  let types = ["sand", "swamp", "forest", "jungle", "rocky", "gravel", "muddy", "grass", "brush", "concrete"];
  global.portal.spire.type = types[Math.floor(seededRandom(0, types.length))];
  if (global.portal.spire.count >= 10) {
    global.portal.spire.status = {};
    let effects = ["freeze", "hot", "corrosive", "humid", "windy", "hilly", "mountain", "radioactive", "quake", "dust", "river", "tar", "steam", "flooded", "fog", "rain", "hail", "chasm", "dark", "gravity"];
    assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
    if (global.portal.spire.count >= 25 && global.portal.spire.count <= 100) {
      let odds = 105 - global.portal.spire.count;
      if (Math.floor(seededRandom(0, odds) <= 5)) {
        assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      }
    } else if (global.portal.spire.count > 100 && global.portal.spire.count <= 250) {
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      let odds = 260 - global.portal.spire.count;
      if (Math.floor(seededRandom(0, odds) <= 10)) {
        assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      }
    } else if (global.portal.spire.count > 250 && global.portal.spire.count <= 1e3) {
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      let odds = 1025 - global.portal.spire.count;
      if (Math.floor(seededRandom(0, odds) <= 25)) {
        assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      }
    } else if (global.portal.spire.count > 1e3) {
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
      assignValidStatus(effects[Math.floor(seededRandom(0, effects.length))]);
    }
  }
  let mobs = Object.keys(monsters).filter(function(k) {
    let exclude = Object.keys(monsters[k].nozone);
    if (exclude.some((i) => Object.keys(global.portal.spire.status).includes(i)) || exclude.includes(global.portal.spire.type)) {
      return false;
    }
    return true;
  });
  global.portal.spire.boss = mobs[Math.floor(seededRandom(0, mobs.length))];
}
function assignValidStatus(effect) {
  if (global.portal.spire.status["freeze"] || global.portal.spire.status["hot"]) {
    if (effect !== "freeze" && effect !== "hot") {
      global.portal.spire.status[effect] = true;
    }
  } else if (global.portal.spire.status["rain"] || global.portal.spire.status["hail"]) {
    if (effect !== "rain" && effect !== "hail") {
      global.portal.spire.status[effect] = true;
    }
  } else {
    global.portal.spire.status[effect] = true;
  }
}
export function terrainRating(mech, rating, effects) {
  if (mech.equip.includes("special") && (mech.size === "small" || mech.size === "medium" || mech.size === "collector")) {
    if (rating < 1) {
      rating += (1 - rating) * (effects.includes("gravity") ? 0.1 : 0.2);
    }
  }
  if (mech.size !== "small" && rating < 1) {
    rating += (effects.includes("fog") || effects.includes("dark") ? 5e-3 : 0.01) * global.portal.mechbay.scouts;
    if (rating > 1) {
      rating = 1;
    }
  }
  return rating;
}
export function weaponPower(mech, power) {
  if (power < 1 && power !== 0) {
    if (mech.equip.includes("special") && mech.size === "titan") {
      power += (1 - power) * 0.25;
    }
  }
  if (mech.equip.includes("special") && (mech.size === "large" || mech.size === "cyberdemon")) {
    power *= 1.02;
  }
  return power;
}
export function statusEffect(mech, effect) {
  let rating = 1;
  switch (effect) {
    case "freeze":
      {
        if (!mech.equip.includes("radiator") && !mech.equip.includes("cold")) {
          rating = 0.25;
        }
      }
      break;
    case "hot":
      {
        if (!mech.equip.includes("coolant") && !mech.equip.includes("heat")) {
          rating = 0.25;
        }
      }
      break;
    case "corrosive":
      {
        if (!mech.equip.includes("ablative")) {
          if (mech.equip.includes("stoneskin")) {
            rating = 0.9;
          } else if (mech.equip.includes("shields")) {
            rating = 0.75;
          } else {
            rating = mech.equip.includes("manashield") ? 0.5 : 0.25;
          }
        }
      }
      break;
    case "humid":
      {
        if (!mech.equip.includes("seals")) {
          rating = mech.equip.includes("heat") ? 0.85 : 0.75;
        }
      }
      break;
    case "windy":
      {
        if (["hover", "flying_imp", "harpy", "dragon"].includes(mech.chassis)) {
          rating = 0.5;
        }
      }
      break;
    case "hilly":
      {
        if (!["spider", "flying_imp", "harpy", "dragon"].includes(mech.chassis)) {
          rating = 0.75;
        }
      }
      break;
    case "mountain":
      {
        if (mech.chassis !== "spider" && !mech.equip.includes("grapple")) {
          rating = mech.equip.includes("flare") || mech.equip.includes("echo") ? 0.75 : 0.5;
        }
      }
      break;
    case "radioactive":
      {
        if (!mech.equip.includes("shields") && mech.equip.includes("manashield")) {
          rating = 0.5;
        }
      }
      break;
    case "quake":
      {
        if (!mech.equip.includes("stabilizer")) {
          rating = mech.equip.includes("athletic") ? 0.75 : 0.25;
        }
      }
      break;
    case "dust":
      {
        if (!mech.equip.includes("seals") && !mech.equip.includes("thermal")) {
          rating = 0.5;
        }
      }
      break;
    case "river":
      {
        if (!["hover", "flying_imp", "harpy", "dragon"].includes(mech.chassis)) {
          rating = 0.65;
        }
      }
      break;
    case "tar":
      {
        if (mech.chassis !== "quad") {
          rating = mech.chassis === "tread" || mech.chassis === "wheel" ? 0.5 : 0.75;
        }
      }
      break;
    case "steam":
      {
        if (!mech.equip.includes("shields") && !mech.equip.includes("heat")) {
          rating = 0.75;
        }
      }
      break;
    case "flooded":
      {
        if (mech.chassis !== "hover") {
          rating = ["snake"].includes(mech.chassis) ? 0.85 : 0.35;
        }
      }
      break;
    case "fog":
      {
        if (!mech.equip.includes("sonar") && !mech.equip.includes("echo")) {
          rating = 0.2;
        }
      }
      break;
    case "rain":
      {
        if (!mech.equip.includes("seals")) {
          rating = mech.equip.includes("cold") ? 0.9 : 0.75;
        }
      }
      break;
    case "hail":
      {
        if (!mech.equip.includes("ablative") && !mech.equip.includes("shields") && !mech.equip.includes("manashield") && !mech.equip.includes("stoneskin")) {
          rating = 0.75;
        }
      }
      break;
    case "chasm":
      {
        if (!mech.equip.includes("grapple") && !["flying_imp", "harpy", "dragon"].includes(mech.chassis)) {
          rating = mech.equip.includes("athletic") ? 0.35 : 0.1;
        }
      }
      break;
    case "dark":
      {
        if (!mech.equip.includes("infrared") && !mech.equip.includes("darkvision")) {
          rating = mech.equip.includes("flare") ? 0.25 : 0.1;
        }
      }
      break;
    case "gravity":
      {
        switch (mech.size) {
          case "fiend":
          case "medium":
            rating = 0.8;
            break;
          case "cyberdemon":
            rating = 0.5;
          case "large":
            rating = 0.45;
            break;
          case "archfiend":
            rating = 0.35;
          case "titan":
            rating = 0.25;
            break;
        }
        if (["flying_imp", "harpy", "dragon"].includes(mech.chassis)) {
          rating -= 0.15;
        }
        if (mech.equip.includes("athletic") && rating < 1) {
          rating += 0.1;
        }
      }
      break;
  }
  if (mech.equip.includes("lucky")) {
    rating += 0.01 * Math.floor(seededRandom(1, 10, false, global.stats.resets + (global.portal?.spire?.count || 1) * 42));
    if (rating > 1) {
      rating = 1;
    }
  }
  return rating;
}
export function terrainEffect(mech, type) {
  let terrain = type || global.portal.spire.type;
  let terrainFactor = 1;
  switch (mech.chassis) {
    case "wheel":
    case "nightmare":
    case "hound":
      {
        switch (terrain) {
          case "sand":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.9 : 0.85;
            break;
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.35 : 0.18;
            break;
          case "jungle":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.92 : 0.85;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.65 : 0.5;
            break;
          case "gravel":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1 : 0.95;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.85 : 0.58;
            break;
          case "grass":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.3 : 1.2;
            break;
          case "brush":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.9 : 0.8;
            break;
          case "concrete":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.1 : 1;
            break;
        }
      }
      break;
    case "tread":
    case "rakshasa":
    case "harpy":
    case "dragon":
      {
        switch (terrain) {
          case "sand":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.15 : 1.1;
            break;
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.55 : 0.4;
            break;
          case "forest":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1 : 0.95;
            break;
          case "jungle":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.95 : 0.9;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.65 : 0.5;
            break;
          case "gravel":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.3 : 1.2;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.88 : 0.72;
            break;
        }
      }
      break;
    case "cambion":
    case "biped":
    case "imp":
    case "gorgon":
      {
        switch (terrain) {
          case "sand":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.78 : 0.65;
            break;
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.68 : 0.5;
            break;
          case "forest":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1 : 0.95;
            break;
          case "jungle":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.82 : 0.7;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.48 : 0.4;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.85 : 0.7;
            break;
          case "grass":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.25 : 1.2;
            break;
          case "brush":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.92 : 0.85;
            break;
        }
      }
      break;
    case "quad":
    case "golem":
    case "barghest":
      {
        switch (terrain) {
          case "sand":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.86 : 0.75;
            break;
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.58 : 0.42;
            break;
          case "forest":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.25 : 1.2;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.95 : 0.9;
            break;
          case "gravel":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.9 : 0.8;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.68 : 0.5;
            break;
          case "grass":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1 : 0.95;
            break;
          case "brush":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.95 : 0.9;
            break;
        }
      }
      break;
    case "spider":
    case "minotaur":
    case "hydra":
      {
        switch (terrain) {
          case "sand":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.75 : 0.65;
            break;
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.9 : 0.78;
            break;
          case "forest":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.82 : 0.75;
            break;
          case "jungle":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.77 : 0.65;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.25 : 1.2;
            break;
          case "gravel":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.86 : 0.75;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.92 : 0.82;
            break;
          case "brush":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1 : 0.95;
            break;
        }
      }
      break;
    case "hover":
    case "flying_imp":
    case "snake":
      {
        switch (terrain) {
          case "swamp":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.35 : 1.2;
            break;
          case "forest":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.65 : 0.48;
            break;
          case "jungle":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.55 : 0.35;
            break;
          case "rocky":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.82 : 0.68;
            break;
          case "muddy":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 1.15 : 1.08;
            break;
          case "brush":
            terrainFactor = ["small", "medium", "minion", "fiend"].includes(mech.size) ? 0.78 : 0.7;
            break;
        }
      }
      break;
  }
  return terrainFactor;
}
export function mechCollect(mech) {
  let rating = mech.infernal ? 31.25 : 25;
  let terrainFactor = terrainEffect(mech);
  let effects = [];
  Object.keys(global.portal.spire.status).forEach(function(effect) {
    effects.push(effect);
    rating *= statusEffect(mech, effect);
  });
  rating *= terrainRating(mech, terrainFactor, effects);
  if (global.race["warlord"]) {
    rating *= 0.1;
  }
  return rating;
}
export function mechWeaponPower(size) {
  switch (size) {
    case "minion":
      return 15e-4;
    case "small":
      return 25e-4;
    case "fiend":
      return 6e-3;
    case "medium":
      return 75e-4;
    case "cyberdemon":
      return 9e-3;
    case "large":
      return 0.01;
    case "archfiend":
      return 0.011;
    case "titan":
      return 0.012;
    default:
      return 0;
  }
}
export function mechRating(mech, boss) {
  let rating = mechWeaponPower(mech.size);
  if (rating === 0) {
    return 0;
  }
  if (mech.hasOwnProperty("infernal") && mech.infernal && global.blood["prepared"] && global.blood.prepared >= 3) {
    rating *= 1.25;
  }
  if (global.blood["wrath"]) {
    rating *= 1 + global.blood.wrath / 20;
  }
  if (mech.size === "archfiend" && mech.chassis != "hydra") {
    rating *= 2;
  }
  if (boss) {
    if (global.stats.achieve["gladiator"] && global.stats.achieve.gladiator.l > 0) {
      rating *= 1 + global.stats.achieve.gladiator.l * 0.1;
    }
    if (mech.size === "titan" || mech.size === "archfiend") {
      rating *= 1.1;
    }
    let affix = universeAffix();
    if (global.stats.spire.hasOwnProperty(affix) && global.stats.spire[affix].hasOwnProperty("dlstr")) {
      rating /= 100 + global.stats.spire[affix].dlstr * 25;
    } else {
      rating /= 100;
    }
    let damage = 0;
    for (let i = 0; i < mech.hardpoint.length; i++) {
      damage += rating * weaponPower(mech, 1);
    }
    return damage;
  } else {
    if (global.stats.achieve["gladiator"] && global.stats.achieve.gladiator.l > 0) {
      rating *= 1 + global.stats.achieve.gladiator.l * 0.2;
    }
    if (global.portal.spire.type === "concrete") {
      switch (mech.size) {
        case "minion":
        case "small":
          rating *= 0.92;
          break;
        case "fiend":
        case "medium":
          rating *= 0.95;
          break;
        case "archfiend":
        case "titan":
          rating *= 1.25;
          break;
      }
    }
    let terrainFactor = terrainEffect(mech);
    let effects = [];
    Object.keys(global.portal.spire.status).forEach(function(effect) {
      effects.push(effect);
      rating *= statusEffect(mech, effect);
    });
    rating *= terrainRating(mech, terrainFactor, effects);
    rating /= global.portal.spire.count;
    let damage = 0;
    for (let i = 0; i < mech.hardpoint.length; i++) {
      let effect = checkBossResist(global.portal.spire.boss, mech.hardpoint[i]);
      damage += rating * weaponPower(mech, effect);
    }
    return damage;
  }
}
