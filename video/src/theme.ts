import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadBengali } from '@remotion/google-fonts/NotoSansBengali'
import timing from './timing.json'

const inter = loadInter('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] })
const bengali = loadBengali('normal', { weights: ['400', '600', '700'], subsets: ['bengali'] })

export const FONT = `${inter.fontFamily}, ${bengali.fontFamily}, sans-serif`
export const FPS = 30

export const C = {
  brand: '#0b5cad',
  brandLight: '#3b8ee6',
  teal: '#0fa3a3',
  tealLight: '#5fe0d6',
  navy: '#0f1b2d',
  navyDeep: '#081220',
  ink: '#0c1a2e',
  muted: '#4a6380',
  faint: '#94a3b8',
  soft: '#f6f9fd',
  line: '#e6eef7',
  white: '#ffffff',
  danger: '#e5484d',
  amber: '#f5a524',
}

/** Narration lengths in seconds, measured by tools/timing.py. */
export const VO: Record<string, number> = timing.vo
export const CLIP_SECONDS: Record<string, number> = timing.clips

/** Narration starts this long after a scene opens, and scenes close this long after it ends. */
export const LEAD = 0.4
/** Breath between two demo lines. */
export const DEMO_GAP = 0.35
const END_CARD_HOLD = 2.4

const whole = (seconds: number) => Math.round(seconds * FPS) / FPS

export const DEMO_LINES = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
/** Start second of each demo step inside the demo scene; the last value is the scene end. */
export const DEMO_STARTS = DEMO_LINES.reduce<number[]>(
  (starts, id) => [...starts, whole(starts[starts.length - 1]! + VO[id]! + DEMO_GAP)],
  [0],
)

/** The cold open: the hook question, before the problem is laid out. */
export const HOOK = whole(0.3 + VO.s0! + 0.3)

/** Scene lengths in seconds, in order. Every scene is exactly as long as its narration needs. */
export const SCENES = {
  problem: whole(HOOK + VO.s1! + LEAD),
  solution: whole(LEAD + VO.s2! + LEAD),
  demo: DEMO_STARTS[DEMO_STARTS.length - 1]!,
  ai: whole(LEAD + VO.s4! + LEAD),
  impact: whole(LEAD + VO.s5! + END_CARD_HOLD),
}
export const TOTAL_SECONDS = Object.values(SCENES).reduce((a, b) => a + b, 0)

/**
 * Cue times inside the scenes were set against the first narration take. This maps such a
 * time to where the same word falls in the current take.
 */
export interface Retime {
  k: number
  oldBase: number
  newBase: number
}
export const IDENTITY: Retime = { k: 1, oldBase: 0, newBase: 0 }
export const RETIME = {
  solution: { k: VO.s2! / 22.08, oldBase: 0.8, newBase: LEAD },
  ai: { k: VO.s4! / 23.232, oldBase: 0.8, newBase: LEAD },
  impact: { k: VO.s5! / 21.696, oldBase: 0.8, newBase: LEAD },
} satisfies Record<string, Retime>

export const retime = (r: Retime, at: number) => Math.max(0, r.newBase + (at - r.oldBase) * r.k)
export const untime = (r: Retime, t: number) => (t - r.newBase) / r.k + r.oldBase
