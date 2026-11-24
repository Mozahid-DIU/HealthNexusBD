import type { ReactNode } from 'react'
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, FPS, HOOK, SCENES, VO } from '../theme'
import { DarkBackdrop, Kicker, Rise, SceneFade, useEnter } from '../ui'

const LAB_ROWS = [
  ['HbA1c', '8.2 %', 'H'],
  ['S. Creatinine', '1.4 mg/dL', 'H'],
  ['LDL-C', '162 mg/dL', 'H'],
  ['Hb', '11.8 g/dL', 'L'],
  ['TSH', '8.9 mIU/L', 'H'],
]

/** Where the narrator starts the second hook sentence ("Most patients ... can't"). */
export const HOOK_SLAM = 0.3 + VO.s0! * 0.58

const S1 = VO.s1!
/** Body cues, in seconds after the hook: one per narrated sentence. */
const PAINS = [
  { at: 0.25, big: 'Unreadable', small: 'Paper files, written in English medical terms' },
  { at: S1 * 0.27, big: 'No history', small: 'A few minutes per patient, nothing in front of the doctor' },
  { at: S1 * 0.52, big: 'Avoidable harm', small: 'Missed allergies, clashing medicines, confused patients' },
]
const WHO_AT = S1 * 0.78

/** Scene-relative seconds at which a card lands (for the pop sound). */
export const PROBLEM_POPS = [...PAINS.map((p) => HOOK + p.at), HOOK + WHO_AT]

function LabRows({ size }: { size: number }) {
  return (
    <>
      {LAB_ROWS.map(([test, value, flag]) => (
        <div key={test} style={{ display: 'flex', justifyContent: 'space-between', fontSize: size, padding: '8px 0', borderBottom: '1px solid #e9e4d6' }}>
          <span>{test}</span>
          <span style={{ fontWeight: 700 }}>
            {value} <span style={{ color: C.danger }}>{flag}</span>
          </span>
        </div>
      ))}
    </>
  )
}

