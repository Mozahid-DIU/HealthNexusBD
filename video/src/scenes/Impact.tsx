import { AbsoluteFill, Img, interpolate, staticFile } from 'remotion'
import { C, RETIME, SCENES } from '../theme'
import { Kicker, LightBackdrop, Rise, SceneFade, useCueTime, useEnter } from '../ui'

export const MEASURES = [
  { at: 5.6, title: 'Report comprehension', text: 'Patients who can explain their own result after asking' },
  { at: 7.4, title: 'Alerts caught', text: 'Allergy and interaction warnings raised before prescribing' },
  { at: 8.8, title: 'Time saved', text: 'Minutes of history-taking saved per consultation' },
]

export const NEXT = [
  { at: 11.6, text: 'Voice questions in Bangla' },
  { at: 13.4, text: 'Reading scanned paper reports' },
  { at: 15, text: 'Pilot with a local clinic' },
]

export const END_AT = 18.2

function Body() {
  const t = useCueTime()
  const body = interpolate(t, [END_AT - 0.5, END_AT], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const end = useEnter(END_AT, 30)
  return (
    <>
      <LightBackdrop />
      <AbsoluteFill style={{ padding: '80px 100px', opacity: body }}>
        <Rise at={0.2}>
          <Kicker color={C.teal}>IMPACT &amp; NEXT STEP</Kicker>
        </Rise>
        <Rise at={0.4} style={{ marginTop: 22, maxWidth: 1500 }}>
          <div style={{ fontSize: 66, fontWeight: 800, color: C.ink, lineHeight: 1.1, letterSpacing: -1.5 }}>
            Every patient understands their report.
            <br />
            <span style={{ color: C.brand }}>No doctor misses a known allergy.</span>
          </div>
        </Rise>

        <Rise at={5.2} style={{ marginTop: 44 }}>
          <div style={{ color: C.muted, fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>WHAT WE WILL MEASURE</div>
        </Rise>
        <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
          {MEASURES.map((m, i) => (
            <Rise key={m.title} at={m.at} style={{ flex: 1 }}>
              <div
                style={{
                  background: C.white,
                  borderRadius: 22,
                  padding: '26px 28px',
                  border: `1px solid ${C.line}`,
                  borderTop: `6px solid ${i === 1 ? C.teal : C.brand}`,
                  boxShadow: '0 18px 40px rgba(11,92,173,0.10)',
                  height: 170,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>{m.title}</div>
                <div style={{ fontSize: 24, color: C.muted, marginTop: 10, lineHeight: 1.35 }}>{m.text}</div>
              </div>
            </Rise>
          ))}
        </div>

        <Rise at={11.2} style={{ marginTop: 40 }}>
          <div style={{ color: C.muted, fontSize: 22, fontWeight: 700, letterSpacing: 3 }}>WHAT COMES NEXT</div>
        </Rise>
        <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
          {NEXT.map((n, i) => (
            <Rise key={n.text} at={n.at} from={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.navy, color: C.white, padding: '16px 28px', borderRadius: 999, fontSize: 28, fontWeight: 600 }}>
                <span style={{ color: C.tealLight, fontWeight: 800 }}>{i + 1}</span>
                {n.text}
              </div>
            </Rise>
          ))}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: end, transform: `scale(${0.94 + end * 0.06})` }}>
        <Img src={staticFile('shield.png')} style={{ height: 230 }} />
        <div style={{ fontSize: 104, fontWeight: 800, color: C.ink, letterSpacing: -3, marginTop: 20 }}>
          HealthNexus <span style={{ color: C.brand }}>BD</span>
        </div>
        <div style={{ fontSize: 44, color: C.muted, marginTop: 10 }}>Your health record, explained.</div>
        <div style={{ fontSize: 38, color: C.teal, marginTop: 14, fontWeight: 600 }}>আপনার স্বাস্থ্য রেকর্ড, সহজ ভাষায়।</div>
      </AbsoluteFill>
    </>
  )
}

export function Impact() {
  return (
    <SceneFade seconds={SCENES.impact} timing={RETIME.impact}>
      <Body />
    </SceneFade>
  )
}
