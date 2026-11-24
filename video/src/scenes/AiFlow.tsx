import { AbsoluteFill, interpolate } from 'remotion'
import { C, RETIME, SCENES } from '../theme'
import { DarkBackdrop, Kicker, Rise, SceneFade, useCueTime } from '../ui'

export const NODES = [
  { at: 1.6, tag: 'INPUT', title: 'Question + own records', note: 'Allergies, conditions, medicines, the attached report' },
  { at: 5.2, tag: 'OUR SERVER', title: 'De-identify', note: 'Name, phone, NID, UHID removed in English and Bangla' },
  { at: 10.4, tag: 'LLM', title: 'Google Gemini', note: 'Fastest model first, with a fallback chain' },
  { at: 15, tag: 'RULES', title: 'Safety checks', note: 'Allergy and drug-interaction rules run every time' },
  { at: 19.6, tag: 'OUTPUT', title: 'Answer', note: 'Plain Bangla or English, grounded in real records' },
]

const REDACTIONS = [
  { label: 'Name', raw: 'Rahim Uddin', safe: '[patient]' },
  { label: 'Mobile', raw: '01810-000001', safe: '[phone]' },
  { label: 'NID', raw: '1990123456781', safe: '[id]' },
  { label: 'রোগীর নাম', raw: 'রহিম উদ্দিন', safe: '[line removed]' },
]

function Flow() {
  const t = useCueTime()
  const redact = interpolate(t, [6.2, 7.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const activeNode = NODES.reduce((acc, n, i) => (t >= n.at ? i : acc), -1)
  return (
    <>
      <DarkBackdrop />
      <AbsoluteFill style={{ padding: '80px 90px' }}>
        <Rise at={0.2}>
          <Kicker>THE AI APPROACH</Kicker>
        </Rise>
        <Rise at={0.4} style={{ marginTop: 20 }}>
          <div style={{ color: C.white, fontSize: 62, fontWeight: 800, letterSpacing: -1.5 }}>
            Input <span style={{ color: C.tealLight }}>→</span> privacy <span style={{ color: C.tealLight }}>→</span> AI{' '}
            <span style={{ color: C.tealLight }}>→</span> rules <span style={{ color: C.tealLight }}>→</span> answer
          </div>
        </Rise>

        <div style={{ display: 'flex', gap: 18, marginTop: 70, alignItems: 'stretch' }}>
          {NODES.map((node, i) => {
            const on = i === activeNode
            return (
              <Rise key={node.title} at={node.at} style={{ flex: 1, display: 'flex' }}>
                <div
                  style={{
                    flex: 1,
                    borderRadius: 22,
                    padding: '34px 26px',
                    background: on ? `linear-gradient(160deg, ${C.brand}, ${C.teal})` : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.16)'}`,
                    boxShadow: on ? '0 24px 60px rgba(15,163,163,0.4)' : 'none',
                    transform: `translateY(${on ? -12 : 0}px)`,
                  }}
                >
                  <div style={{ color: on ? C.white : C.tealLight, fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>
                    {i + 1} · {node.tag}
                  </div>
                  <div style={{ color: C.white, fontSize: 34, fontWeight: 700, marginTop: 12, lineHeight: 1.15 }}>{node.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 22, marginTop: 12, lineHeight: 1.35 }}>{node.note}</div>
                </div>
              </Rise>
            )
          })}
        </div>

        <Rise at={5.6} style={{ marginTop: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, fontWeight: 700, letterSpacing: 3, width: 210 }}>
              WHAT THE MODEL SEES
            </div>
            <div style={{ display: 'flex', gap: 16, flex: 1 }}>
              {REDACTIONS.map((r) => (
                <div
                  key={r.label}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    fontFamily: 'monospace',
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>{r.label}:</div>
                  <div style={{ position: 'relative', height: 38, marginTop: 4 }}>
                    <div style={{ position: 'absolute', color: '#ffb4b4', fontSize: 26, opacity: 1 - redact, filter: `blur(${redact * 8}px)` }}>{r.raw}</div>
                    <div style={{ position: 'absolute', color: C.tealLight, fontSize: 24, fontWeight: 700, opacity: redact }}>{r.safe}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Rise>

        <Rise at={12.4} style={{ marginTop: 56 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {['Record-grounded answers', 'Hybrid: LLM + clinical rules', 'Prompt-injection guard', 'Safe fallback if the model fails', 'Never diagnoses or prescribes'].map((chip) => (
              <span
                key={chip}
                style={{
                  color: C.white,
                  fontSize: 27,
                  fontWeight: 600,
                  padding: '13px 26px',
                  borderRadius: 999,
                  border: `1px solid ${C.tealLight}`,
                  background: 'rgba(95,224,214,0.1)',
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </Rise>
      </AbsoluteFill>
    </>
  )
}

export function AiFlow() {
  return (
    <SceneFade seconds={SCENES.ai} timing={RETIME.ai}>
      <Flow />
    </SceneFade>
  )
}
