import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, FONT, IDENTITY, retime, untime, type Retime } from './theme'

const RetimeContext = createContext<Retime>(IDENTITY)

/** The scene clock, expressed in the cue times the scene was written with. */
export function useCueTime(): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return untime(useContext(RetimeContext), frame / fps)
}

/** 0 → 1 spring that starts at `atSeconds`. */
export function useEnter(atSeconds: number, damping = 200): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const at = retime(useContext(RetimeContext), atSeconds)
  return spring({ frame: frame - at * fps, fps, config: { damping } })
}

interface RiseProps {
  at: number
  children: ReactNode
  style?: CSSProperties
  from?: number
}

/** Fades and slides its children up when the scene reaches `at` seconds. */
export function Rise({ at, children, style, from = 36 }: RiseProps) {
  const p = useEnter(at)
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * from}px)`, ...style }}>{children}</div>
}

/** Fades the whole scene in and out so cuts between scenes are soft. */
export function SceneFade({ children, seconds, timing = IDENTITY }: { children: ReactNode; seconds: number; timing?: Retime }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const end = seconds * fps
  const opacity = interpolate(frame, [0, 7, end - 7, end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <RetimeContext.Provider value={timing}>
      <AbsoluteFill style={{ opacity, fontFamily: FONT }}>{children}</AbsoluteFill>
    </RetimeContext.Provider>
  )
}

export function DarkBackdrop() {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 90) * 40
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navy} 55%, #0d2a4a 100%)` }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          right: -260 + drift,
          top: -320,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(15,163,163,0.28), transparent 65%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          left: -300 - drift,
          bottom: -380,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(11,92,173,0.4), transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  )
}

export function LightBackdrop() {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 100) * 30
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #ffffff 0%, ${C.soft} 60%, #e3f0fb 100%)` }}>
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          right: -380 + drift,
          top: -420,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(15,163,163,0.16), transparent 65%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: -360 - drift,
          bottom: -460,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(11,92,173,0.14), transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  )
}

export function Kicker({ children, color = C.tealLight }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color, fontSize: 26, fontWeight: 700, letterSpacing: 5 }}>
      <span style={{ width: 54, height: 4, background: color, borderRadius: 2 }} />
      {children}
    </div>
  )
}

/** A browser window around a screen recording. */
export function BrowserFrame({ width, children, url }: { width: number; children: ReactNode; url: string }) {
  const bar = 44
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        overflow: 'hidden',
        background: C.white,
        boxShadow: '0 40px 90px rgba(8,18,32,0.28), 0 4px 14px rgba(8,18,32,0.12)',
        border: `1px solid ${C.line}`,
      }}
    >
      <div style={{ height: bar, background: '#eef3f9', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            height: 26,
            borderRadius: 13,
            background: C.white,
            color: C.muted,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ width, height: (width * 9) / 16, position: 'relative', background: C.soft }}>{children}</div>
    </div>
  )
}

export interface CaptionLine {
  /** Seconds from the start of the video. */
  start: number
  duration: number
  phrases: string[]
}

/** Subtitles: each line's phrases share its audio time in proportion to their length. */
export function Captions({ lines }: { lines: CaptionLine[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const line = lines.find((l) => t >= l.start && t < l.start + l.duration)
  if (!line) return null
  const total = line.phrases.reduce((sum, p) => sum + p.length, 0)
  let cursor = line.start
  let current = line.phrases[line.phrases.length - 1]!
  for (const phrase of line.phrases) {
    const span = (phrase.length / total) * line.duration
    if (t < cursor + span) {
      current = phrase
      break
    }
    cursor += span
  }
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 34, fontFamily: FONT }}>
      <div
        style={{
          background: 'rgba(8,18,32,0.86)',
          color: C.white,
          fontSize: 32,
          fontWeight: 500,
          padding: '13px 30px',
          borderRadius: 14,
          maxWidth: 1500,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {current}
      </div>
    </AbsoluteFill>
  )
}
