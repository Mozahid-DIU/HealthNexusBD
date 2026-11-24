import { AbsoluteFill, Img, staticFile } from 'remotion'
import { C, FONT } from './theme'

const LAB_ROWS = [
  ['HbA1c', '8.2 %', 'H'],
  ['S. Creatinine', '1.4 mg/dL', 'H'],
  ['LDL-C', '162 mg/dL', 'H'],
  ['Hb', '11.8 g/dL', 'L'],
  ['TSH', '8.9 mIU/L', 'H'],
  ['Free T4', '0.8 ng/dL', 'L'],
]

const SLANT = 'polygon(54% 0, 100% 0, 100% 100%, 44% 100%)'

function Pill({ color, children, side }: { color: string; children: string; side: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 34,
        [side]: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'rgba(8,18,32,0.88)',
        border: `2px solid ${color}`,
        color: C.white,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 2,
        padding: '12px 26px',
        borderRadius: 16,
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: color, boxShadow: `0 0 18px ${color}` }} />
      {children}
    </div>
  )
}

/** YouTube thumbnail, 1280x720: the unreadable paper report against the real Bangla answer. */
export function Thumbnail() {
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.navyDeep }}>
      {/* Left: the paper report, dark and tilted */}
      <AbsoluteFill style={{ background: `linear-gradient(150deg, #05090f, ${C.navy})` }}>
        <div
          style={{
            position: 'absolute',
            left: 34,
            top: 356,
            width: 440,
            padding: '30px 34px',
            background: '#f3efe2',
            borderRadius: 8,
            transform: 'rotate(-6deg)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
            color: '#2b2b2b',
            filter: 'brightness(0.72) saturate(0.8)',
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700, color: '#7a7466', marginBottom: 14 }}>LABORATORY REPORT</div>
          {LAB_ROWS.map(([test, value, flag]) => (
            <div key={test} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, padding: '6px 0', borderBottom: '1px solid #d9d3c2' }}>
              <span>{test}</span>
              <span style={{ fontWeight: 700 }}>
                {value} <span style={{ color: C.danger }}>{flag}</span>
              </span>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* Right: the real assistant answering in Bangla */}
      <AbsoluteFill style={{ clipPath: SLANT, background: '#eaf3fc' }}>
        <Img
          src={staticFile('thumb-shot.png')}
          style={{ position: 'absolute', left: 250, top: 230, width: 1500, transformOrigin: 'left top', filter: 'saturate(1.1) contrast(1.04)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,18,32,0.96) 0%, rgba(8,18,32,0.9) 34%, rgba(8,18,32,0) 52%, rgba(8,18,32,0) 70%, rgba(8,18,32,0.55) 100%)' }} />
      </AbsoluteFill>

      {/* The slanted divider */}
      <div
        style={{
          position: 'absolute',
          left: 624,
          top: -80,
          width: 8,
          height: 900,
          background: `linear-gradient(180deg, ${C.tealLight}, ${C.brandLight})`,
          transform: 'rotate(10.1deg)',
          boxShadow: `0 0 40px ${C.tealLight}`,
        }}
      />

      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,9,15,0.9) 0%, rgba(5,9,15,0.55) 28%, rgba(5,9,15,0) 46%)' }} />

      <div style={{ position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', lineHeight: 1.02, fontWeight: 800, letterSpacing: -2 }}>
        <div style={{ color: C.white, fontSize: 104, textShadow: '0 6px 30px rgba(0,0,0,0.8)' }}>SAME REPORT.</div>
        <div style={{ color: C.amber, fontSize: 104, textShadow: '0 6px 30px rgba(0,0,0,0.8)' }}>NOW IN বাংলা.</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 248,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(8,18,32,0.92)',
          border: '2px solid rgba(255,255,255,0.25)',
          borderRadius: 22,
          padding: '12px 28px 12px 18px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <Img src={staticFile('shield.png')} style={{ height: 58 }} />
        <span style={{ color: C.white, fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
          HealthNexus <span style={{ color: C.tealLight }}>BD</span>
        </span>
      </div>

      <div style={{ position: 'absolute', left: 48, top: 296, color: 'rgba(255,255,255,0.75)', fontSize: 24, fontWeight: 700, letterSpacing: 6 }}>ON PAPER</div>
      <div style={{ position: 'absolute', right: 48, top: 296, color: C.white, fontSize: 24, fontWeight: 700, letterSpacing: 6 }}>WITH AI</div>

      <Pill color={C.danger} side="left">
        UNREADABLE
      </Pill>
      <Pill color="#34d399" side="right">
        EXPLAINED BY AI
      </Pill>
    </AbsoluteFill>
  )
}