/** Cold open: the question lands word by word, then the answer slams in. */
function Hook() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = ['Can', 'you', 'read', 'your', 'own', 'lab report?']
  const perWord = (HOOK_SLAM - 0.5) / words.length
  const slam = spring({ frame: frame - HOOK_SLAM * fps, fps, config: { damping: 11, mass: 0.6 } })
  const paper = spring({ frame, fps, config: { damping: 200 } })
  const shake = slam > 0 && slam < 0.98 ? Math.sin(frame * 2.4) * 7 * (1 - slam) : 0
  const zoom = interpolate(frame, [0, HOOK * fps], [1, 1.07])
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${shake}px)` }}>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 190,
          width: 600,
          padding: '40px 44px',
          background: '#fdfcf7',
          borderRadius: 8,
          boxShadow: '0 50px 110px rgba(0,0,0,0.55)',
          transform: `rotate(${6 * paper}deg) translateY(${(1 - paper) * 300}px)`,
          opacity: paper,
          color: '#2b2b2b',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700, color: '#7a7466', marginBottom: 20 }}>LABORATORY REPORT</div>
        <LabRows size={32} />
        <div style={{ marginTop: 22, fontSize: 22, fontStyle: 'italic', color: '#7a7466' }}>Adv: Clinical correlation suggested.</div>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 250, width: 980 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 30px', fontSize: 136, fontWeight: 800, lineHeight: 1.04, letterSpacing: -4 }}>
          {words.map((word, i) => {
            const p = spring({ frame: frame - (0.3 + i * perWord) * fps, fps, config: { damping: 13, mass: 0.5 } })
            return (
              <span
                key={word}
                style={{
                  color: i === words.length - 1 ? C.tealLight : C.white,
                  opacity: Math.min(1, p * 1.4),
                  transform: `translateY(${(1 - p) * 70}px) scale(${0.7 + p * 0.3})`,
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 44,
            background: C.amber,
            color: C.navyDeep,
            fontSize: 56,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            padding: '16px 34px',
            borderRadius: 14,
            opacity: Math.min(1, slam * 2),
            transform: `rotate(-2deg) scale(${2.2 - slam * 1.2})`,
            transformOrigin: 'left center',
            boxShadow: '0 24px 60px rgba(245,165,36,0.45)',
          }}
        >
          Most patients in Bangladesh can&apos;t.
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Paper({ at, rotate, x, y, title, children }: { at: number; rotate: number; x: number; y: number; title: string; children: ReactNode }) {
  const p = useEnter(at, 18)
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 430,
        padding: '28px 30px',
        background: '#fdfcf7',
        borderRadius: 6,
        boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
        transform: `translateY(${(1 - p) * 500}px) rotate(${rotate * p}deg)`,
        opacity: p,
        color: '#2b2b2b',
      }}
    >
      <div style={{ fontSize: 17, letterSpacing: 3, fontWeight: 700, color: '#7a7466', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function Body() {
  const question = useEnter(0.9, 12)
  return (
    <AbsoluteFill style={{ padding: '90px 110px' }}>
      <Rise at={0}>
        <Kicker>THE PROBLEM</Kicker>
      </Rise>
      <Rise at={0.1} style={{ marginTop: 26, maxWidth: 1000 }}>
        <div style={{ color: C.white, fontSize: 78, fontWeight: 800, lineHeight: 1.06, letterSpacing: -2 }}>
          Your health record is a paper file <span style={{ color: C.tealLight }}>you can&apos;t read.</span>
        </div>
      </Rise>

      <div style={{ position: 'absolute', left: 110, top: 430, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {PAINS.map((pain, i) => (
          <Rise key={pain.big} at={pain.at}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 30, fontWeight: 700, width: 44 }}>0{i + 1}</span>
              <div>
                <div style={{ color: C.white, fontSize: 46, fontWeight: 700 }}>{pain.big}</div>
                <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 27, marginTop: 4 }}>{pain.small}</div>
              </div>
            </div>
          </Rise>
        ))}
      </div>

      <Rise at={WHO_AT} style={{ position: 'absolute', left: 110, bottom: 130 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 26 }}>
          <span style={{ color: C.tealLight, fontWeight: 700 }}>WHO IT HURTS</span>
          {['Patients', 'Doctors', 'Diagnostic labs'].map((who) => (
            <span key={who} style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '8px 20px', borderRadius: 999 }}>
              {who}
            </span>
          ))}
          <span>in Bangladesh, and across the developing world</span>
        </div>
      </Rise>

      <div style={{ position: 'absolute', right: 80, top: 250, width: 640, height: 700 }}>
        <Paper at={0.2} rotate={-7} x={0} y={60} title="PRESCRIPTION">
          <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 12 }}>Rx</div>
          {['Tab. Metformin 500 mg  1+0+1', 'Tab. Losartan 50 mg  1+0+0', 'Tab. Atorvastatin 10 mg  0+0+1', 'Adv: FBS, HbA1c, S. Creat'].map((l) => (
            <div key={l} style={{ fontSize: 21, fontStyle: 'italic', padding: '7px 0', borderBottom: '1px dashed #d8d2c2' }}>
              {l}
            </div>
          ))}
        </Paper>
        <Paper at={0.45} rotate={5} x={190} y={270} title="LABORATORY REPORT">
          <LabRows size={22} />
        </Paper>
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: 0,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: C.amber,
            color: C.navyDeep,
            fontSize: 100,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${question}) rotate(${(1 - question) * -40}deg)`,
            boxShadow: '0 20px 50px rgba(245,165,36,0.45)',
          }}
        >
          ?
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function Problem() {
  const hookFrames = Math.round(HOOK * FPS)
  return (
    <SceneFade seconds={SCENES.problem}>
      <DarkBackdrop />
      <Sequence durationInFrames={hookFrames}>
        <Hook />
      </Sequence>
      <Sequence from={hookFrames}>
        <Body />
      </Sequence>
    </SceneFade>
  )
}
