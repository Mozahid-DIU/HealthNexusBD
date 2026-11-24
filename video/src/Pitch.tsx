import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion'
import { AiFlow, NODES } from './scenes/AiFlow'
import { Demo, SMS_AT } from './scenes/Demo'
import { END_AT, Impact, MEASURES, NEXT } from './scenes/Impact'
import { HOOK_SLAM, PROBLEM_POPS, Problem } from './scenes/Problem'
import { EDGES, Solution } from './scenes/Solution'
import { C, DEMO_LINES, DEMO_STARTS, FPS, HOOK, LEAD, RETIME, SCENES, TOTAL_SECONDS, VO, retime } from './theme'
import { Captions, type CaptionLine } from './ui'

const START = {
  problem: 0,
  solution: SCENES.problem,
  demo: SCENES.problem + SCENES.solution,
  ai: SCENES.problem + SCENES.solution + SCENES.demo,
  impact: SCENES.problem + SCENES.solution + SCENES.demo + SCENES.ai,
}

interface Voice extends CaptionLine {
  file: string
}

const voice = (file: string, start: number, phrases: string[]): Voice => ({ file, start, duration: VO[file]!, phrases })

const DEMO_PHRASES: Record<string, string[]> = {
  d1: ['Here is the working system, live.', 'A doctor searches for a patient by health ID,', 'and asks for access to the record.'],
  d2: ["A one-time code goes to the patient's phone.", 'No code, no access. The patient stays in control.'],
  d3: ['The chart opens with an AI briefing of the full history,', "and a warning about the patient's sulfa allergy."],
  d4: ['Labs are part of it too.', "A diagnostic lab uploads the report straight into the patient's record,", 'so no result gets lost on paper.'],
  d5: [
    'Now the patient.',
    'She attaches a visit record and asks, in Bangla, what it means.',
    'The assistant explains that her thyroid level is high,',
    'why the medicine was given, and reminds her of her allergy.',
  ],
  d6: ['If a message sounds like an emergency,', 'a 999 call-out appears at once, even if the AI is offline.'],
  d7: ["And every access to the record, including the AI's,", 'is logged for the patient to see.'],
}

/** Narration: file, when it starts, and its subtitles. Lengths come from the audio itself. */
const VOICE: Voice[] = [
  voice('s0', 0.3, ['Can you read your own lab report?', "Most patients in Bangladesh can't."]),
  voice('s1', HOOK, [
    'Our medical history lives in paper files, written in English medical terms.',
    'Doctors get a few minutes per patient, with no history in front of them.',
    'So allergies get missed, medicines clash, and patients go home confused.',
    'It is a problem for millions here, and across the developing world.',
  ]),
  voice('s2', START.solution + LEAD, [
    'HealthNexus BD is a unified health record with a personal AI assistant built in.',
    'Patients ask about their own records and lab reports,',
    'and get answers in plain Bangla or English.',
    'Doctors get an AI briefing before every consultation.',
    'Unlike a general chatbot, it knows your real history, it speaks Bangla,',
    'and it never sends your identity to the model.',
  ]),
  ...DEMO_LINES.map((id, i) => voice(id, START.demo + DEMO_STARTS[i]! + 0.15, DEMO_PHRASES[id]!)),
  voice('s4', START.ai + LEAD, [
    "Under the hood: the question and the patient's own records are combined on our server.",
    'Names, phone numbers and national IDs are stripped, in English and Bangla,',
    'before anything reaches Google Gemini.',
    'The answer is grounded in real records, not guesses.',
    'Rule-based checks for allergies and drug interactions run every time,',
    'and if the model fails, the system falls back safely.',
  ]),
  voice('s5', START.impact + LEAD, [
    'Our goal: every patient understands their own report,',
    'and no doctor misses a known allergy.',
    'We will measure report comprehension, alerts caught,',
    'and time saved per consultation.',
    'Next, we add voice questions in Bangla, reading of scanned reports,',
    'and a pilot with a local clinic.',
    'HealthNexus BD. Your health record, explained.',
  ]),
]

interface Sfx {
  file: 'pop' | 'whoosh' | 'hit' | 'ding'
  at: number
  volume: number
}

const pops = (start: number, times: number[]): Sfx[] => times.map((at) => ({ file: 'pop', at: start + at, volume: 0.8 }))

/** Every card that lands gets a pop, every scene or step change a whoosh. */
const SFX: Sfx[] = [
  { file: 'hit', at: HOOK_SLAM, volume: 0.9 },
  { file: 'whoosh', at: HOOK - 0.25, volume: 0.7 },
  ...pops(START.problem, PROBLEM_POPS),
  ...[START.solution, START.demo, START.ai, START.impact].map((at): Sfx => ({ file: 'whoosh', at: at - 0.2, volume: 0.7 })),
  ...pops(START.solution, [5, 10.4, ...EDGES.map((e) => e.at)].map((at) => retime(RETIME.solution, at))),
  ...DEMO_STARTS.slice(1, -1).map((at): Sfx => ({ file: 'whoosh', at: START.demo + at - 0.2, volume: 0.45 })),
  { file: 'ding', at: START.demo + DEMO_STARTS[1]! + SMS_AT, volume: 0.9 },
  ...pops(START.ai, [...NODES.map((n) => n.at), 5.6, 12.4].map((at) => retime(RETIME.ai, at))),
  ...pops(START.impact, [...MEASURES, ...NEXT].map((m) => retime(RETIME.impact, m.at))),
  { file: 'hit', at: START.impact + retime(RETIME.impact, END_AT), volume: 0.7 },
]

const SCENE_LIST = [
  { key: 'problem', Component: Problem },
  { key: 'solution', Component: Solution },
  { key: 'demo', Component: Demo },
  { key: 'ai', Component: AiFlow },
  { key: 'impact', Component: Impact },
] as const

const MUSIC_BED = 0.085
const MUSIC_OPEN = 0.3
const endCard = (START.impact + retime(RETIME.impact, END_AT)) * FPS
const lastFrame = TOTAL_SECONDS * FPS

/** Music sits under the voice, and lifts for the cold open and the end card. */
function musicVolume(frame: number): number {
  const open = interpolate(frame, [0, 12, HOOK * FPS, HOOK * FPS + 30], [0, MUSIC_OPEN, MUSIC_OPEN * 0.6, MUSIC_BED], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const close = interpolate(frame, [endCard, endCard + 25, lastFrame - 30, lastFrame], [0, 0.22, 0.22, -MUSIC_BED], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return Math.max(0, open + close)
}

export function Pitch() {
  return (
    <AbsoluteFill style={{ background: C.navyDeep }}>
      {SCENE_LIST.map(({ key, Component }) => (
        <Sequence key={key} from={Math.round(START[key] * FPS)} durationInFrames={Math.round(SCENES[key] * FPS)}>
          <Component />
        </Sequence>
      ))}
      <Audio src={staticFile('music.mp3')} volume={musicVolume} />
      {VOICE.map((v) => (
        <Sequence key={v.file} from={Math.round(v.start * FPS)}>
          <Audio src={staticFile(`vo/${v.file}.mp3`)} volume={1.25} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(s.at * FPS))}>
          <Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
      <Captions lines={VOICE} />
    </AbsoluteFill>
  )
}
