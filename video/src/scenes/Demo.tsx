import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { C, CLIP_SECONDS, DEMO_STARTS, FPS, SCENES } from '../theme'
import { BrowserFrame, LightBackdrop, SceneFade, useEnter } from '../ui'

/** The consent code typed in the recording, shown again on the phone. */
const OTP_CODE = '788927'
const OTP_MINUTES = 5
const PHONE_STEP = 1
/** Seconds into the phone step at which the SMS drops in. */
export const SMS_AT = 1.1

const STEPS = [
  { who: 'DOCTOR', title: 'Find the patient and request access', clip: 'demo1' },
  { who: 'PATIENT', title: 'A one-time code on the phone gives consent', clip: 'demo2' },
  { who: 'DOCTOR', title: 'AI briefing with an allergy warning', clip: 'demo3' },
  { who: 'LAB', title: 'The lab uploads the report to the record', clip: 'demo4' },
  { who: 'PATIENT', title: 'Ask about a visit, in Bangla', clip: 'demo5' },
  { who: 'SAFETY', title: 'Emergency words trigger a 999 call-out', clip: 'demo6' },
  { who: 'PATIENT', title: 'Every access is logged, including the AI', clip: 'demo7' },
]

const FRAME_WIDTH = 1440

function Phone() {
  const slide = useEnter(0.25, 22)
  const drop = useEnter(SMS_AT, 14)
  return (
    <div
      style={{
        position: 'absolute',
        right: 70,
        top: 150,
        width: 370,
        height: 740,
        borderRadius: 54,
        background: '#0b0f17',
        padding: 14,
        boxShadow: '0 50px 100px rgba(8,18,32,0.5)',
        transform: `translateX(${(1 - slide) * 560}px) rotate(${(1 - slide) * 10 + 3}deg)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 42,
          background: `linear-gradient(170deg, #12305a, ${C.navyDeep})`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 14, left: '50%', marginLeft: -55, width: 110, height: 28, borderRadius: 14, background: '#0b0f17' }} />
        <div style={{ color: C.white, textAlign: 'center', marginTop: 88, fontSize: 76, fontWeight: 300 }}>10:42</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 20 }}>What the patient receives</div>
        <div
          style={{
            margin: '34px 14px 0',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: 22,
            padding: '16px 18px',
            opacity: drop,
            transform: `translateY(${(1 - drop) * -120}px) scale(${0.9 + drop * 0.1})`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: C.muted, fontWeight: 600 }}>
            <span>MESSAGES · HealthNexus</span>
            <span>now</span>
          </div>
          <div style={{ fontSize: 19, color: C.ink, marginTop: 8, lineHeight: 1.35 }}>HealthNexus BD: Your access verification code is</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: C.brand, letterSpacing: 7, margin: '6px 0' }}>{OTP_CODE}</div>
          <div style={{ fontSize: 17, color: C.muted, lineHeight: 1.35 }}>
            It expires in {OTP_MINUTES} minutes. Share it only with your treating doctor.
          </div>
        </div>
      </div>
    </div>
  )
}

/** One recording, sped up or slowed so it exactly fills its narration slot, with a slow push-in. */
function Clip({ name, seconds }: { name: string; seconds: number }) {
  const frame = useCurrentFrame()
  const zoom = interpolate(frame, [0, seconds * FPS], [1, 1.035])
  const rate = (CLIP_SECONDS[name] ?? seconds) / (seconds + 0.1)
  return (
    <OffthreadVideo
      src={staticFile(`clips/${name}.mp4`)}
      playbackRate={rate}
      muted
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }}
    />
  )
}

export function Demo() {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const active = Math.max(0, DEMO_STARTS.findIndex((s, i) => t >= s && t < (DEMO_STARTS[i + 1] ?? Infinity)))
  const step = STEPS[Math.min(active, STEPS.length - 1)]!
  const labelIn = useEnter(DEMO_STARTS[active] ?? 0, 30)
  const shift = useEnter(DEMO_STARTS[PHONE_STEP]! + 0.2, 30) * 170
  const shiftBack = useEnter(DEMO_STARTS[PHONE_STEP + 1]!, 30) * 170

  return (
    <SceneFade seconds={SCENES.demo}>
      <LightBackdrop />
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 240, right: 240, top: 26, display: 'flex', alignItems: 'center', gap: 20, whiteSpace: 'nowrap' }}>
          <span style={{ background: C.danger, color: C.white, fontSize: 18, fontWeight: 800, letterSpacing: 2, padding: '7px 14px', borderRadius: 8, flexShrink: 0 }}>
            ● LIVE PRODUCT
          </span>
          <div style={{ opacity: labelIn, transform: `translateX(${(1 - labelIn) * 30}px)`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: C.teal, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>
              {Math.min(active, STEPS.length - 1) + 1}/{STEPS.length} · {step.who}
            </span>
            <span style={{ color: C.ink, fontSize: 30, fontWeight: 700 }}>{step.title}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {STEPS.map((s, i) => (
              <span key={s.title} style={{ width: 30, height: 8, borderRadius: 4, background: i <= active ? C.brand : '#cfdcec' }} />
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', top: 92, left: (1920 - FRAME_WIDTH) / 2 - shift + shiftBack }}>
          <BrowserFrame width={FRAME_WIDTH} url="healthnexus.bd">
            {STEPS.map((s, i) => {
              const seconds = DEMO_STARTS[i + 1]! - DEMO_STARTS[i]!
              return (
                <Sequence key={s.clip} from={Math.round(DEMO_STARTS[i]! * FPS)} durationInFrames={Math.round(seconds * FPS)} layout="none">
                  <Clip name={s.clip} seconds={seconds} />
                </Sequence>
              )
            })}
          </BrowserFrame>
        </div>

        <Sequence
          from={Math.round(DEMO_STARTS[PHONE_STEP]! * FPS)}
          durationInFrames={Math.round((DEMO_STARTS[PHONE_STEP + 1]! - DEMO_STARTS[PHONE_STEP]!) * FPS)}
          layout="none"
        >
          <Phone />
        </Sequence>
      </AbsoluteFill>
    </SceneFade>
  )
}
