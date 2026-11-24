import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion'
import { C, CLIP_SECONDS, RETIME, SCENES } from '../theme'
import { BrowserFrame, Kicker, LightBackdrop, Rise, SceneFade, useEnter } from '../ui'

export const EDGES = [
  { at: 14, title: 'Knows your real history', text: 'Answers come from your own records, not from guesses.' },
  { at: 16.4, title: 'Speaks বাংলা', text: 'Plain Bangla or English, chosen by the patient.' },
  { at: 18, title: 'Your identity stays home', text: 'Name, phone and NID never reach the AI model.' },
]

export function Solution() {
  const frameIn = useEnter(1.2, 26)
  return (
    <SceneFade seconds={SCENES.solution} timing={RETIME.solution}>
      <LightBackdrop />
      <AbsoluteFill style={{ padding: '80px 100px' }}>
        <Rise at={0.2}>
          <Kicker color={C.teal}>THE SOLUTION</Kicker>
        </Rise>
        <Rise at={0.4} style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 22 }}>
          <Img src={staticFile('shield.png')} style={{ height: 96 }} />
          <div style={{ fontSize: 76, fontWeight: 800, color: C.ink, letterSpacing: -2 }}>
            HealthNexus <span style={{ color: C.brand }}>BD</span>
          </div>
        </Rise>
        <Rise at={0.9} style={{ marginTop: 18, maxWidth: 760 }}>
          <div style={{ fontSize: 36, color: C.muted, lineHeight: 1.3 }}>
            One health record for every patient, with a <b style={{ color: C.ink }}>personal AI assistant</b> built in.
          </div>
        </Rise>

        <div style={{ display: 'flex', gap: 20, marginTop: 40, width: 760 }}>
          <Rise at={5} style={{ flex: 1 }}>
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 26px', boxShadow: '0 14px 34px rgba(11,92,173,0.10)' }}>
              <div style={{ color: C.brand, fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>FOR PATIENTS</div>
              <div style={{ color: C.ink, fontSize: 27, fontWeight: 600, marginTop: 8, lineHeight: 1.25 }}>Ask about your own records and lab reports</div>
            </div>
          </Rise>
          <Rise at={10.4} style={{ flex: 1 }}>
            <div style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 26px', boxShadow: '0 14px 34px rgba(15,163,163,0.12)' }}>
              <div style={{ color: C.teal, fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>FOR DOCTORS</div>
              <div style={{ color: C.ink, fontSize: 27, fontWeight: 600, marginTop: 8, lineHeight: 1.25 }}>An AI briefing before every consultation</div>
            </div>
          </Rise>
        </div>

        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 16, width: 760 }}>
          {EDGES.map((edge) => (
            <Rise key={edge.title} at={edge.at} from={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${C.brand}, ${C.teal})`,
                    color: C.white,
                    fontSize: 26,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <div>
                  <span style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>{edge.title}</span>
                  <span style={{ fontSize: 24, color: C.muted, marginLeft: 14 }}>{edge.text}</span>
                </div>
              </div>
            </Rise>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            right: -40,
            top: 190,
            opacity: frameIn,
            transform: `translateX(${(1 - frameIn) * 200}px) perspective(2000px) rotateY(-9deg) rotateX(2deg)`,
          }}
        >
          <BrowserFrame width={1000} url="healthnexus.bd">
            <OffthreadVideo
              src={staticFile('clips/landing.mp4')}
              playbackRate={CLIP_SECONDS.landing! / (SCENES.solution + 0.2)}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </BrowserFrame>
        </div>
      </AbsoluteFill>
    </SceneFade>
  )
}
