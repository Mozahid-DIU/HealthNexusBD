import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import uploadedAppShot from '@/imports/image.png'
import uploadedAppShot2 from '@/imports/image-1.png'

const BLUE = '#0B5CAD'
const TEAL = '#0FA3A3'
const NAVY = '#0F1B2D'

const HERO_IMG    = 'https://images.unsplash.com/photo-1758691461935-202e2ef6b69f?w=900&h=1000&fit=crop&auto=format'
const STEP1_IMG   = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=480&h=340&fit=crop&auto=format'
const STEP2_IMG   = 'https://images.unsplash.com/photo-1758691463331-2ac00e6f676f?w=480&h=340&fit=crop&auto=format'
const STEP3_IMG   = 'https://images.unsplash.com/photo-1758691462666-6470b740f544?w=480&h=340&fit=crop&auto=format'

/* ─── SVG Icons ─────────────────────────────────────────────────── */
function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z"
        fill={TEAL} />
    </svg>
  )
}

function ShieldIcon({ size = 26, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function FingerprintIcon({ size = 26, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" />
      <path d="M5 12a7 7 0 0 1 7-7" />
      <path d="M12 5v.01" />
      <path d="M12 12a3 3 0 0 1 3 3" />
      <path d="M6 12a6 6 0 0 0 9.33 5" />
      <path d="M9 12a3 3 0 0 1 3-3" />
    </svg>
  )
}

function SparkleIcon({ size = 26, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4" />
    </svg>
  )
}

function AuditIcon({ size = 26, color = TEAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
      <circle cx="18" cy="19" r="3" />
      <path d="m20.5 21.5-1.5-1.5" />
    </svg>
  )
}

/* ─── Hero background — clean white mesh grid ────────────────── */
function HeroBgTexture() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.055, pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="mesh" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0v48" fill="none" stroke={BLUE} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mesh)" />
      {/* subtle heartbeat pulse across lower third */}
      <polyline
        points="0,200 80,200 110,140 140,260 170,200 230,200 260,170 290,230 320,200 600,200 700,200 730,155 760,245 790,200 900,200"
        fill="none" stroke={TEAL} strokeWidth="1.5" opacity="0.6"
        style={{ transform: 'translateY(120px)' }}
      />
    </svg>
  )
}

/* ─── Feature card illustrations (inline SVG scenes) ─────────── */
function UHIDIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="8" y="22" width="56" height="36" rx="6" fill="#e8f0fb" />
      <rect x="8" y="22" width="56" height="12" rx="6" fill={BLUE} />
      <circle cx="24" cy="46" r="7" fill="#c7d8ed" />
      <rect x="36" y="40" width="18" height="3" rx="1.5" fill="#b0c4de" />
      <rect x="36" y="46" width="14" height="3" rx="1.5" fill="#b0c4de" />
      <rect x="36" y="52" width="10" height="3" rx="1.5" fill="#b0c4de" />
      <rect x="12" y="26" width="20" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
    </svg>
  )
}

function OTPIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="26" fill="#e8f7f7" />
      <path d="M36 18C26.06 18 18 26.06 18 36v8h36v-8c0-9.94-8.06-18-18-18z" fill={TEAL} opacity=".15" />
      <path d="M36 24c-6.63 0-12 5.37-12 12v8h24v-8c0-6.63-5.37-12-12-12z" fill={TEAL} opacity=".25" />
      <rect x="24" y="44" width="24" height="14" rx="4" fill={TEAL} />
      {/* OTP dots */}
      {[29, 36, 43].map(x => <circle key={x} cx={x} cy="51" r="2" fill="white" />)}
      <circle cx="36" cy="36" r="4" fill={BLUE} />
      <path d="M36 32v-8" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function AIIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="12" y="16" width="48" height="40" rx="6" fill="#f0fafa" />
      <rect x="12" y="16" width="48" height="10" rx="6" fill={TEAL} opacity=".2" />
      <path d="M20 36h12M20 42h18M20 48h10" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
      {/* AI sparkle */}
      <circle cx="48" cy="40" r="10" fill="white" stroke={TEAL} strokeWidth="1.5" />
      <path d="M48 33l1.5 4.5 4.5 1.5-4.5 1.5L48 45l-1.5-4.5L42 39l4.5-1.5z" fill={TEAL} />
    </svg>
  )
}

function AuditIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="16" y="10" width="40" height="52" rx="5" fill="#e8f0fb" />
      <rect x="22" y="20" width="28" height="3" rx="1.5" fill={BLUE} opacity=".4" />
      <rect x="22" y="27" width="20" height="3" rx="1.5" fill={BLUE} opacity=".3" />
      <rect x="22" y="34" width="24" height="3" rx="1.5" fill={BLUE} opacity=".3" />
      <rect x="22" y="41" width="16" height="3" rx="1.5" fill={BLUE} opacity=".2" />
      {/* lock */}
      <rect x="28" y="50" width="16" height="10" rx="3" fill={BLUE} />
      <path d="M32 50v-4a4 4 0 0 1 8 0v4" stroke={BLUE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="55" r="1.5" fill="white" />
    </svg>
  )
}

/* ─── How it works step illustrations ────────────────────────── */
function StepIllus1() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#e8f0fb" />
      <circle cx="32" cy="24" r="9" fill={BLUE} opacity=".2" />
      <circle cx="32" cy="24" r="6" fill={BLUE} opacity=".5" />
      <path d="M16 50c0-8.84 7.16-16 16-16s16 7.16 16 16" fill={BLUE} opacity=".15" />
      <rect x="26" y="40" width="12" height="2.5" rx="1.25" fill={TEAL} />
      <rect x="22" y="45" width="20" height="2.5" rx="1.25" fill={TEAL} opacity=".6" />
    </svg>
  )
}

function StepIllus2() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#e8f7f7" />
      <rect x="14" y="22" width="36" height="22" rx="5" fill="white" stroke={TEAL} strokeWidth="1.5" />
      <circle cx="24" cy="33" r="6" fill={TEAL} opacity=".25" />
      <rect x="33" y="28" width="12" height="2.5" rx="1.25" fill={BLUE} opacity=".4" />
      <rect x="33" y="33" width="9" height="2.5" rx="1.25" fill={BLUE} opacity=".3" />
      <rect x="33" y="38" width="10" height="2.5" rx="1.25" fill={BLUE} opacity=".25" />
      {/* stethoscope hint */}
      <path d="M20 44 Q20 50 26 50 Q32 50 32 44" stroke={TEAL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function StepIllus3() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#e8f7f7" />
      <rect x="20" y="24" width="24" height="18" rx="4" fill={TEAL} opacity=".15" />
      <rect x="20" y="24" width="24" height="7" rx="4" fill={TEAL} opacity=".3" />
      {/* OTP boxes */}
      {[22, 30, 38].map((x, i) => (
        <rect key={i} x={x} y="37" width="6" height="6" rx="1.5" fill={i === 1 ? TEAL : BLUE} opacity={i === 1 ? 1 : .35} />
      ))}
      <path d="M40 20l3 3-6 6" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Sliding Gallery ────────────────────────────────────────── */
const gallerySlides = [
  {
    src: uploadedAppShot,
    isLocal: true,
    label: 'OTP Consent Flow',
    caption: 'Patients approve doctor access with a single one-time PIN — live in the app today.',
  },
  {
    src: uploadedAppShot2,
    isLocal: true,
    label: 'Verified UHID',
    caption: 'Every verified doctor sees the patient\'s UHID badge and consent status at a glance.',
  },
  {
    src: 'https://images.unsplash.com/photo-1758691462848-31a39258dbd8?w=800&h=540&fit=crop&auto=format',
    isLocal: false,
    label: 'Digital Health Records',
    caption: 'BMDC-verified doctors access complete patient histories on any device, anywhere.',
  },
  {
    src: 'https://images.unsplash.com/photo-1758691462668-046fd85ceac9?w=800&h=540&fit=crop&auto=format',
    isLocal: false,
    label: 'AI Clinical Review',
    caption: 'Gemini-powered summaries surface drug interactions and allergy flags from scan results.',
  },
  {
    src: 'https://images.unsplash.com/photo-1758691463203-cce9d415b2b5?w=800&h=540&fit=crop&auto=format',
    isLocal: false,
    label: 'Collaborative Care',
    caption: 'Specialist teams share a unified view — no duplicate tests, no missing history.',
  },
  {
    src: 'https://images.unsplash.com/photo-1758691462848-ba1e929da259?w=800&h=540&fit=crop&auto=format',
    isLocal: false,
    label: 'Secure Digital Workflow',
    caption: 'Every keystroke, access event, and prescription update is cryptographically logged.',
  },
]

function GalleryCarousel() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)
  const total = gallerySlides.length

  const go = useCallback((next: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setActive((next + total) % total)
      setAnimating(false)
    }, 320)
  }, [animating, total])

  useEffect(() => {
    const id = setInterval(() => go(active + 1), 4200)
    return () => clearInterval(id)
  }, [active, go])

  const slide = gallerySlides[active]

  return (
    <section style={{ background: '#f7faff', borderTop: '1px solid rgba(11,92,173,0.08)', borderBottom: '1px solid rgba(11,92,173,0.08)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 20px' }}>
        {/* heading */}
        <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 4px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Platform in Action</p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', fontWeight: 800, color: '#0c1a2e', margin: '0 0 14px', letterSpacing: '-0.4px', wordBreak: 'break-word' }}>
            See HealthNexus BD at work
          </h2>
          <p style={{ fontSize: 15, color: '#4a6380', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            From OTP consent to AI clinical summaries — built for every citizen across Bangladesh.
          </p>
        </div>

        {/* carousel card */}
        <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 64px rgba(11,92,173,0.16), 0 4px 20px rgba(11,92,173,0.09)', background: 'white', maxWidth: 860, margin: '0 auto' }}>

          {/* image frame */}
          <div style={{ position: 'relative', height: 'clamp(240px, 44vw, 440px)', background: '#c7d8ed', overflow: 'hidden' }}>
            <img
              key={active}
              src={slide.src as string}
              alt={slide.label}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                opacity: animating ? 0 : 1,
                transform: animating ? 'scale(1.03)' : 'scale(1)',
                transition: 'opacity 0.32s ease, transform 0.32s ease',
              }}
            />

            {/* label chip — top-left */}
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(11,25,55,0.52)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 99, padding: '5px 14px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{slide.label}</span>
            </div>

            {/* prev / next arrows */}
            {(['prev', 'next'] as const).map(dir => (
              <button key={dir}
                onClick={() => go(dir === 'prev' ? active - 1 : active + 1)}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  [dir === 'prev' ? 'left' : 'right']: 14,
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.38)',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = BLUE }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.20)' }}
                aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
                </svg>
              </button>
            ))}
          </div>

          {/* caption band — clean white strip below image, never overlaps */}
          <div style={{ padding: '18px 26px 14px', display: 'flex', alignItems: 'center', gap: 16, background: 'white', borderTop: '1px solid rgba(11,92,173,0.06)' }}>
            <p style={{ flex: 1, fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, fontWeight: 500, opacity: animating ? 0 : 1, transition: 'opacity 0.32s ease' }}>
              {slide.caption}
            </p>
            {/* dot strip inline with caption */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {gallerySlides.map((_, i) => (
                <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: i === active ? 24 : 7, height: 7,
                    borderRadius: 99,
                    background: i === active ? BLUE : 'rgba(11,92,173,0.18)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* thumbnail strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          {gallerySlides.map((s, i) => (
            <button key={i} onClick={() => go(i)}
              style={{
                width: 72, height: 48, borderRadius: 10, overflow: 'hidden', padding: 0, border: 'none', cursor: 'pointer',
                outline: i === active ? `2.5px solid ${BLUE}` : '2.5px solid transparent',
                outlineOffset: 2,
                opacity: i === active ? 1 : 0.55,
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = i === active ? '1' : '0.55' }}
            >
              <img src={s.src as string} alt={s.label}
                style={{ width: '100%', height: '100%', objectFit: s.isLocal ? 'contain' : 'cover', background: s.isLocal ? '#0d2340' : '#c7d8ed', display: 'block' }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Auth Page ──────────────────────────────────────────────── */
const AUTH_IMG = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&h=1200&fit=crop&auto=format'

type Role = 'Patient' | 'Doctor' | 'Lab'
type AuthTab = 'login' | 'register'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function InputField({
  label, type = 'text', placeholder, value, onChange, rightSlot,
}: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.02em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: rightSlot ? '11px 44px 11px 14px' : '11px 14px',
            fontSize: 14, color: '#1e293b',
            border: '1.5px solid rgba(11,92,173,0.18)', borderRadius: 10,
            background: '#f8fafc', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(11,92,173,0.10)` }}
          onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.18)'; e.target.style.boxShadow = 'none' }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}

function RolePills({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const roles: Role[] = ['Patient', 'Doctor', 'Lab']
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22, background: 'rgba(11,92,173,0.06)', borderRadius: 12, padding: 4 }}>
      {roles.map(r => (
        <button key={r} onClick={() => onChange(r)}
          style={{
            flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            background: role === r ? BLUE : 'transparent',
            color: role === r ? 'white' : '#64748b',
            boxShadow: role === r ? '0 2px 10px rgba(11,92,173,0.28)' : 'none',
            transition: 'all 0.18s',
          }}
        >{r}</button>
      ))}
    </div>
  )
}

function AuthPage({ defaultTab, onNavigateHome, onSuccess }: { defaultTab: AuthTab; onNavigateHome: () => void; onSuccess?: (role: Role) => void }) {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login')
  const [fading, setFading] = useState(false)
  const [role, setRole] = useState<Role>('Patient')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirm, setConfirm] = useState('')
  const [roleField, setRoleField] = useState('')

  const roleLabel = role === 'Patient' ? 'National ID (NID)' : role === 'Doctor' ? 'BMDC Registration No.' : 'Lab License Number'
  const rolePlaceholder = role === 'Patient' ? '10-17 digit NID number' : role === 'Doctor' ? 'e.g. A-12345' : 'e.g. DGDA-LAB-00123'

  const toggle = () => {
    setFading(true)
    setTimeout(() => { setIsLogin(v => !v); setShowPw(false); setShowConfirm(false); setFading(false) }, 220)
  }

  const gradBtn: React.CSSProperties = {
    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
    background: `linear-gradient(135deg, ${BLUE} 0%, #0d7ac5 50%, ${TEAL} 100%)`,
    color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(11,92,173,0.32)', transition: 'all 0.2s',
    fontFamily: 'inherit', backgroundSize: '200% 100%', backgroundPosition: '0% 50%',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", background: '#dde8f4', overflow: 'hidden' }}>

      {/* ── LEFT BRAND PANEL (desktop only) ──────────────────────── */}
      <div className="auth-left-panel" style={{
        flex: '0 0 50%', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, ${BLUE} 0%, #0870bb 40%, ${TEAL} 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px',
      }}>
        {/* mesh texture */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07, pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="auth-mesh-l" x="0" y="0" width="52" height="52" patternUnits="userSpaceOnUse">
              <path d="M52 0H0v52" fill="none" stroke="white" strokeWidth="0.9"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-mesh-l)"/>
        </svg>
        {/* heartbeat */}
        <svg style={{ position: 'absolute', bottom: '8%', left: 0, width: '100%', opacity: 0.14, pointerEvents: 'none' }} height="56" viewBox="0 0 800 56">
          <polyline points="0,28 120,28 160,7 195,49 230,28 340,28 380,18 418,38 450,28 660,28 700,8 730,48 760,28 800,28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {/* glow orbs */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.30)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 19, color: 'white', letterSpacing: '-0.3px' }}>HealthNexus BD</span>
        </div>

        {/* headline */}
        <h2 style={{ fontSize: 'clamp(1.7rem,2.6vw,2.4rem)', fontWeight: 900, color: 'white', lineHeight: 1.18, letterSpacing: '-0.5px', margin: '0 0 20px', maxWidth: 380 }}>
          One lifelong Health ID for every citizen
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '0 0 48px', maxWidth: 360 }}>
          Your complete medical history, securely unified under one identifier — accessible anywhere in Bangladesh.
        </p>

        {/* trust points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: 'AES-256 Encrypted', sub: 'Military-grade data security' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>, label: 'OTP Consent Access', sub: 'You approve every access' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'DGHS Certified', sub: 'Approved by Ministry of Health' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.icon}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{t.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{t.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* back link at bottom */}
        <button onClick={onNavigateHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500, padding: 0, fontFamily: 'inherit', transition: 'color 0.15s', marginTop: 56 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to home
        </button>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'auto', padding: '32px 20px' }}>

        {/* blobs on mobile (hidden behind left panel on desktop) */}
        <div className="auth-blob auth-blob-1" style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, rgba(11,92,173,0.22) 0%, transparent 70%)`, filter: 'blur(72px)', top: '-15%', left: '-10%', pointerEvents: 'none', zIndex: 0 }} />
        <div className="auth-blob auth-blob-2" style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(15,163,163,0.18) 0%, transparent 70%)`, filter: 'blur(72px)', bottom: '-10%', right: '-8%', pointerEvents: 'none', zIndex: 0 }} />

        {/* mobile back link */}
        <div className="auth-mobile-back" style={{ width: '100%', maxWidth: 440, marginBottom: 18, zIndex: 1 }}>
          <button onClick={onNavigateHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#4a6380', fontSize: 13, fontWeight: 500, padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4a6380' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to home
          </button>
        </div>

      {/* ── CARD ─────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 440, borderRadius: 24, zIndex: 1,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.70)',
        boxShadow: '0 32px 80px rgba(11,92,173,0.14), 0 4px 24px rgba(11,92,173,0.08), inset 0 1px 0 rgba(255,255,255,0.90)',
        padding: '36px 36px 28px',
      }}>

        {/* ── Header: logo + title ─────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div onClick={onNavigateHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: 18 }}>
            <div style={{ background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(11,92,173,0.32)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: BLUE, letterSpacing: '-0.3px' }}>HealthNexus <span style={{ color: TEAL }}>BD</span></span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Access your <strong style={{ color: '#1e293b' }}>unified health record</strong>
          </p>
        </div>

        {/* ── Segmented toggle ─────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(11,92,173,0.07)', borderRadius: 14, padding: 4, marginBottom: 28 }}>
          {/* sliding pill */}
          <div style={{
            position: 'absolute', top: 4, bottom: 4,
            left: isLogin ? 4 : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            borderRadius: 11,
            background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
            boxShadow: '0 2px 12px rgba(11,92,173,0.30)',
            transition: 'left 0.35s cubic-bezier(0.65, 0, 0.35, 1)',
          }} />
          {['Sign In', 'Register'].map((label, i) => (
            <button key={label}
              onClick={() => { if ((i === 0) !== isLogin) toggle() }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 11, border: 'none',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700, position: 'relative', zIndex: 1,
                color: (i === 0) === isLogin ? 'white' : '#64748b',
                transition: 'color 0.25s',
              }}
            >{label}</button>
          ))}
        </div>

        {/* ── Form content (cross-fades) ────────────────────────── */}
        <div style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'none', transition: 'opacity 0.22s ease, transform 0.22s ease' }}>

          {isLogin ? (
            /* ── SIGN IN form ── */
            <div>
              <RolePills role={role} onChange={r => { setRole(r); setRoleField('') }} />
              <InputField label="Email or Phone" placeholder="rahim@example.com or 017XXXXXXXX" value={email} onChange={setEmail} />
              <InputField label="Password" type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={pw} onChange={setPw}
                rightSlot={<span onClick={() => setShowPw(o => !o)} style={{ display: 'flex' }}><EyeIcon open={showPw} /></span>}
              />
              <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 22 }}>
                <a href="#" style={{ fontSize: 12, color: TEAL, fontWeight: 600, textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                >Forgot password?</a>
              </div>
              <button onClick={() => onSuccess?.(role)} style={gradBtn}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(11,92,173,0.40)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,92,173,0.32)' }}
              >Sign In</button>
            </div>
          ) : (
            /* ── REGISTER form ── */
            <div>
              <RolePills role={role} onChange={r => { setRole(r); setRoleField('') }} />
              <InputField label="Full Name" placeholder="e.g. Rahim Uddin" value={name} onChange={setName} />
              <InputField label="Email Address" placeholder="e.g. rahim@example.com" value={email} onChange={setEmail} />
              <InputField label="Phone Number" placeholder="e.g. 01700000000" value={phone} onChange={setPhone} />
              <InputField label="Password" type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={pw} onChange={setPw}
                rightSlot={<span onClick={() => setShowPw(o => !o)} style={{ display: 'flex' }}><EyeIcon open={showPw} /></span>}
              />
              <InputField label="Confirm Password" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={confirm} onChange={setConfirm}
                rightSlot={<span onClick={() => setShowConfirm(o => !o)} style={{ display: 'flex' }}><EyeIcon open={showConfirm} /></span>}
              />
              <InputField label={roleLabel} placeholder={rolePlaceholder} value={roleField} onChange={setRoleField} />

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, marginTop: 2 }}>
                <div onClick={() => setAgreed(o => !o)}
                  style={{ width: 17, height: 17, borderRadius: 5, border: `2px solid ${agreed ? BLUE : 'rgba(11,92,173,0.28)'}`, background: agreed ? BLUE : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s', cursor: 'pointer' }}
                >
                  {agreed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
                </div>
                <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  I agree to the{' '}<a href="#" style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>{' '}and{' '}<a href="#" style={{ color: BLUE, fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                </span>
              </label>

              <button onClick={() => onSuccess?.(role)} style={gradBtn}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(11,92,173,0.40)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(11,92,173,0.32)' }}
              >Create Account</button>
            </div>
          )}
        </div>

        {/* ── Trust strip ──────────────────────────────────────── */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(11,92,173,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(15,163,163,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            Secured with <strong style={{ color: '#64748b' }}>AES-256 encryption</strong> · DGHS Certified
          </span>
        </div>
      </div>

      </div>{/* end right panel */}

      <style>{`
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(50px, -40px) scale(1.08); }
          66%       { transform: translate(-30px, 30px) scale(0.94); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(-40px, 25px) scale(0.92); }
          66%       { transform: translate(28px, -48px) scale(1.12); }
        }
        .auth-blob-1 { animation: blob-drift-1 14s ease-in-out infinite; }
        .auth-blob-2 { animation: blob-drift-2 17s ease-in-out infinite; }
        @media (max-width: 1023px) {
          .auth-left-panel { display: none !important; }
          .auth-mobile-back { display: block !important; }
        }
        @media (min-width: 1024px) {
          .auth-mobile-back { display: none !important; }
        }
      `}</style>
    </div>
  )
}

/* ─── Inner Pages Data ──────────────────────────────────────────── */
const RECORDS_DATA = [
  { id: 1, year: 2026, date: '28 Jul 2026', doctor: 'Dr. Priya Sen', spec: 'Cardiologist', diagnosis: 'Mild Hypertension', summary: 'BP recorded at 148/92 mmHg. Patient reports occasional headaches and fatigue.', symptoms: ['Occasional headaches', 'Fatigue', 'Blood pressure 148/92 mmHg'], medications: [{ name: 'Amlodipine', dose: '5mg', freq: 'Once daily', dur: '3 months' }, { name: 'Aspirin', dose: '75mg', freq: 'Once daily', dur: 'Ongoing' }], aiSummary: 'Stage 1 hypertension confirmed. BP trending upward over last 2 visits. Amlodipine initiated. Close monitoring recommended given concurrent Metformin use — watch for orthostatic hypotension.', alerts: [{ type: 'drug' as const, msg: 'Monitor BP closely with concurrent Metformin therapy' }], labs: ['ECG Report.pdf', 'Lipid Panel.pdf'], ai: true },
  { id: 2, year: 2026, date: '14 Jun 2026', doctor: 'Dr. Farhan Hossain', spec: 'Endocrinologist', diagnosis: 'Type 2 Diabetes – Quarterly Review', summary: 'HbA1c 7.2% — within target range. Metformin dosage adjusted to 1000mg twice daily.', symptoms: ['Fatigue', 'Increased thirst (mild)', 'HbA1c: 7.2%', 'eGFR: 78 (normal)'], medications: [{ name: 'Metformin', dose: '1000mg', freq: 'Twice daily', dur: 'Ongoing' }, { name: 'Vitamin D3', dose: '1000 IU', freq: 'Once daily', dur: '3 months' }], aiSummary: 'HbA1c well-controlled. Renal function (eGFR 78) safe for Metformin continuation. No new drug interactions with current hypertension medications. Continue current regimen.', alerts: [], labs: ['HbA1c Report.pdf', 'Kidney Function.pdf', 'CBC.pdf'], ai: true },
  { id: 3, year: 2026, date: '02 May 2026', doctor: 'Dr. Nusrat Jahan', spec: 'General Physician', diagnosis: 'Annual Health Check-Up', summary: 'No major concerns. Vitamin D deficiency (22 ng/mL) noted. Routine labs within normal range.', symptoms: ['General fatigue', 'Vitamin D: 22 ng/mL (deficient)', 'BP 134/84 mmHg'], medications: [{ name: 'Vitamin D3', dose: '5000 IU', freq: 'Once daily', dur: '3 months' }], aiSummary: null, alerts: [], labs: ['Full Blood Count.pdf', 'Liver Function.pdf'], ai: false },
  { id: 4, year: 2026, date: '18 Mar 2026', doctor: 'Dr. Karim Chowdhury', spec: 'Ophthalmologist', diagnosis: 'Myopia Progression', summary: 'Mild myopia progression (−1.25 D) observed. Updated glasses prescription issued.', symptoms: ['Blurred distance vision', 'Eye strain with prolonged screen use'], medications: [], aiSummary: 'Progressive myopia over 18 months. No systemic medications required. Recommend 2h outdoor time daily and blue-light filtering glasses.', alerts: [], labs: ['Refraction Test.pdf'], ai: true },
  { id: 5, year: 2025, date: '10 Nov 2025', doctor: 'Dr. Priya Sen', spec: 'Cardiologist', diagnosis: 'Cardiac Screening', summary: 'Initial cardiac assessment. Borderline elevated LDL cholesterol (138 mg/dL). No chest pain.', symptoms: ['LDL: 138 mg/dL (borderline high)', 'No chest pain or palpitations', 'ECG: normal sinus rhythm'], medications: [{ name: 'Omega-3', dose: '1000mg', freq: 'Twice daily', dur: '6 months' }], aiSummary: 'Borderline LDL — dietary modification recommended before statin therapy. Penicillin allergy confirmed on file, not prescribed. Monitor LDL in 6 months.', alerts: [{ type: 'allergy' as const, msg: "Penicillin allergy on record — confirmed not prescribed" }], labs: ['Lipid Profile.pdf', 'ECG Report.pdf'], ai: true },
]

const CPENDING = [{ id: 1, doctor: 'Dr. Ayesha Karim', spec: 'Cardiologist', bmdc: 'A-29871', purpose: 'Cardiac evaluation and routine follow-up for hypertension management', requestedAt: 'Today, 10:32 AM' }]
const CACTIVE_INIT = [{ doctor: 'Dr. Priya Sen', spec: 'Cardiologist', grantedAt: 'Today, 2:15 PM', expiresMin: 24, scope: 'Medical Records (Read Only)' }]
const CHISTORY = [
  { doctor: 'Dr. Priya Sen', spec: 'Cardiologist', status: 'Granted' as const, date: '28 Jul 2026', duration: '47 min' },
  { doctor: 'Dr. Farhan Hossain', spec: 'Endocrinologist', status: 'Granted' as const, date: '14 Jun 2026', duration: '1h 12min' },
  { doctor: 'Dr. Nusrat Jahan', spec: 'General Physician', status: 'Expired' as const, date: '02 May 2026', duration: '55 min' },
  { doctor: 'Dr. Karim Chowdhury', spec: 'Ophthalmologist', status: 'Denied' as const, date: '18 Mar 2026', duration: '—' },
]

const AUDIT_DATA = [
  { id: 1, who: 'Dr. Ayesha Karim',   cred: 'Cardiologist',    action: 'Requested' as const, resource: 'Medical Records',              ts: '01 Aug 2026, 10:32 AM', ip: '103.4.XX.41' },
  { id: 2, who: 'Dr. Priya Sen',      cred: 'Cardiologist',    action: 'Viewed' as const,    resource: 'Medical Records (Full)',        ts: '31 Jul 2026, 2:17 PM',  ip: '202.16.XX.88' },
  { id: 3, who: 'System',             cred: 'OTP Engine',      action: 'Granted' as const,   resource: 'Session — Dr. Priya Sen',      ts: '31 Jul 2026, 2:15 PM',  ip: '—' },
  { id: 4, who: 'Rahim Uddin',        cred: 'Patient',         action: 'Login' as const,     resource: 'Patient Portal',               ts: '31 Jul 2026, 11:02 AM', ip: '103.4.XX.41' },
  { id: 5, who: 'Dr. Farhan Hossain', cred: 'Endocrinologist', action: 'Viewed' as const,    resource: 'Medical Records (Full)',        ts: '14 Jun 2026, 11:08 AM', ip: '198.51.XX.22' },
  { id: 6, who: 'System',             cred: 'OTP Engine',      action: 'Granted' as const,   resource: 'Session — Dr. Farhan Hossain', ts: '14 Jun 2026, 11:00 AM', ip: '—' },
  { id: 7, who: 'Rahim Uddin',        cred: 'Patient',         action: 'Revoked' as const,   resource: 'Session — Dr. Chowdhury',      ts: '18 Mar 2026, 4:30 PM',  ip: '103.4.XX.41' },
]

const ACTION_META: Record<string, { color: string; bg: string }> = {
  Viewed:    { color: '#0B5CAD',  bg: 'rgba(11,92,173,0.09)' },
  Granted:   { color: '#10b981', bg: 'rgba(16,185,129,0.09)' },
  Revoked:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  Requested: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  Login:     { color: '#64748b', bg: '#f1f5f9' },
}

/* ─── Topbar shared shell ───────────────────────────────────────── */
function PageTopBar({ title, subtitle, right }: { title: ReactNode; subtitle?: string; right?: ReactNode }) {
  return (
    <div style={{ background: 'white', borderBottom: '1px solid rgba(11,92,173,0.08)', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 10px rgba(11,92,173,0.07)', position: 'sticky', top: 0, zIndex: 20, gap: 14 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{typeof title === 'string' ? <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>{title}</h2> : title}</div>
        {subtitle && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,92,173,0.06)', border: '1.5px solid rgba(11,92,173,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0B5CAD' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0B5CAD,#0FA3A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>R</div>
      </div>
    </div>
  )
}

/* ─── My Records Page ────────────────────────────────────────────── */
function RecordsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .42s ease ${d}ms,transform .42s ease ${d}ms` })
  const q = search.toLowerCase()
  const filtered = RECORDS_DATA.filter(r => {
    if (filter === 'lab' && r.labs.length === 0) return false
    if (!q) return true
    return r.doctor.toLowerCase().includes(q) || r.diagnosis.toLowerCase().includes(q) || r.date.toLowerCase().includes(q) || r.spec.toLowerCase().includes(q)
  })
  const years = [...new Set(filtered.map(r => r.year))].sort((a, b) => b - a)

  return (
    <>
      <PageTopBar
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px', flexShrink: 0 }}>My Medical Records</h2>
            <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search doctor, diagnosis, date…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: 12, height: 36, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.15)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
                onFocus={e => { e.target.style.borderColor = '#0B5CAD'; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.09)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.15)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ height: 36, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.15)', background: '#f8fafc', padding: '0 12px', fontSize: 13, color: '#475569', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
            >
              <option value="all">All Records</option>
              <option value="verified">Verified Only</option>
              <option value="lab">Has Lab Report</option>
            </select>
          </div>
        }
      />
      <div style={{ padding: '28px 28px 48px' }}>
        {years.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '72px 0', color: '#94a3b8' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>No records found</p>
            <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your search or filter</p>
          </div>
        ) : years.map(year => (
          <div key={year}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 20px' }}>
              <div style={{ height: 1, flex: 1, background: 'rgba(11,92,173,0.10)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0B5CAD', background: 'rgba(11,92,173,0.07)', borderRadius: 99, padding: '4px 14px', border: '1px solid rgba(11,92,173,0.13)', letterSpacing: '0.05em' }}>{year}</span>
              <div style={{ height: 1, flex: 1, background: 'rgba(11,92,173,0.10)' }} />
            </div>
            {filtered.filter(r => r.year === year).map((rec, i) => {
              const isX = expandedId === rec.id
              return (
                <div key={rec.id} style={{ ...fc(i * 70), marginBottom: 14 }}>
                  <div style={{ background: 'white', borderRadius: 18, border: `1.5px solid ${isX ? 'rgba(11,92,173,0.22)' : 'rgba(11,92,173,0.08)'}`, boxShadow: isX ? '0 8px 32px rgba(11,92,173,0.13)' : '0 2px 12px rgba(11,92,173,0.07)', transition: 'all .25s', overflow: 'hidden' }}
                    onMouseEnter={e => { if (!isX) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(11,92,173,0.12)' } }}
                    onMouseLeave={e => { if (!isX) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.07)' } }}
                  >
                    <div onClick={() => setExpandedId(isX ? null : rec.id)} style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#0B5CAD' }}>
                        {rec.doctor.replace('Dr. ', '')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 800, color: '#0c1a2e', margin: '0 0 2px', letterSpacing: '-0.2px' }}>{rec.diagnosis}</p>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{rec.doctor} · {rec.spec} · <span style={{ color: '#94a3b8' }}>{rec.date}</span></p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 9px', border: '1px solid rgba(16,185,129,0.18)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>Verified
                            </span>
                            {rec.ai && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#0FA3A3', background: 'rgba(15,163,163,0.09)', borderRadius: 99, padding: '3px 9px', border: '1px solid rgba(15,163,163,0.18)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z"/></svg>AI
                              </span>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px', lineHeight: 1.55 }}>{rec.summary}</p>
                        {rec.labs.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                            {rec.labs.map(lab => (
                              <span key={lab} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#f1f5f9', borderRadius: 7, padding: '3px 10px', border: '1px solid rgba(11,92,173,0.10)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                {lab}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#94a3b8', transition: 'transform .25s', transform: isX ? 'rotate(180deg)' : 'none', marginTop: 4, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>

                    {isX && (
                      <div style={{ borderTop: '1px solid rgba(11,92,173,0.08)', padding: '20px 22px 22px', background: '#fafcff' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Symptoms / Findings</p>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {rec.symptoms.map((s, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#334155' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0B5CAD', flexShrink: 0, marginTop: 5 }} />{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Prescription</p>
                            {rec.medications.length === 0
                              ? <p style={{ fontSize: 13, color: '#94a3b8' }}>No medications prescribed</p>
                              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {rec.medications.map((med, idx) => (
                                    <div key={idx} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(11,92,173,0.10)' }}>
                                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 3px' }}>{med.name} <span style={{ fontWeight: 500, color: '#0B5CAD' }}>{med.dose}</span></p>
                                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{med.freq} · {med.dur}</p>
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>
                        </div>
                        {rec.aiSummary && (
                          <div style={{ background: 'linear-gradient(white,white) padding-box,linear-gradient(135deg,rgba(15,163,163,0.5),rgba(11,92,173,0.4)) border-box', border: '1.5px solid transparent', borderRadius: 14, padding: '14px 16px', marginBottom: rec.alerts.length > 0 ? 12 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0FA3A3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z"/><path d="M5 3v2M19 19v2M3 5h2M19 17h2"/></svg>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#0FA3A3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Clinical Summary</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.65 }}>{rec.aiSummary}</p>
                          </div>
                        )}
                        {rec.alerts.map((alert, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: alert.type === 'drug' ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)', borderRadius: 10, padding: '10px 14px', border: `1px solid ${alert.type === 'drug' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.20)'}`, marginTop: 10 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={alert.type === 'drug' ? '#f59e0b' : '#ef4444'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <p style={{ fontSize: 12, color: alert.type === 'drug' ? '#92400e' : '#991b1b', margin: 0, fontWeight: 500 }}><strong>{alert.type === 'drug' ? '⚠ Drug Alert:' : '⚠ Allergy Alert:'}</strong> {alert.msg}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── Consent Requests Page ─────────────────────────────────────── */
function ConsentPage() {
  const [tab, setTab] = useState<'pending' | 'active' | 'history'>('pending')
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState(587)
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set())
  const [activeSessions, setActiveSessions] = useState(CACTIVE_INIT)
  const [pendingItems, setPendingItems] = useState(CPENDING)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (tab !== 'pending' || pendingItems.length === 0) return
    const id = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [tab, pendingItems])

  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .4s ease ${d}ms,transform .4s ease ${d}ms` })
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const statusStyle = (s: string) => s === 'Granted' ? { color: '#10b981', bg: 'rgba(16,185,129,0.10)' } : s === 'Denied' ? { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' } : { color: '#94a3b8', bg: '#f1f5f9' }

  return (
    <>
      <PageTopBar
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Consent Requests</h2>
            <div style={{ display: 'flex', background: 'rgba(11,92,173,0.07)', borderRadius: 10, padding: 3, gap: 2 }}>
              {(['pending', 'active', 'history'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '5px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: tab === t ? 700 : 500, background: tab === t ? '#0B5CAD' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all .2s', boxShadow: tab === t ? '0 2px 8px rgba(11,92,173,0.25)' : 'none', textTransform: 'capitalize' }}
                >
                  {t === 'pending' ? `Pending${pendingItems.length > 0 ? ` (${pendingItems.length})` : ''}` : t === 'active' ? 'Active' : 'History'}
                </button>
              ))}
            </div>
          </div>
        }
        right={pendingItems.length > 0 ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.20)' }} /> : undefined}
      />

      <div style={{ padding: '28px 28px 48px' }}>
        {/* PENDING TAB */}
        {tab === 'pending' && (
          <>
            {pendingItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '72px 0', ...fc(0) }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>All caught up!</p>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No pending consent requests at this time.</p>
              </div>
            ) : pendingItems.map((req, i) => (
              <div key={req.id} style={{ ...fc(i * 80), maxWidth: 660 }}>
                <div style={{ background: 'linear-gradient(white,white) padding-box,linear-gradient(135deg,#0B5CAD,#0FA3A3) border-box', border: '2px solid transparent', borderRadius: 20, padding: '24px 26px', boxShadow: '0 4px 24px rgba(11,92,173,0.12)', animation: 'consentPulse 2.8s ease-in-out infinite' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#0B5CAD,#0FA3A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                      {req.doctor.replace('Dr. ', '')[0]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>{req.doctor}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#0B5CAD', background: 'rgba(11,92,173,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(11,92,173,0.18)' }}>BMDC #{req.bmdc}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 2px' }}>{req.spec}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Requested {req.requestedAt}</p>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>Purpose of Request</p>
                    <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.55 }}>{req.purpose}</p>
                  </div>
                  {approvedIds.has(req.id) ? (
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.24)', borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/><path d="M8 6h8"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46', margin: '0 0 4px', lineHeight: 1.4 }}>
                            Approved — a one-time OTP has been sent to your phone.
                          </p>
                          <p style={{ fontSize: 12, color: '#047857', margin: '0 0 12px', lineHeight: 1.5 }}>
                            Share it with the doctor to complete access.
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: countdown > 60 ? '#10b981' : '#ef4444', boxShadow: `0 0 0 3px ${countdown > 60 ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}` }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: countdown > 60 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>OTP expires in {fmt(countdown)}</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0FA3A3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              Session-scoped · auto-expires after consultation
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      <button
                        onClick={() => { setApprovedIds(ids => new Set([...ids, req.id])); setActiveSessions(prev => [{ doctor: req.doctor, spec: req.spec, grantedAt: 'Just now', expiresMin: 60, scope: 'Medical Records (Read Only)' }, ...prev]) }}
                        style={{ padding: '11px 24px', borderRadius: 11, border: 'none', background: '#10b981', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.28)', transition: 'all .18s', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(16,185,129,0.36)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.28)' }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                      >✓ Approve Access</button>
                      <button onClick={() => setPendingItems(p => p.filter(r => r.id !== req.id))}
                        style={{ padding: '11px 20px', borderRadius: 11, border: '1.5px solid rgba(11,92,173,0.22)', background: 'white', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .18s', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.22)'; e.currentTarget.style.color = '#475569' }}
                      >Deny</button>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0FA3A3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Session-scoped · auto-expires after consultation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ACTIVE SESSIONS TAB */}
        {tab === 'active' && (
          activeSessions.length === 0
            ? <div style={{ textAlign: 'center', padding: '72px 0', ...fc(0) }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(11,92,173,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B5CAD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No active sessions</p>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No doctors currently have access to your records.</p>
              </div>
            : <div>
                {activeSessions.map((sess, i) => (
                  <div key={i} style={{ ...fc(i * 70), marginBottom: 14 }}>
                    <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0B5CAD,#0FA3A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                        {sess.doctor.replace('Dr. ', '')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e', margin: '0 0 3px' }}>{sess.doctor}</p>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{sess.spec}</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(16,185,129,0.20)' }}>● Active · expires in {sess.expiresMin} min</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{sess.scope}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 7px' }}>Granted {sess.grantedAt}</p>
                        <button onClick={() => setActiveSessions(s => s.filter((_, idx) => idx !== i))}
                          style={{ padding: '7px 16px', borderRadius: 9, border: '1.5px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.05)', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .18s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.transform = 'scale(1.03)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)'; e.currentTarget.style.transform = 'none' }}
                        >Revoke Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div style={{ ...fc(0), background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', overflow: 'hidden' }}>
            {CHISTORY.map((h, i) => {
              const sc = statusStyle(h.status)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < CHISTORY.length - 1 ? '1px solid rgba(11,92,173,0.06)' : 'none', transition: 'background .15s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(11,92,173,0.12),rgba(15,163,163,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, fontWeight: 700, color: '#0B5CAD' }}>
                    {h.doctor.replace('Dr. ', '')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 2px' }}>{h.doctor}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{h.spec} · {h.date} · {h.duration}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, borderRadius: 99, padding: '4px 12px', flexShrink: 0 }}>{h.status}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes consentPulse{0%,100%{box-shadow:0 4px 20px rgba(11,92,173,0.10),0 0 0 0 rgba(11,92,173,0.07)}50%{box-shadow:0 6px 28px rgba(11,92,173,0.18),0 0 0 6px rgba(11,92,173,0.05)}}`}</style>
    </>
  )
}

/* ─── Audit Log Page ─────────────────────────────────────────────── */
function AuditPage() {
  const [mounted, setMounted] = useState(false)
  const [actionFilter, setActionFilter] = useState('all')
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)', transition: `opacity .36s ease ${d}ms,transform .36s ease ${d}ms` })
  const filtered = actionFilter === 'all' ? AUDIT_DATA : AUDIT_DATA.filter(r => r.action === actionFilter)

  return (
    <>
      <PageTopBar
        title={
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Access Audit Log</h2>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0FA3A3', background: 'rgba(15,163,163,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(15,163,163,0.20)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                Immutable · Tamper-proof
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Every access to your records, cryptographically signed</p>
          </div>
        }
        right={
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.18)', background: 'white', color: '#0B5CAD', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        }
      />
      <div style={{ padding: '24px 28px 48px' }}>
        {/* Filter pills */}
        <div style={{ ...fc(0), display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', flexShrink: 0 }}>Filter:</span>
          {['all', 'Viewed', 'Granted', 'Revoked', 'Requested', 'Login'].map(action => (
            <button key={action} onClick={() => setActionFilter(action)}
              style={{ padding: '5px 13px', borderRadius: 99, border: `1.5px solid ${actionFilter === action ? '#0B5CAD' : 'rgba(11,92,173,0.14)'}`, background: actionFilter === action ? '#0B5CAD' : 'white', color: actionFilter === action ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .18s' }}
            >{action === 'all' ? 'All Events' : action}</button>
          ))}
        </div>
        {/* Table */}
        <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 2fr 1.4fr', padding: '11px 20px', background: '#f8fafc', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>
            {['WHO', 'ACTION', 'RESOURCE', 'WHEN', 'IP ADDRESS'].map(h => (
              <p key={h} style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</p>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No entries match this filter</p>
            </div>
          )}
          {filtered.map((row, i) => {
            const am = ACTION_META[row.action] || ACTION_META.Login
            return (
              <div key={row.id} style={{ ...fc(i * 45), display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 2fr 1.4fr', padding: '14px 20px', background: i % 2 === 0 ? 'white' : '#fafcff', borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,92,173,0.05)' : 'none', alignItems: 'center', transition: 'background .12s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f5fb' }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafcff' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#0B5CAD' }}>{row.who[0]}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 1px' }}>{row.who}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{row.cred}</p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: am.color, background: am.bg, borderRadius: 99, padding: '4px 10px', display: 'inline-block', width: 'fit-content' }}>{row.action}</span>
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{row.resource}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{row.ts}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{row.ip}</p>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0FA3A3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>All entries are cryptographically signed · AES-256 encrypted · DGHS Certified</span>
        </div>
      </div>
    </>
  )
}

/* ─── Profile Page ───────────────────────────────────────────────── */
function ProfilePage() {
  const [mounted, setMounted] = useState(false)
  const [editSection, setEditSection] = useState<string | null>(null)
  const [pCopied, setPCopied] = useState(false)
  const [pName, setPName] = useState('Rahim Uddin')
  const [pDob, setPDob] = useState('15 March 1980')
  const [pGender, setPGender] = useState('Male')
  const [pPhone, setPPhone] = useState('+880 1700-000000')
  const [pEmail, setPEmail] = useState('rahim.uddin@example.com')
  const [pNid, setPNid] = useState('1234567890123')
  const [pEName, setPEName] = useState('Fatema Uddin')
  const [pEPhone, setPEPhone] = useState('+880 1800-000000')
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {editSection === 'edit'
        ? <input value={value} onChange={e => onChange(e.target.value)} style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #0B5CAD', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', boxShadow: '0 0 0 3px rgba(11,92,173,0.08)', transition: 'all .15s' }} />
        : <p style={{ fontSize: 13, color: '#1e293b', margin: 0, fontWeight: 500 }}>{value}</p>}
    </div>
  )

  const cardHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    e.currentTarget.style.transform = enter ? 'translateY(-2px)' : 'none'
    e.currentTarget.style.boxShadow = enter ? '0 8px 28px rgba(11,92,173,0.12)' : '0 2px 12px rgba(11,92,173,0.08)'
  }

  return (
    <>
      <PageTopBar title="My Profile" />
      <div style={{ padding: '28px 28px 48px', maxWidth: 740, margin: '0 auto' }}>
        {/* Avatar header card */}
        <div style={{ ...fc(0), background: 'white', borderRadius: 20, padding: '26px 28px', boxShadow: '0 2px 16px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 22, transition: 'all .2s' }}
          onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#0B5CAD,#0FA3A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white', boxShadow: '0 6px 20px rgba(11,92,173,0.30)' }}>R</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'white', border: '2px solid rgba(11,92,173,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B5CAD" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0c1a2e', margin: '0 0 8px', letterSpacing: '-0.4px' }}>{pName}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(11,92,173,0.05)', border: '1.5px solid rgba(11,92,173,0.14)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: '#0B5CAD', padding: '0 9px', height: 26, display: 'flex', alignItems: 'center', letterSpacing: '0.06em' }}>UHID</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0B5CAD', padding: '0 8px 0 8px' }}>BD-2026-01234</span>
              <button onClick={() => { navigator.clipboard?.writeText('BD-2026-01234').catch(() => {}); setPCopied(true); setTimeout(() => setPCopied(false), 2000) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px 0 0', color: pCopied ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', transition: 'color .2s' }}
              >
                {pCopied
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Patient · Registered January 2025 · All 64 districts</p>
          </div>
          <button onClick={() => setEditSection(editSection === 'edit' ? null : 'edit')}
            style={{ padding: '9px 20px', borderRadius: 11, border: 'none', background: editSection === 'edit' ? 'linear-gradient(135deg,#0B5CAD,#0FA3A3)' : 'rgba(11,92,173,0.08)', color: editSection === 'edit' ? 'white' : '#0B5CAD', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', boxShadow: editSection === 'edit' ? '0 4px 14px rgba(11,92,173,0.28)' : 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => { if (editSection !== 'edit') e.currentTarget.style.background = 'rgba(11,92,173,0.14)' }}
            onMouseLeave={e => { if (editSection !== 'edit') e.currentTarget.style.background = 'rgba(11,92,173,0.08)' }}
          >
            {editSection === 'edit'
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>Save Changes</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Profile</>}
          </button>
        </div>

        {/* Personal Info */}
        <div style={fc(80)}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 16, transition: 'all .2s', overflow: 'hidden' }}
            onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ padding: '18px 22px 0' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Personal Information</p>
            </div>
            <div style={{ padding: '0 22px 18px' }}>
              <Field label="Full Name" value={pName} onChange={setPName} />
              <Field label="Date of Birth" value={pDob} onChange={setPDob} />
              <Field label="Gender" value={pGender} onChange={setPGender} />
              <Field label="Phone" value={pPhone} onChange={setPPhone} />
              <Field label="Email" value={pEmail} onChange={setPEmail} />
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'center', padding: '11px 0' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NID</p>
                <p style={{ fontSize: 13, color: '#1e293b', margin: 0, fontWeight: 500 }}>{pNid.replace(/(\d{3})(\d{7})(\d{3})/, '$1-XXXXXXX-$3')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div style={fc(160)}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 16, transition: 'all .2s', overflow: 'hidden' }}
            onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ padding: '18px 22px 0' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Medical Information</p>
            </div>
            <div style={{ padding: '0 22px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blood Group</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#ef4444', margin: 0, lineHeight: 1 }}>B<span style={{ fontSize: 16 }}>+</span></p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allergies</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
                  {['Penicillin', 'Peanuts'].map(a => <span key={a} style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(220,38,38,0.18)' }}>{a}</span>)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conditions</p>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
                  {['Type 2 Diabetes', 'Hypertension'].map(c => <span key={c} style={{ fontSize: 12, fontWeight: 700, color: '#0B5CAD', background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(11,92,173,0.15)' }}>{c}</span>)}
                </div>
              </div>
              <Field label="Emergency" value={pEName} onChange={setPEName} />
              <Field label="Emrg. Phone" value={pEPhone} onChange={setPEPhone} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={fc(240)}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 16, transition: 'all .2s', overflow: 'hidden' }}
            onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ padding: '18px 22px 0' }}><p style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Security</p></div>
            <div style={{ padding: '0 22px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>Password</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Last changed 3 months ago</p>
                </div>
                <button style={{ padding: '7px 16px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.20)', background: 'white', color: '#0B5CAD', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                >Change Password</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>OTP / Two-Factor Auth</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>OTP sent to +880 1700-XXXXXX</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.10)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(16,185,129,0.20)' }}>● Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Consent */}
        <div style={fc(320)}>
          <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 16, transition: 'all .2s', overflow: 'hidden' }}
            onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}
          >
            <div style={{ padding: '18px 22px 0' }}><p style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Privacy &amp; Consent</p></div>
            <div style={{ padding: '0 22px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>Active Sessions</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>1 doctor currently has access</p>
                </div>
                <button style={{ padding: '7px 16px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.20)', background: 'white', color: '#0B5CAD', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                >Manage</button>
              </div>
              <div style={{ padding: '14px 0 2px' }}>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0B5CAD,#0FA3A3)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(11,92,173,0.28)', transition: 'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.36)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.28)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download My Health Data
                </button>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>Portable export in JSON/PDF format per DGHS data portability standard.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...fc(400), display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0FA3A3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>AES-256 encrypted · DGHS certified · Ministry of Health &amp; Family Welfare, Bangladesh</span>
        </div>
      </div>
    </>
  )
}

/* ─── Patient Dashboard ─────────────────────────────────────────── */
type DashNav = 'dashboard' | 'records' | 'consent' | 'audit' | 'profile'

const DASH_RECORDS = [
  { date: '28 Jul 2026', doctor: 'Dr. Priya Sen',       spec: 'Cardiologist',      diagnosis: 'Mild hypertension — BP 148/92. Prescribed Amlodipine 5mg daily.',                         ai: true  },
  { date: '14 Jun 2026', doctor: 'Dr. Farhan Hossain',  spec: 'Endocrinologist',   diagnosis: 'HbA1c 7.2% — diabetes well managed. Metformin dosage adjusted to 1000mg.',                ai: true  },
  { date: '02 May 2026', doctor: 'Dr. Nusrat Jahan',    spec: 'General Physician', diagnosis: 'Annual check-up — no major concerns. Vitamin D deficiency (22 ng/mL) noted.',             ai: false },
  { date: '18 Mar 2026', doctor: 'Dr. Karim Chowdhury', spec: 'Ophthalmologist',   diagnosis: 'Mild myopia progression (−1.25 D). Updated prescription issued.',                         ai: true  },
]

const DASH_ACCESS = [
  { doctor: 'Dr. Ayesha Karim',   spec: 'Cardiologist',    time: 'Today, 10:32 AM',     action: 'Requested', aColor: '#d97706', aBg: '#fef3c7' },
  { doctor: 'Dr. Priya Sen',      spec: 'Cardiologist',    time: 'Yesterday, 3:15 PM',  action: 'Viewed',    aColor: '#0FA3A3', aBg: 'rgba(15,163,163,0.10)' },
  { doctor: 'Dr. Farhan Hossain', spec: 'Endocrinologist', time: '14 Jun, 11:00 AM',    action: 'Viewed',    aColor: '#0FA3A3', aBg: 'rgba(15,163,163,0.10)' },
]

function PatientDashboard({ onLogout, onNavigateHome }: { onLogout: () => void; onNavigateHome: () => void }) {
  const [activeNav, setActiveNav] = useState<DashNav>('dashboard')
  const [mounted, setMounted]     = useState(false)
  const [copied, setCopied]       = useState(false)
  const [bellShake, setBellShake] = useState(true)
  const [consentUp, setConsentUp] = useState(true)

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 60)
    const t2 = setTimeout(() => setBellShake(false), 1300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const copyUHID = () => {
    navigator.clipboard?.writeText('BD-2026-01234').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* stagger helper — returns fade+slide style based on mount state */
  const fc = (delay: number) => ({
    opacity:    mounted ? 1 : 0,
    transform:  mounted ? 'none' : 'translateY(18px)',
    transition: `opacity 0.44s ease ${delay}ms, transform 0.44s ease ${delay}ms`,
  })

  const navItems: { id: DashNav; label: string; badge?: number; icon: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'records',   label: 'My Records',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
    { id: 'consent',   label: 'Consent Requests', badge: 1, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> },
    { id: 'audit',     label: 'Audit Log',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'profile',   label: 'Profile',          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f5fb', overflow: 'hidden' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside style={{ width: 240, flexShrink: 0, height: '100vh', background: 'white', borderRight: '1px solid rgba(11,92,173,0.09)', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 16px rgba(11,92,173,0.06)' }}>

        {/* Brand */}
        <div onClick={onNavigateHome} style={{ padding: '20px 18px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(11,92,173,0.07)' }}>
          <div style={{ background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(11,92,173,0.28)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" fill="white"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: BLUE, margin: 0, letterSpacing: '-0.2px', lineHeight: 1.2 }}>HealthNexus</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, margin: 0 }}>BD · Patient Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: active ? 'rgba(11,92,173,0.09)' : 'transparent', color: active ? BLUE : '#64748b', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, marginBottom: 2, textAlign: 'left', transition: 'all 0.18s ease', position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(11,92,173,0.05)'; e.currentTarget.style.color = '#334155' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: 99, background: `linear-gradient(to bottom, ${BLUE}, ${TEAL})` }} />}
                <span style={{ flexShrink: 0, marginLeft: active ? 6 : 0, transition: 'margin 0.18s' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ background: '#ef4444', color: 'white', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 6px', lineHeight: '16px' }}>{item.badge}</span>}
              </button>
            )
          })}
        </nav>

        {/* Patient footer */}
        <div style={{ borderTop: '1px solid rgba(11,92,173,0.07)', padding: '14px 14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 14, fontWeight: 700 }}>R</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Rahim Uddin</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Patient</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 500, padding: '4px 0', fontFamily: 'inherit', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeNav === 'records'  && <RecordsPage />}
        {activeNav === 'consent'  && <ConsentPage />}
        {activeNav === 'audit'    && <AuditPage />}
        {activeNav === 'profile'  && <ProfilePage />}
        {activeNav === 'dashboard' && <>

        {/* Top bar */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(11,92,173,0.08)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 10px rgba(11,92,173,0.07)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.3px' }}>Welcome back, <span style={{ color: BLUE }}>Rahim</span> 👋</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* UHID pill */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(11,92,173,0.05)', border: '1.5px solid rgba(11,92,173,0.14)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: BLUE, padding: '0 10px', height: 32, display: 'flex', alignItems: 'center', letterSpacing: '0.06em' }}>UHID</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: BLUE, padding: '0 8px 0 10px', fontVariantNumeric: 'tabular-nums' }}>BD-2026-01234</span>
              <button onClick={copyUHID} title={copied ? 'Copied!' : 'Copy'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px 0 2px', color: copied ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', position: 'relative', transition: 'color 0.2s' }}>
                {copied
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                {copied && <span style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', animation: 'tooltipFade 0.15s ease' }}>Copied!</span>}
              </button>
            </div>

            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <button className={bellShake ? 'bell-shake' : ''} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,92,173,0.06)', border: '1.5px solid rgba(11,92,173,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: BLUE, transition: 'background 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>1</span>
              </div>
            </div>

            {/* Avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(11,92,173,0.28)' }}>R</div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '24px 28px 48px', flex: 1 }}>

          {/* ── Consent alert ──────────────────────────────────────── */}
          {consentUp && (
            <div style={{ ...fc(0), marginBottom: 20, background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #0B5CAD, #0FA3A3) border-box', border: '2px solid transparent', borderRadius: 18, padding: '16px 20px', boxShadow: '0 4px 20px rgba(11,92,173,0.10)', animation: 'consentPulse 2.8s ease-in-out infinite', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, rgba(11,92,173,0.12), rgba(15,163,163,0.12))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 3px' }}>
                  <span style={{ color: BLUE }}>Dr. Ayesha Karim</span> (Cardiologist) is requesting access to your records
                </p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Session-scoped access · Expires after consultation ·{' '}
                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>Today, 10:32 AM</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#10b981', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(16,185,129,0.28)', transition: 'all 0.18s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.38)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(16,185,129,0.28)' }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)' }}
                >✓ Approve</button>
                <button onClick={() => setConsentUp(false)} style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.22)', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.22)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none' }}
                >Deny</button>
              </div>
            </div>
          )}

          {/* ── Summary cards ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>

            {/* Blood Group */}
            <div style={{ ...fc(80), background: 'white', borderRadius: 18, padding: '22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" opacity=".75"/></svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Blood Group</span>
              </div>
              <p style={{ fontSize: 44, fontWeight: 900, color: '#ef4444', margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>B<span style={{ fontSize: 26 }}>+</span></p>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '10px 0 0' }}>Last verified Jan 2025</p>
            </div>

            {/* Allergies */}
            <div style={{ ...fc(160), background: 'white', borderRadius: 18, padding: '22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Allergies</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, marginBottom: 12 }}>
                {['Penicillin', 'Peanuts'].map(a => (
                  <span key={a} style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(220,38,38,0.18)' }}>{a}</span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>Always notify your doctor</p>
            </div>

            {/* Chronic Conditions */}
            <div style={{ ...fc(240), background: 'white', borderRadius: 18, padding: '22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(11,92,173,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Chronic Conditions</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, marginBottom: 12 }}>
                {['Type 2 Diabetes', 'Hypertension'].map(c => (
                  <span key={c} style={{ fontSize: 12, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(11,92,173,0.15)' }}>{c}</span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>Under active management</p>
            </div>
          </div>

          {/* ── Bottom row ─────────────────────────────────────────── */}
          <div className="dash-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 308px', gap: 18 }}>

            {/* Recent Records */}
            <div style={{ ...fc(320), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Recent Medical Records</h3>
                <button style={{ fontSize: 12, fontWeight: 600, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = BLUE }}
                  onMouseLeave={e => { e.currentTarget.style.color = TEAL }}
                onClick={() => setActiveNav('records')} >View all →</button>
              </div>

              <div style={{ position: 'relative' }}>
                {/* timeline line */}
                <div style={{ position: 'absolute', left: 11, top: 10, bottom: 10, width: 1.5, background: `linear-gradient(to bottom, rgba(11,92,173,0.22), rgba(15,163,163,0.14))`, borderRadius: 99 }} />

                {DASH_RECORDS.map((rec, i) => (
                  <div key={i}
                    style={{ display: 'flex', gap: 16, marginBottom: i < DASH_RECORDS.length - 1 ? 22 : 0, transition: 'transform 0.18s', cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                  >
                    {/* dot */}
                    <div style={{ flexShrink: 0, width: 23, paddingTop: 3 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? BLUE : 'rgba(11,92,173,0.28)', border: i === 0 ? '2px solid white' : 'none', boxShadow: i === 0 ? `0 0 0 3px rgba(11,92,173,0.18)` : 'none' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 2px' }}>{rec.doctor}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{rec.spec} · {rec.date}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(16,185,129,0.20)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                            Verified
                          </span>
                          {rec.ai && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: 'rgba(15,163,163,0.09)', borderRadius: 99, padding: '2px 8px', border: `1px solid rgba(15,163,163,0.20)`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z"/></svg>
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>{rec.diagnosis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Access */}
            <div style={{ ...fc(400), background: 'white', borderRadius: 18, padding: '22px 20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Recent Access</h3>
                <button style={{ fontSize: 12, fontWeight: 600, color: TEAL, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = BLUE }}
                  onMouseLeave={e => { e.currentTarget.style.color = TEAL }}
                onClick={() => setActiveNav('audit')} >Audit Log →</button>
              </div>

              <div style={{ flex: 1 }}>
                {DASH_ACCESS.map((a, i) => (
                  <div key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 8px', borderRadius: 10, borderBottom: i < DASH_ACCESS.length - 1 ? '1px solid rgba(11,92,173,0.06)' : 'none', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, rgba(11,92,173,0.13), rgba(15,163,163,0.13))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: BLUE }}>
                      {a.doctor.replace('Dr. ', '')[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.doctor}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{a.time}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: a.aColor, background: a.aBg, borderRadius: 99, padding: '3px 9px', flexShrink: 0 }}>{a.action}</span>
                  </div>
                ))}
              </div>

              {/* trust note */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(11,92,173,0.07)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>AES-256 encrypted · DGHS Certified</span>
              </div>
            </div>
          </div>
        </div>
        </>}
      </div>

      <style>{`
        @keyframes consentPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(11,92,173,0.10), 0 0 0 0 rgba(11,92,173,0.07); }
          50%       { box-shadow: 0 6px 28px rgba(11,92,173,0.18), 0 0 0 6px rgba(11,92,173,0.05); }
        }
        @keyframes bell-shake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(-14deg); }
          30%  { transform: rotate(13deg); }
          45%  { transform: rotate(-9deg); }
          60%  { transform: rotate(7deg); }
          75%  { transform: rotate(-4deg); }
          88%  { transform: rotate(3deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateY(-2px) translateX(-50%); }
          to   { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        .bell-shake { animation: bell-shake 0.78s ease-in-out; }
        @media (max-width: 960px) { .dash-bottom { grid-template-columns: 1fr !important; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
/* ─── Doctor Dashboard ───────────────────────────────────────────── */
type DoctorNav = 'dash' | 'find' | 'patients' | 'prescription' | 'profile'
type OtpFlow   = 'idle' | 'found' | 'otp' | 'open'

const DR_SESSIONS_INIT = [
  { name: 'Rahim Uddin',  uhid: 'BD-2026-01234', age: 44, gender: 'Male',   expiresMin: 24, since: '2:15 PM' },
  { name: 'Fatema Begum', uhid: 'BD-2026-05678', age: 38, gender: 'Female', expiresMin: 8,  since: '3:40 PM' },
]

/* ── shared OTP flow widget, used in both Dashboard and Find Patient ─ */
type DrSession = typeof DR_SESSIONS_INIT[number]

function OtpFlowWidget({ onGranted }: { onGranted: (sess: DrSession) => void }) {
  const [otpFlow,   setOtpFlow]   = useState<OtpFlow>('idle')
  const [searchQ,   setSearchQ]   = useState('')
  const [otpDigits, setOtpDigits] = useState(['','','','','',''])
  const [countdown, setCountdown] = useState(587)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (otpFlow !== 'otp') return
    setCountdown(587)
    const id = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [otpFlow])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2,'0')}`
  const handleOtp = (i: number, val: string) => {
    const d = [...otpDigits]; d[i] = val.replace(/\D/g,'').slice(-1); setOtpDigits(d)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
    if (!val && i > 0) otpRefs.current[i - 1]?.focus()
  }
  const reset = () => { setOtpFlow('idle'); setSearchQ(''); setOtpDigits(['','','','','','']) }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Find Patient</h3>
        {(otpFlow === 'found' || otpFlow === 'otp' || otpFlow === 'open') && (
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b' }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            New search
          </button>
        )}
      </div>

      {/* IDLE */}
      {otpFlow === 'idle' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search by UHID (BD-XXXX-XXXXX) or mobile number…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQ.trim()) setOtpFlow('found') }}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 44, paddingRight: 16, height: 52, borderRadius: 13, border: '1.5px solid rgba(11,92,173,0.18)', background: '#f8fafc', fontSize: 14, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 4px rgba(11,92,173,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.18)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <button onClick={() => { if (searchQ.trim()) setOtpFlow('found') }}
            style={{ padding: '0 28px', height: 52, borderRadius: 13, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(11,92,173,0.28)', transition: 'all .18s', fontFamily: 'inherit', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.36)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.28)' }}
          >Search</button>
        </div>
      )}

      {/* FOUND */}
      {otpFlow === 'found' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid rgba(11,92,173,0.10)' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.14),rgba(15,163,163,0.14))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 700, color: BLUE }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Rahim Uddin</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(11,92,173,0.15)' }}>BD-2026-01234</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(16,185,129,0.18)' }}>UHID Verified</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>44 years · Male · B+ · DOB 15 Mar 1982</p>
          </div>
          <button onClick={() => setOtpFlow('otp')}
            style={{ padding: '10px 22px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(11,92,173,0.28)', transition: 'all .18s', fontFamily: 'inherit', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.36)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.28)' }}
          >Request Access</button>
        </div>
      )}

      {/* OTP */}
      {otpFlow === 'otp' && (
        <div style={{ background: 'linear-gradient(white,white) padding-box,linear-gradient(135deg,#0B5CAD,#0FA3A3) border-box', border: '2px solid transparent', borderRadius: 16, padding: '22px 24px', animation: 'drConsentPulse 2.8s ease-in-out infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: '#f8fafc', borderRadius: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.14),rgba(15,163,163,0.14))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: BLUE }}>R</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 1px' }}>Rahim Uddin</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>BD-2026-01234 · 44 y · Male</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(245,158,11,0.22)' }}>Awaiting OTP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(11,92,173,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/><path d="M8 6h8"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e', margin: '0 0 5px', lineHeight: 1.4 }}>An OTP has been sent to the patient&apos;s phone.</p>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>Ask the patient for the 6-digit code and enter it below to open their records.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: countdown > 60 ? '#10b981' : '#ef4444', boxShadow: `0 0 0 3px ${countdown > 60 ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: countdown > 60 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>OTP expires in {fmt(countdown)}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
            {otpDigits.map((digit, idx) => (
              <input key={idx} ref={el => { otpRefs.current[idx] = el }} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtp(idx, e.target.value)}
                onKeyDown={e => { if (e.key === 'Backspace' && !digit && idx > 0) otpRefs.current[idx - 1]?.focus() }}
                style={{ width: 56, height: 66, borderRadius: 13, border: `2px solid ${digit ? BLUE : 'rgba(11,92,173,0.20)'}`, background: digit ? 'rgba(11,92,173,0.04)' : 'white', textAlign: 'center', fontSize: 28, fontWeight: 800, color: BLUE, outline: 'none', fontFamily: 'inherit', transition: 'all .15s', boxShadow: digit ? '0 0 0 3px rgba(11,92,173,0.11)' : 'none' }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.12)' }}
                onBlur={e => { if (!e.target.value) { e.target.style.borderColor = 'rgba(11,92,173,0.20)'; e.target.style.boxShadow = 'none' } }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
            <button onClick={() => { setOtpFlow('open'); onGranted({ name: 'Rahim Uddin', uhid: 'BD-2026-01234', age: 44, gender: 'Male', expiresMin: 60, since: 'Just now' }) }}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(11,92,173,0.30)', transition: 'all .18s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.40)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.30)' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
            >Verify &amp; Open Records</button>
            <button onClick={() => { setCountdown(587); setOtpDigits(['','','','','','']); otpRefs.current[0]?.focus() }}
              style={{ background: 'none', border: 'none', color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline', textUnderlineOffset: 3 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.65' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >Resend OTP</button>
            <button onClick={reset} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#64748b' }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
            >Cancel</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(11,92,173,0.08)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Session-scoped · AES-256 encrypted · All access logged · DGHS Certified</span>
          </div>
        </div>
      )}

      {/* OPEN */}
      {otpFlow === 'open' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(16,185,129,0.06)', borderRadius: 14, border: '1.5px solid rgba(16,185,129,0.22)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: '0 0 3px' }}>Access granted — Rahim Uddin&apos;s records are now open.</p>
            <p style={{ fontSize: 12, color: '#047857', margin: 0 }}>Active session · expires in 60 min · Session ID logged for audit</p>
          </div>
          <button onClick={reset} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#10b981', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(16,185,129,0.28)', transition: 'all .15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >New Search</button>
        </div>
      )}
    </div>
  )
}

/* ── Doctor Find Patient page ──────────────────────────────────────── */
const RECENT_SEARCHES = [
  { name: 'Rahim Uddin',    uhid: 'BD-2026-01234', age: 44, gender: 'Male',   blood: 'B+', lastAccess: 'Today, 2:15 PM' },
  { name: 'Fatema Begum',   uhid: 'BD-2026-05678', age: 38, gender: 'Female', blood: 'A+', lastAccess: 'Today, 3:40 PM' },
  { name: 'Karim Hossain',  uhid: 'BD-2025-09821', age: 62, gender: 'Male',   blood: 'O-', lastAccess: 'Yesterday, 11:00 AM' },
]

function DoctorFindPage({ onGranted }: { onGranted: (s: DrSession) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 780, margin: '0 auto', width: '100%', boxSizing: 'border-box' as const }}>
      {/* Large search card */}
      <div style={{ ...fc(0), background: 'white', borderRadius: 22, padding: '32px 36px', boxShadow: '0 4px 24px rgba(11,92,173,0.10)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(11,92,173,0.28)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0c1a2e', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Find Patient</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Search by UHID or registered mobile number to access patient records</p>
        </div>
        <OtpFlowWidget onGranted={onGranted} />
        <p style={{ fontSize: 12, color: '#cbd5e1', margin: '16px 0 0', textAlign: 'center' }}>e.g. BD-2026-01234 &nbsp;·&nbsp; 01700000000</p>
      </div>

      {/* Recent searches */}
      <div style={fc(120)}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Recent Searches</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECENT_SEARCHES.map((p, i) => (
            <div key={p.uhid} style={{ ...fc(140 + i * 60), background: 'white', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(11,92,173,0.07)', border: '1px solid rgba(11,92,173,0.07)', cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(11,92,173,0.07)' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: BLUE }}>{p.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e' }}>{p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(11,92,173,0.14)' }}>{p.uhid}</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.age} y · {p.gender} · {p.blood} · Last accessed {p.lastAccess}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Doctor My Patients page ──────────────────────────────────────── */
type PatientRec = { name: string; uhid: string; age: number; gender: string; blood: string; lastVisit: string; active: boolean; expiresMin?: number }
const MY_PATIENTS_DATA: PatientRec[] = [
  { name: 'Rahim Uddin',    uhid: 'BD-2026-01234', age: 44, gender: 'Male',   blood: 'B+', lastVisit: 'Today',        active: true,  expiresMin: 24 },
  { name: 'Fatema Begum',   uhid: 'BD-2026-05678', age: 38, gender: 'Female', blood: 'A+', lastVisit: 'Today',        active: true,  expiresMin: 8 },
  { name: 'Karim Hossain',  uhid: 'BD-2025-09821', age: 62, gender: 'Male',   blood: 'O-', lastVisit: '3 days ago',   active: false },
  { name: 'Nusrat Jahan',   uhid: 'BD-2025-07712', age: 29, gender: 'Female', blood: 'AB+',lastVisit: '1 week ago',   active: false },
  { name: 'Alim Sheikh',    uhid: 'BD-2024-04431', age: 55, gender: 'Male',   blood: 'A-', lastVisit: '2 weeks ago',  active: false },
  { name: 'Rokeya Khatun',  uhid: 'BD-2024-11102', age: 47, gender: 'Female', blood: 'B-', lastVisit: '1 month ago',  active: false },
]

function DoctorMyPatientsPage({ activeSessions, onRequestAccess }: { activeSessions: DrSession[]; onRequestAccess: () => void }) {
  const [mounted, setMounted]     = useState(false)
  const [filter,  setFilter]      = useState<'all' | 'active' | 'recent'>('all')
  const [searchQ, setSearchQ]     = useState('')

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const filtered = MY_PATIENTS_DATA
    .map(p => ({ ...p, active: activeSessions.some(s => s.uhid === p.uhid) }))
    .filter(p => {
      if (filter === 'active') return p.active
      if (filter === 'recent') return p.lastVisit.includes('Today') || p.lastVisit.includes('days')
      return true
    })
    .filter(p => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.uhid.toLowerCase().includes(searchQ.toLowerCase()))

  const FILTERS: { id: 'all'|'active'|'recent'; label: string }[] = [
    { id: 'all', label: 'All Patients' },
    { id: 'active', label: 'Active Session' },
    { id: 'recent', label: 'Recent' },
  ]

  return (
    <div style={{ padding: '28px 32px 60px', boxSizing: 'border-box' as const }}>
      {/* Filter bar */}
      <div style={{ ...fc(0), display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' as const }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search patients…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 40, paddingRight: 14, height: 40, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.16)', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.16)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid', borderColor: filter === f.id ? BLUE : 'rgba(11,92,173,0.16)', background: filter === f.id ? `rgba(11,92,173,0.08)` : 'white', color: filter === f.id ? BLUE : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            >{f.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' as const }}>{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Patient grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        {filtered.map((p, i) => {
          const sessExp = activeSessions.find(s => s.uhid === p.uhid)?.expiresMin
          return (
            <div key={p.uhid} style={{ ...fc(i * 55), background: 'white', borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: `1px solid ${p.active ? 'rgba(16,185,129,0.22)' : 'rgba(11,92,173,0.07)'}`, transition: 'transform .2s,box-shadow .2s', display: 'flex', flexDirection: 'column', gap: 14 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 700, color: BLUE }}>{p.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#0c1a2e', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{p.age} y · {p.gender} · Blood {p.blood}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '3px 9px', border: '1px solid rgba(11,92,173,0.14)' }}>{p.uhid}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Last visit: {p.lastVisit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(11,92,173,0.07)' }}>
                {p.active
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: sessExp && sessExp <= 10 ? '#ef4444' : '#10b981', background: sessExp && sessExp <= 10 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '4px 11px', border: `1px solid ${sessExp && sessExp <= 10 ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.22)'}` }}>● Active Session · {sessExp} min left</span>
                  : <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', borderRadius: 99, padding: '4px 11px', border: '1px solid #e2e8f0' }}>Access expired</span>
                }
                <button onClick={p.active ? undefined : onRequestAccess}
                  style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: p.active ? `linear-gradient(135deg,${BLUE},${TEAL})` : 'rgba(11,92,173,0.08)', color: p.active ? 'white' : BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: p.active ? '0 3px 10px rgba(11,92,173,0.25)' : 'none', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                >{p.active ? 'Open Records' : 'Request Access'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Doctor Write Prescription page ──────────────────────────────── */
type MedRow = { id: number; name: string; dose: string; freq: string; dur: string }

function DoctorPrescriptionPage() {
  const [mounted,    setMounted]    = useState(false)
  const [diagnosis,  setDiagnosis]  = useState('')
  const [symptoms,   setSymptoms]   = useState<string[]>(['Chest pain','Shortness of breath','Fatigue'])
  const [symptomQ,   setSymptomQ]   = useState('')
  const [meds,       setMeds]       = useState<MedRow[]>([
    { id: 1, name: 'Metformin',   dose: '500mg', freq: 'Twice daily', dur: '30 days' },
    { id: 2, name: 'Aspirin',     dose: '75mg',  freq: 'Once daily',  dur: '30 days' },
  ])
  const [tests,      setTests]      = useState<string[]>(['ECG','CBC','HbA1c','Lipid panel'])
  const [testQ,      setTestQ]      = useState('')
  const [followDate, setFollowDate] = useState('')
  const [notes,      setNotes]      = useState('')
  const [saved,      setSaved]      = useState(false)
  const nextMedId = useRef(3)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const addMed = () => { setMeds(m => [...m, { id: nextMedId.current++, name: '', dose: '', freq: 'Once daily', dur: '7 days' }]) }
  const updMed = (id: number, field: keyof MedRow, val: string) => setMeds(m => m.map(r => r.id === id ? { ...r, [field]: val } : r))
  const delMed = (id: number) => setMeds(m => m.filter(r => r.id !== id))

  const addSymptom = () => { if (symptomQ.trim()) { setSymptoms(s => [...s, symptomQ.trim()]); setSymptomQ('') } }
  const addTest    = () => { if (testQ.trim()) { setTests(t => [...t, testQ.trim()]); setTestQ('') } }

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '9px 12px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.16)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }
  const focusIn  = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }
  const focusOut = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(11,92,173,0.16)'; e.target.style.boxShadow = 'none' }

  if (saved) return (
    <div style={{ padding: '80px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#065f46', margin: 0 }}>Prescription Signed &amp; Saved</h2>
      <p style={{ fontSize: 14, color: '#047857', margin: 0 }}>Record verified by Dr. Ayesha Karim · BMDC A-29871 · Session logged</p>
      <button onClick={() => setSaved(false)} style={{ marginTop: 8, padding: '12px 32px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(11,92,173,0.30)' }}>New Prescription</button>
    </div>
  )

  return (
    <div style={{ padding: '24px 32px 60px', boxSizing: 'border-box' as const }}>

      {/* Patient strip */}
      <div style={{ ...fc(0), background: 'white', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, fontWeight: 700, color: BLUE }}>R</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0c1a2e' }}>Rahim Uddin</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(11,92,173,0.14)' }}>BD-2026-01234</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(16,185,129,0.18)' }}>Active Session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>44 y · Male · B+</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Allergies:</span>
            {['Penicillin','Sulfa drugs'].map(a => (
              <span key={a} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: 'rgba(239,68,68,0.08)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(239,68,68,0.20)' }}>{a}</span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Clinical Summary */}
      <div style={{ ...fc(80), background: 'linear-gradient(white,white) padding-box,linear-gradient(135deg,#0B5CAD,#0FA3A3) border-box', border: '2px solid transparent', borderRadius: 18, padding: '20px 24px', boxShadow: '0 2px 14px rgba(11,92,173,0.10)', marginBottom: 18, animation: 'drConsentPulse 3.5s ease-in-out infinite' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>AI Clinical Summary</h3>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', borderRadius: 99, padding: '2px 9px', marginLeft: 'auto' }}>AI-assisted · verified by doctor</span>
        </div>
        <p style={{ fontSize: 13, color: '#334155', margin: '0 0 14px', lineHeight: 1.7 }}>Chronic diabetic (Type 2) on Metformin 500mg BD. Hypertensive, controlled on Amlodipine 5mg. History of mild angina. <strong>Allergic to Penicillin and Sulfa drugs.</strong> Last HbA1c: 7.8% (3 months ago).</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 220, background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(239,68,68,0.18)', animation: 'aiAlertPulse 2.2s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Drug Interaction Alert</span>
            </div>
            <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>Avoid Clarithromycin with Metformin — risk of lactic acidosis. Avoid NSAIDs with current cardiac history.</p>
          </div>
          <div style={{ flex: 1, minWidth: 220, background: 'rgba(245,158,11,0.06)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(245,158,11,0.22)', animation: 'aiAlertPulse 2.2s ease-in-out infinite 0.4s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Allergy Alert</span>
            </div>
            <p style={{ fontSize: 12, color: '#78350f', margin: 0 }}>Patient allergic to Penicillin &amp; Sulfa drugs. Verify all antibiotic prescriptions before signing.</p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div style={{ ...fc(160), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(11,92,173,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: BLUE }}>1</span>
          Diagnosis
        </h4>
        <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Primary diagnosis…"
          style={{ ...inputStyle, height: 80, resize: 'vertical' as const, lineHeight: 1.6 }}
          onFocus={focusIn} onBlur={focusOut}
        />
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 8px' }}>Symptoms</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, marginBottom: 10 }}>
            {symptoms.map(s => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(11,92,173,0.16)' }}>
                {s}
                <button onClick={() => setSymptoms(sx => sx.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', lineHeight: 1, fontSize: 14, display: 'flex' }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={symptomQ} onChange={e => setSymptomQ(e.target.value)} placeholder="Add symptom…"
              onKeyDown={e => { if (e.key === 'Enter') addSymptom() }}
              style={{ ...inputStyle, flex: 1, height: 38 }} onFocus={focusIn} onBlur={focusOut}
            />
            <button onClick={addSymptom} style={{ padding: '0 16px', height: 38, borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>+ Add</button>
          </div>
        </div>
      </div>

      {/* Medications */}
      <div style={{ ...fc(220), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(11,92,173,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: BLUE }}>2</span>
          Medications
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 1fr 32px', gap: 8, marginBottom: 8 }}>
          {['Medicine', 'Dose', 'Frequency', 'Duration', ''].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', paddingBottom: 4 }}>{h}</span>
          ))}
        </div>
        {meds.map(m => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input value={m.name} onChange={e => updMed(m.id,'name',e.target.value)} placeholder="Medicine name" style={{ ...inputStyle, height: 38 }} onFocus={focusIn} onBlur={focusOut} />
            <input value={m.dose} onChange={e => updMed(m.id,'dose',e.target.value)} placeholder="Dose" style={{ ...inputStyle, height: 38 }} onFocus={focusIn} onBlur={focusOut} />
            <select value={m.freq} onChange={e => updMed(m.id,'freq',e.target.value)} style={{ ...inputStyle, height: 38, cursor: 'pointer', appearance: 'none' as const }}>
              {['Once daily','Twice daily','Three times daily','As needed','Before meals','After meals','At bedtime'].map(f => <option key={f}>{f}</option>)}
            </select>
            <input value={m.dur} onChange={e => updMed(m.id,'dur',e.target.value)} placeholder="7 days" style={{ ...inputStyle, height: 38 }} onFocus={focusIn} onBlur={focusOut} />
            <button onClick={() => delMed(m.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.24)', background: 'rgba(239,68,68,0.05)', color: '#dc2626', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#dc2626' }}
            >×</button>
          </div>
        ))}
        <button onClick={addMed} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '8px 16px', borderRadius: 9, border: `1.5px dashed rgba(11,92,173,0.28)`, background: 'rgba(11,92,173,0.04)', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.09)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.04)' }}
        >+ Add medication</button>
      </div>

      {/* Recommended Tests */}
      <div style={{ ...fc(280), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 14 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(11,92,173,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: BLUE }}>3</span>
          Recommended Tests
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7, marginBottom: 12 }}>
          {tests.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: TEAL, background: 'rgba(15,163,163,0.08)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(15,163,163,0.22)' }}>
              {t}
              <button onClick={() => setTests(tx => tx.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', lineHeight: 1, fontSize: 14, display: 'flex' }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={testQ} onChange={e => setTestQ(e.target.value)} placeholder="Add test (e.g. X-ray, Urine R/E)…"
            onKeyDown={e => { if (e.key === 'Enter') addTest() }}
            style={{ ...inputStyle, flex: 1, height: 38 }} onFocus={focusIn} onBlur={focusOut}
          />
          <button onClick={addTest} style={{ padding: '0 16px', height: 38, borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>+ Add</button>
        </div>
      </div>

      {/* Follow-up */}
      <div style={{ ...fc(340), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 28 }}>
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(11,92,173,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: BLUE }}>4</span>
          Follow-up &amp; Notes
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Follow-up date</p>
            <input type="date" value={followDate} onChange={e => setFollowDate(e.target.value)}
              style={{ ...inputStyle, height: 40, cursor: 'pointer' }} onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Additional notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Clinical notes, patient instructions…"
              style={{ ...inputStyle, height: 80, resize: 'vertical' as const, lineHeight: 1.6 }} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={fc(400)}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setSaved(true)}
            style={{ padding: '14px 36px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(11,92,173,0.32)', transition: 'all .18s', letterSpacing: '-0.2px' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(11,92,173,0.42)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,92,173,0.32)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}><path d="m5 12 5 5L20 7"/></svg>
            Save &amp; Sign Record
          </button>
          <button style={{ padding: '14px 24px', borderRadius: 14, border: '1.5px solid rgba(11,92,173,0.20)', background: 'white', color: '#64748b', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.20)'; e.currentTarget.style.color = '#64748b' }}
          >Cancel</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Prescription signed with BMDC credentials · AES-256 stored · DGHS compliant</span>
        </div>
      </div>
    </div>
  )
}

/* ── Doctor Profile page ──────────────────────────────────────────── */
function DoctorProfilePage() {
  const [mounted,   setMounted]   = useState(false)
  const [editing,   setEditing]   = useState<string|null>(null)
  const [profInfo,  setProfInfo]  = useState({ name: 'Dr. Ayesha Karim', bmdc: 'A-29871', spec: 'Cardiologist', hospital: 'Dhaka Medical College Hospital', chamber: 'LifeCare Cardiac Centre, Dhanmondi', exp: '12' })
  const [contact,   setContact]   = useState({ phone: '+880 1712-345678', email: 'ayesha.karim@healthnexus.bd' })

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const Card = ({ children, delay, style: s }: { children: ReactNode; delay: number; style?: React.CSSProperties }) => (
    <div style={{ ...fc(delay), background: 'white', borderRadius: 18, padding: '24px 26px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 16, transition: 'transform .2s,box-shadow .2s', ...s }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,92,173,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
    >{children}</div>
  )

  const inputStyle = { padding: '8px 12px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.18)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s', width: '100%', boxSizing: 'border-box' as const }
  const focusIn  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(11,92,173,0.18)'; e.target.style.boxShadow = 'none' }

  const Row = ({ label, value, field, val, setter }: { label: string; value: string; field: string; val: string; setter: (v: string) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(11,92,173,0.06)', marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</span>
      {editing === field
        ? <input value={val} onChange={e => setter(e.target.value)} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{value}</span>
      }
    </div>
  )

  return (
    <div style={{ padding: '24px 32px 60px', maxWidth: 760, boxSizing: 'border-box' as const }}>

      {/* Header */}
      <div style={{ ...fc(0), background: `linear-gradient(135deg,${BLUE},${TEAL})`, borderRadius: 22, padding: '32px 30px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 30, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', border: '3px solid rgba(255,255,255,0.40)' }}>A</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${BLUE}`, cursor: 'pointer' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Dr. Ayesha Karim</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)', margin: '0 0 10px' }}>Cardiologist · 12 years experience</p>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(255,255,255,0.90)', borderRadius: 99, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              BMDC Verified · A-29871
            </span>
          </div>
        </div>
      </div>

      {/* Professional info */}
      <Card delay={80}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Professional Information</h4>
          <button onClick={() => setEditing(e => e === 'prof' ? null : 'prof')}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: editing === 'prof' ? `linear-gradient(135deg,${BLUE},${TEAL})` : 'rgba(11,92,173,0.08)', color: editing === 'prof' ? 'white' : BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: editing === 'prof' ? '0 3px 10px rgba(11,92,173,0.28)' : 'none', transition: 'all .15s' }}
          >{editing === 'prof' ? 'Save' : 'Edit'}</button>
        </div>
        <Row label="Full name" value={profInfo.name} field="prof" val={profInfo.name} setter={v => setProfInfo(p => ({...p,name:v}))} />
        <Row label="BMDC No." value={profInfo.bmdc} field="prof" val={profInfo.bmdc} setter={v => setProfInfo(p => ({...p,bmdc:v}))} />
        <Row label="Specialization" value={profInfo.spec} field="prof" val={profInfo.spec} setter={v => setProfInfo(p => ({...p,spec:v}))} />
        <Row label="Hospital" value={profInfo.hospital} field="prof" val={profInfo.hospital} setter={v => setProfInfo(p => ({...p,hospital:v}))} />
        <Row label="Chamber" value={profInfo.chamber} field="prof" val={profInfo.chamber} setter={v => setProfInfo(p => ({...p,chamber:v}))} />
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Experience</span>
          {editing === 'prof'
            ? <input value={profInfo.exp} onChange={e => setProfInfo(p => ({...p,exp:e.target.value}))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{profInfo.exp} years</span>
          }
        </div>
      </Card>

      {/* Contact */}
      <Card delay={160}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Contact Information</h4>
          <button onClick={() => setEditing(e => e === 'contact' ? null : 'contact')}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: editing === 'contact' ? `linear-gradient(135deg,${BLUE},${TEAL})` : 'rgba(11,92,173,0.08)', color: editing === 'contact' ? 'white' : BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: editing === 'contact' ? '0 3px 10px rgba(11,92,173,0.28)' : 'none', transition: 'all .15s' }}
          >{editing === 'contact' ? 'Save' : 'Edit'}</button>
        </div>
        <Row label="Phone" value={contact.phone} field="contact" val={contact.phone} setter={v => setContact(c => ({...c,phone:v}))} />
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</span>
          {editing === 'contact'
            ? <input value={contact.email} onChange={e => setContact(c => ({...c,email:e.target.value}))} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{contact.email}</span>
          }
        </div>
      </Card>

      {/* Security */}
      <Card delay={240}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 18px' }}>Security</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid rgba(11,92,173,0.07)', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>Password</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Last changed 3 months ago</p>
          </div>
          <button style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: 'rgba(11,92,173,0.08)', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.08)' }}
          >Change Password</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>Two-Factor Authentication (OTP)</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Required for all patient access requests</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(16,185,129,0.22)' }}>Enabled</span>
        </div>
      </Card>

      {/* Activity Summary */}
      <Card delay={320}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 18px' }}>Activity Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Total Patients', value: '284', color: BLUE, bg: 'rgba(11,92,173,0.08)' },
            { label: 'Records Created', value: '1,041', color: TEAL, bg: 'rgba(15,163,163,0.10)' },
            { label: 'Active Sessions', value: '2', color: '#10b981', bg: 'rgba(16,185,129,0.09)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '16px', textAlign: 'center' as const }}>
              <p style={{ fontSize: 32, fontWeight: 900, color: stat.color, margin: '0 0 4px', letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{stat.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(11,92,173,0.07)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>All activity logged for audit · AES-256 encrypted · DGHS Certified</span>
        </div>
      </Card>
    </div>
  )
}

/* ── DoctorDashboard shell ────────────────────────────────────────── */
function DoctorDashboard({ onLogout, onNavigateHome }: { onLogout: () => void; onNavigateHome: () => void }) {
  const [activeNav,  setActiveNav]  = useState<DoctorNav>('dash')
  const [mounted,    setMounted]    = useState(false)
  const [drSessions, setDrSessions] = useState<DrSession[]>(DR_SESSIONS_INIT)
  const [bellShake,  setBellShake]  = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  useEffect(() => { setBellShake(true); const t = setTimeout(() => setBellShake(false), 1300); return () => clearTimeout(t) }, [])

  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const grantSession = useCallback((sess: DrSession) => {
    setDrSessions(prev => [sess, ...prev.filter(s => s.uhid !== sess.uhid)])
  }, [])

  const drNavItems: { id: DoctorNav; label: string; icon: ReactNode }[] = [
    { id: 'dash',         label: 'Dashboard',          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'find',         label: 'Find Patient',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
    { id: 'patients',     label: 'My Patients',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'prescription', label: 'Write Prescription', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
    { id: 'profile',      label: 'Profile',            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  ]

  const topbarTitles: Record<DoctorNav, ReactNode> = {
    dash:         <><span style={{ color: BLUE }}>Dr. Ayesha</span></>,
    find:         <>Find Patient</>,
    patients:     <>My Patients</>,
    prescription: <>Write Prescription</>,
    profile:      <>Profile</>,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f5fb', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, flexShrink: 0, height: '100vh', background: 'white', borderRight: '1px solid rgba(11,92,173,0.09)', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 16px rgba(11,92,173,0.06)' }}>
        <div onClick={onNavigateHome} style={{ padding: '20px 18px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(11,92,173,0.07)' }}>
          <div style={{ background: `linear-gradient(135deg,${BLUE},${TEAL})`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(11,92,173,0.28)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" fill="white"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: BLUE, margin: 0, letterSpacing: '-0.2px', lineHeight: 1.2 }}>HealthNexus</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, margin: 0 }}>BD · Doctor Portal</p>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {drNavItems.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: active ? 'rgba(11,92,173,0.09)' : 'transparent', color: active ? BLUE : '#64748b', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, marginBottom: 2, textAlign: 'left', transition: 'all .18s', position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(11,92,173,0.05)'; e.currentTarget.style.color = '#334155' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: 99, background: `linear-gradient(to bottom,${BLUE},${TEAL})` }} />}
                <span style={{ flexShrink: 0, marginLeft: active ? 6 : 0, transition: 'margin .18s' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div style={{ borderTop: '1px solid rgba(11,92,173,0.07)', padding: '14px 14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 14, fontWeight: 700 }}>A</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr. Ayesha Karim</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Cardiologist</p>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(16,185,129,0.20)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
            BMDC Verified · A-29871
          </span>
          <div>
            <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 500, padding: '4px 0', fontFamily: 'inherit', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(11,92,173,0.08)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 10px rgba(11,92,173,0.07)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div>
            {activeNav === 'dash' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.3px' }}>Welcome, {topbarTitles.dash}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(16,185,129,0.20)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                    BMDC A-29871 · Verified
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            ) : (
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.3px' }}>{topbarTitles[activeNav]}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button className={bellShake ? 'bell-shake' : ''} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,92,173,0.06)', border: '1.5px solid rgba(11,92,173,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: BLUE, transition: 'background .18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>2</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(11,92,173,0.28)' }}>A</div>
          </div>
        </div>

        {/* Sub-pages */}
        {activeNav === 'find'         && <DoctorFindPage onGranted={grantSession} />}
        {activeNav === 'patients'     && <DoctorMyPatientsPage activeSessions={drSessions} onRequestAccess={() => setActiveNav('find')} />}
        {activeNav === 'prescription' && <DoctorPrescriptionPage />}
        {activeNav === 'profile'      && <DoctorProfilePage />}

        {/* Dashboard */}
        {activeNav === 'dash' && (
          <div style={{ padding: '24px 28px 48px', flex: 1 }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { delay: 0,   label: 'Active Sessions',    value: drSessions.length, color: TEAL,      iconColor: TEAL,      bg: 'rgba(15,163,163,0.12)', sub: 'Consented patients now',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg> },
                { delay: 80,  label: 'Patients Seen Today', value: 7,               color: BLUE,      iconColor: BLUE,      bg: 'rgba(11,92,173,0.10)',  sub: 'Outpatient consultations', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { delay: 160, label: 'Pending Reports',    value: 3,               color: '#f59e0b', iconColor: '#f59e0b', bg: 'rgba(245,158,11,0.10)', sub: 'Lab results to review',    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
              ].map(stat => (
                <div key={stat.label} style={{ ...fc(stat.delay), background: 'white', borderRadius: 18, padding: '22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', transition: 'transform .2s,box-shadow .2s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.iconColor }}>{stat.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{stat.label}</span>
                  </div>
                  <p style={{ fontSize: 44, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: '#cbd5e1', margin: '10px 0 0' }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick find */}
            <div style={{ ...fc(240), background: 'white', borderRadius: 20, padding: '24px 26px', boxShadow: '0 2px 16px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.08)', marginBottom: 20 }}>
              <OtpFlowWidget onGranted={grantSession} />
            </div>

            {/* Active sessions */}
            <div style={fc(320)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Active Patient Sessions</h3>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{drSessions.length} patient{drSessions.length !== 1 ? 's' : ''}</span>
              </div>
              {drSessions.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 18, padding: '32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No active sessions. Search for a patient to begin.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {drSessions.map((sess, i) => (
                    <div key={`${sess.uhid}-${i}`} style={{ background: 'white', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform .2s,box-shadow .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,92,173,0.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.13),rgba(15,163,163,0.13))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: BLUE }}>{sess.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#0c1a2e', margin: 0 }}>{sess.name}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(11,92,173,0.14)' }}>{sess.uhid}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: sess.expiresMin <= 10 ? '#ef4444' : '#10b981', background: sess.expiresMin <= 10 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: `1px solid ${sess.expiresMin <= 10 ? 'rgba(239,68,68,0.20)' : 'rgba(16,185,129,0.20)'}` }}>
                          ● {sess.expiresMin <= 10 ? 'Expiring soon' : 'Active'} · {sess.expiresMin} min left
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(11,92,173,0.25)', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(11,92,173,0.32)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(11,92,173,0.25)' }}
                        >Open Records</button>
                        <button onClick={() => setDrSessions(s => s.filter((_, idx) => idx !== i))}
                          style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.05)', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#dc2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)' }}
                        >End</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>All sessions logged for audit · AES-256 encrypted · DGHS Certified</span>
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes drConsentPulse {
          0%,100% { box-shadow: 0 4px 20px rgba(11,92,173,0.10),0 0 0 0 rgba(11,92,173,0.07); }
          50%      { box-shadow: 0 6px 28px rgba(11,92,173,0.18),0 0 0 6px rgba(11,92,173,0.05); }
        }
        @keyframes aiAlertPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        }
        @keyframes bell-shake {
          0%  { transform: rotate(0deg); }  15% { transform: rotate(-14deg); }
          30% { transform: rotate(13deg); } 45% { transform: rotate(-9deg); }
          60% { transform: rotate(7deg); }  75% { transform: rotate(-4deg); }
          88% { transform: rotate(3deg); }  100%{ transform: rotate(0deg); }
        }
        .bell-shake { animation: bell-shake 1.3s cubic-bezier(.36,.07,.19,.97); }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}

/* ─── Lab Dashboard ──────────────────────────────────────────────── */
type LabNav = 'dash' | 'uploads' | 'profile'

const LAB_PENDING = [
  { id: 1, patient: 'Rahim U.',   uhid: 'BD-2026-01234', test: 'HbA1c',       doctor: 'Dr. Ayesha Karim', date: 'Today',      daysAgo: 0 },
  { id: 2, patient: 'Fatema B.',  uhid: 'BD-2026-05678', test: 'Lipid Panel',  doctor: 'Dr. Ayesha Karim', date: 'Today',      daysAgo: 0 },
  { id: 3, patient: 'Karim H.',   uhid: 'BD-2025-09821', test: 'CBC',          doctor: 'Dr. Priya Sen',    date: '2 days ago', daysAgo: 2 },
  { id: 4, patient: 'Nusrat J.',  uhid: 'BD-2025-07712', test: 'Urine R/E',    doctor: 'Dr. Priya Sen',    date: '3 days ago', daysAgo: 3 },
  { id: 5, patient: 'Alim S.',    uhid: 'BD-2024-04431', test: 'ECG',          doctor: 'Dr. Rana Islam',   date: '5 days ago', daysAgo: 5 },
]

const LAB_UPLOADS_INIT = [
  { id: 1, test: 'Blood Glucose FBS', uhid: 'BD-2026-01234', doctor: 'Dr. Ayesha Karim', date: 'Today, 10:14 AM',     size: '1.2 MB' },
  { id: 2, test: 'ECG',               uhid: 'BD-2026-05678', doctor: 'Dr. Ayesha Karim', date: 'Today, 9:02 AM',      size: '0.8 MB' },
  { id: 3, test: 'Chest X-Ray',       uhid: 'BD-2025-09821', doctor: 'Dr. Priya Sen',    date: 'Yesterday, 3:45 PM',  size: '4.1 MB' },
  { id: 4, test: 'CBC',               uhid: 'BD-2025-07712', doctor: 'Dr. Priya Sen',    date: 'Yesterday, 11:20 AM', size: '0.6 MB' },
  { id: 5, test: 'HbA1c',             uhid: 'BD-2024-04431', doctor: 'Dr. Rana Islam',   date: '3 days ago',          size: '0.9 MB' },
  { id: 6, test: 'Lipid Panel',       uhid: 'BD-2024-11102', doctor: 'Dr. Rana Islam',   date: '5 days ago',          size: '1.1 MB' },
]

type LabUploadCtx = { testName: string; patient: string; uhid: string; doctor: string } | null

/* shared sidebar + topbar shell for all lab pages */
function LabShell({ activeNav, onNav, onLogout, onNavigateHome, children, topTitle }: {
  activeNav: LabNav; onNav: (n: LabNav) => void; onLogout: () => void; onNavigateHome: () => void
  children: ReactNode; topTitle?: ReactNode
}) {
  const [bellShake, setBellShake] = useState(false)
  useEffect(() => { setBellShake(true); const t = setTimeout(() => setBellShake(false), 1300); return () => clearTimeout(t) }, [])

  const navItems: { id: LabNav; label: string; icon: ReactNode }[] = [
    { id: 'dash',    label: 'Dashboard',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'uploads', label: 'My Uploads', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg> },
    { id: 'profile', label: 'Profile',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: '#f0f5fb', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, height: '100vh', background: 'white', borderRight: '1px solid rgba(11,92,173,0.09)', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 16px rgba(11,92,173,0.06)' }}>
        <div onClick={onNavigateHome} style={{ padding: '20px 18px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(11,92,173,0.07)' }}>
          <div style={{ background: `linear-gradient(135deg,${BLUE},${TEAL})`, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(11,92,173,0.28)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 4.022 3.998 2 7 2c1.981 0 3.93.788 5 2.021C13.07 2.788 15.019 2 17 2c3.002 0 6 2.022 6 5.191 0 4.105-5.37 8.863-11 14.402z" fill="white"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: BLUE, margin: 0, letterSpacing: '-0.2px', lineHeight: 1.2 }}>HealthNexus</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, margin: 0 }}>BD · Lab Portal</p>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 11, border: 'none', cursor: 'pointer', background: active ? 'rgba(11,92,173,0.09)' : 'transparent', color: active ? BLUE : '#64748b', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, marginBottom: 2, textAlign: 'left', transition: 'all .18s', position: 'relative' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(11,92,173,0.05)'; e.currentTarget.style.color = '#334155' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: 3, borderRadius: 99, background: `linear-gradient(to bottom,${BLUE},${TEAL})` }} />}
                <span style={{ flexShrink: 0, marginLeft: active ? 6 : 0, transition: 'margin .18s' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div style={{ borderTop: '1px solid rgba(11,92,173,0.07)', padding: '14px 14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 12, fontWeight: 800 }}>PC</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>PathCare Diagnostics</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Diagnostic Centre</p>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(16,185,129,0.20)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
            DGHS Approved Lab
          </span>
          <div>
            <button onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, fontWeight: 500, padding: '4px 0', fontFamily: 'inherit', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ background: 'white', borderBottom: '1px solid rgba(11,92,173,0.08)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 10px rgba(11,92,173,0.07)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div>
            {topTitle ? (
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.3px' }}>{topTitle}</p>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.3px' }}>Welcome, <span style={{ color: BLUE }}>PathCare Diagnostics</span></p>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(16,185,129,0.20)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                    DGHS Approved Lab
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <button className={bellShake ? 'bell-shake' : ''} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,92,173,0.06)', border: '1.5px solid rgba(11,92,173,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: BLUE, transition: 'background .18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>3</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 10px rgba(11,92,173,0.28)' }}>PC</div>
          </div>
        </div>
        {children}
      </div>

      <style>{`
        @keyframes drConsentPulse { 0%,100%{box-shadow:0 4px 20px rgba(11,92,173,0.10),0 0 0 0 rgba(11,92,173,0.07);}50%{box-shadow:0 6px 28px rgba(11,92,173,0.18),0 0 0 6px rgba(11,92,173,0.05);} }
        @keyframes labUploadPulse { 0%,100%{box-shadow:0 0 0 0 rgba(11,92,173,0.07);}50%{box-shadow:0 0 0 6px rgba(11,92,173,0.04);} }
        @keyframes expandIn { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;} }
        @keyframes bell-shake {
          0%{transform:rotate(0deg);}15%{transform:rotate(-14deg);}30%{transform:rotate(13deg);}45%{transform:rotate(-9deg);}60%{transform:rotate(7deg);}75%{transform:rotate(-4deg);}88%{transform:rotate(3deg);}100%{transform:rotate(0deg);}
        }
        .bell-shake{animation:bell-shake 1.3s cubic-bezier(.36,.07,.19,.97);}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
      `}</style>
    </div>
  )
}

/* ── Lab inline search-and-upload widget ─────────────────────────── */
type UploadStep = 'search' | 'found' | 'uploading' | 'done'

function LabSearchUploadCard({ onUploaded }: { onUploaded: () => void }) {
  const [searchQ,   setSearchQ]   = useState('')
  const [step,      setStep]      = useState<UploadStep>('search')
  const [selTest,   setSelTest]   = useState<typeof LAB_PENDING[number] | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const [file,      setFile]      = useState<string | null>(null)
  const [progress,  setProgress]  = useState(0)
  const [pct,       setPct]       = useState(0)
  const [testDate,  setTestDate]  = useState('')
  const [notes,     setNotes]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const patientTests = LAB_PENDING.filter(p => p.uhid === 'BD-2026-01234')

  const startUpload = () => {
    if (!file) return
    setStep('uploading')
    setPct(0)
    let p = 0
    const id = setInterval(() => {
      p += Math.random() * 16 + 7
      if (p >= 100) { p = 100; clearInterval(id); setStep('done'); onUploaded() }
      setPct(Math.min(p, 100))
    }, 160)
  }

  const reset = () => { setStep('search'); setSearchQ(''); setSelTest(null); setFile(null); setPct(0); setTestDate(''); setNotes('') }

  const inSt = { padding: '8px 12px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.16)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s', width: '100%', boxSizing: 'border-box' as const }
  const fi = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }
  const fo = (e: React.FocusEvent<HTMLInputElement|HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(11,92,173,0.16)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{ background: 'white', borderRadius: 22, padding: '26px 28px', boxShadow: '0 4px 24px rgba(11,92,173,0.10)', border: '1px solid rgba(11,92,173,0.08)', transition: 'all .3s' }}>

      {/* Card title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(11,92,173,0.30)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>Find Patient &amp; Upload Report</h3>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Labs upload reports for prescribed tests only — no access to patient history</p>
        </div>
        {step !== 'search' && (
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b' }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            New search
          </button>
        )}
      </div>

      {/* STEP: search */}
      {(step === 'search' || step === 'found') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: step === 'found' ? 20 : 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search patient by UHID or mobile number…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && searchQ.trim()) setStep('found') }}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 44, paddingRight: 16, height: 52, borderRadius: 13, border: '1.5px solid rgba(11,92,173,0.18)', background: '#f8fafc', fontSize: 14, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 4px rgba(11,92,173,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.18)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <button onClick={() => { if (searchQ.trim()) setStep('found') }}
            style={{ padding: '0 26px', height: 52, borderRadius: 13, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(11,92,173,0.28)', transition: 'all .18s', fontFamily: 'inherit', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,92,173,0.36)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.28)' }}
          >Search</button>
        </div>
      )}

      {step === 'search' && (
        <p style={{ fontSize: 12, color: '#cbd5e1', margin: '10px 0 0', textAlign: 'center' }}>e.g. BD-2026-01234 &nbsp;·&nbsp; 01700000000</p>
      )}

      {/* STEP: patient found + test list */}
      {step === 'found' && !selTest && (
        <div style={{ animation: 'expandIn .28s ease' }}>
          {/* Patient strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#f0f7ff', borderRadius: 14, border: '1px solid rgba(11,92,173,0.12)', marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.14),rgba(15,163,163,0.14))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 700, color: BLUE }}>R</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0c1a2e' }}>Rahim Uddin</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(11,92,173,0.16)' }}>BD-2026-01234</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(16,185,129,0.18)' }}>UHID Verified</span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>44 years · Male · B+</span>
            </div>
          </div>
          {/* Scope note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.20)', marginBottom: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 12, color: '#92400e' }}>Labs upload reports for <strong>prescribed tests only</strong> — patient medical history is not visible.</span>
          </div>
          {/* Test rows */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 9px' }}>Prescribed Tests Awaiting Report</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {patientTests.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid rgba(11,92,173,0.08)', transition: 'background .15s,transform .15s,box-shadow .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(15,163,163,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 2px' }}>{t.test}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Prescribed by {t.doctor} · {t.date}</p>
                </div>
                <button onClick={() => setSelTest(t)}
                  style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(11,92,173,0.25)', transition: 'all .15s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(11,92,173,0.32)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(11,92,173,0.25)' }}
                >Upload</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP: upload panel (inline) */}
      {(step === 'found' && selTest || step === 'uploading') && selTest && (
        <div style={{ animation: 'expandIn .28s ease' }}>
          {/* Mini patient+test strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#f0f7ff', borderRadius: 12, border: '1px solid rgba(11,92,173,0.12)', marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.14),rgba(15,163,163,0.14))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: BLUE }}>R</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e' }}>Rahim Uddin</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.09)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(11,92,173,0.16)' }}>BD-2026-01234</span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Test: <strong>{selTest.test}</strong> · {selTest.doctor}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: 'rgba(15,163,163,0.09)', borderRadius: 99, padding: '3px 10px', border: '1px solid rgba(15,163,163,0.22)' }}>Prescription verified</span>
            <button onClick={() => setSelTest(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#64748b' }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
            >‹ Back</button>
          </div>

          {/* Test name read-only */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Test Name</p>
            <div style={{ padding: '9px 14px', background: '#f1f5f9', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.10)', fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
              {selTest.test}
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', background: '#e2e8f0', borderRadius: 99, padding: '2px 8px' }}>pre-filled · read only</span>
            </div>
          </div>

          {/* Drop zone */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 7px' }}>Report PDF</p>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f.name) }}
              style={{ border: `2px dashed ${dragging ? BLUE : file ? '#10b981' : 'rgba(11,92,173,0.24)'}`, borderRadius: 13, padding: file ? '16px 24px' : '28px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(11,92,173,0.04)' : file ? 'rgba(16,185,129,0.04)' : '#fafcff', transition: 'all .22s', animation: 'labUploadPulse 3s ease-in-out infinite' }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0].name) }} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46', margin: 0 }}>{file}</p>
                    <p style={{ fontSize: 11, color: '#10b981', margin: 0 }}>Ready · click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(11,92,173,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 3px' }}>Drag &amp; drop the PDF here, or <span style={{ color: BLUE, textDecoration: 'underline' }}>browse</span></p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>PDF only · max 20 MB · AES-256 encrypted in transit</p>
                </>
              )}
            </div>
          </div>

          {/* Date + notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Test Date</p>
              <input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} style={{ ...inSt, height: 38, cursor: 'pointer' }} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Notes (optional)</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any relevant notes…" style={{ ...inSt, height: 68, resize: 'vertical', lineHeight: 1.6 }} onFocus={fi} onBlur={fo} />
            </div>
          </div>

          {/* Progress bar */}
          {step === 'uploading' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${BLUE},${TEAL})`, borderRadius: 99, transition: 'width .16s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '5px 0 0', textAlign: 'right' }}>{Math.round(pct)}%</p>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={startUpload} disabled={!file || step === 'uploading'}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: file && step !== 'uploading' ? `linear-gradient(135deg,${BLUE},${TEAL})` : '#e2e8f0', color: file && step !== 'uploading' ? 'white' : '#94a3b8', fontSize: 13, fontWeight: 800, cursor: file && step !== 'uploading' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: file && step !== 'uploading' ? '0 4px 16px rgba(11,92,173,0.30)' : 'none', transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { if (file && step !== 'uploading') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,92,173,0.40)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = file && step !== 'uploading' ? '0 4px 16px rgba(11,92,173,0.30)' : 'none' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {step === 'uploading' ? `Uploading… ${Math.round(pct)}%` : 'Secure Upload (AES-256)'}
            </button>
            <button onClick={() => setSelTest(null)} style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid rgba(11,92,173,0.20)', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.20)'; e.currentTarget.style.color = '#64748b' }}
            >Cancel</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>AES-256 · DGHS logged</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP: done */}
      {step === 'done' && selTest && (
        <div style={{ animation: 'expandIn .3s ease', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(16,185,129,0.06)', borderRadius: 14, border: '1.5px solid rgba(16,185,129,0.22)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#065f46', margin: '0 0 3px' }}>Uploaded &amp; encrypted · linked to {selTest.doctor}&apos;s prescription</p>
            <p style={{ fontSize: 12, color: '#047857', margin: 0 }}>{selTest.test} · AES-256 stored · Marked <strong>Verified</strong></p>
          </div>
          <button onClick={reset} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#10b981', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(16,185,129,0.28)', transition: 'all .15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >New Search</button>
        </div>
      )}
    </div>
  )
}

/* ── Lab My Uploads page ───────────────────────────────────────────── */
function LabMyUploadsPage() {
  const [mounted,  setMounted]  = useState(false)
  const [filter,   setFilter]   = useState<'all'|'verified'|'month'>('all')
  const [searchQ,  setSearchQ]  = useState('')
  const [uploads,  setUploads]  = useState(LAB_UPLOADS_INIT)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const filtered = uploads.filter(u => {
    if (filter === 'month' && !u.date.includes('Today') && !u.date.includes('Yesterday') && !u.date.includes('days')) return false
    if (searchQ && !u.test.toLowerCase().includes(searchQ.toLowerCase()) && !u.uhid.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const FILTERS: { id: 'all'|'verified'|'month'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'verified', label: 'Verified' },
    { id: 'month', label: 'This Month' },
  ]

  return (
    <div style={{ padding: '24px 32px 60px', boxSizing: 'border-box' as const }}>
      {/* Filter bar */}
      <div style={{ ...fc(0), display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' as const }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search reports…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 40, paddingRight: 14, height: 40, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.16)', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.16)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid', borderColor: filter === f.id ? BLUE : 'rgba(11,92,173,0.16)', background: filter === f.id ? 'rgba(11,92,173,0.08)' : 'white', color: filter === f.id ? BLUE : '#64748b', fontSize: 12, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            >{f.label}</button>
          ))}
        </div>
        <button style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.16)', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.16)'; e.currentTarget.style.color = '#64748b' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export list
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Uploads list */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 14px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.4fr 1.4fr 80px 100px', gap: 12, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid rgba(11,92,173,0.07)' }}>
          {['Test Name', 'Patient UHID', 'Prescribing Doctor', 'Upload Date', '', 'Status'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No uploads match your filter.</p>
          </div>
        ) : (
          filtered.map((u, i) => (
            <div key={u.id} style={{ ...fc(i * 50), display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.4fr 1.4fr 80px 100px', gap: 12, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(11,92,173,0.06)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafcff', transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafcff' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,163,163,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e' }}>{u.test}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '3px 9px', border: '1px solid rgba(11,92,173,0.14)', display: 'inline-block' }}>{u.uhid}</span>
              <span style={{ fontSize: 12, color: '#475569' }}>{u.doctor}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{u.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '4px 10px', border: '1px solid rgba(16,185,129,0.22)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                Verified
              </span>
            </div>
          ))
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>All reports encrypted · DGHS audit log maintained</span>
      </div>
    </div>
  )
}

/* ── Lab Profile page ─────────────────────────────────────────────── */
function LabProfilePage() {
  const [mounted,   setMounted]   = useState(false)
  const [editing,   setEditing]   = useState<string|null>(null)
  const [centerInfo, setCenterInfo] = useState({ name: 'PathCare Diagnostics', dghs: 'DGHS-LAB-2021-04471', address: '12/A Mirpur Road, Dhaka 1216', contact: 'Mr. Rafiq Hossain' })
  const [contact,   setContact]   = useState({ phone: '+880 1900-112233', email: 'pathcare@diagnostics.bd' })

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const inputSt = { padding: '8px 12px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.18)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s', width: '100%', boxSizing: 'border-box' as const }
  const fi = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }
  const fo = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(11,92,173,0.18)'; e.target.style.boxShadow = 'none' }

  const Card = ({ children, delay }: { children: ReactNode; delay: number }) => (
    <div style={{ ...fc(delay), background: 'white', borderRadius: 18, padding: '24px 26px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', marginBottom: 16, transition: 'transform .2s,box-shadow .2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,92,173,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
    >{children}</div>
  )

  const Row = ({ label, value, field, val, setter }: { label: string; value: string; field: string; val: string; setter: (v: string) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(11,92,173,0.06)', marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</span>
      {editing === field ? <input value={val} onChange={e => setter(e.target.value)} style={inputSt} onFocus={fi} onBlur={fo} />
        : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{value}</span>}
    </div>
  )

  return (
    <div style={{ padding: '24px 32px 60px', maxWidth: 760, boxSizing: 'border-box' as const }}>
      {/* Header */}
      <div style={{ ...fc(0), background: `linear-gradient(135deg,${BLUE},${TEAL})`, borderRadius: 22, padding: '32px 30px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', border: '3px solid rgba(255,255,255,0.40)' }}>PC</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${BLUE}`, cursor: 'pointer' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.4px' }}>PathCare Diagnostics</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.80)', margin: '0 0 10px' }}>Diagnostic Centre · Dhaka</p>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(255,255,255,0.90)', borderRadius: 99, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              DGHS Approved Lab · License DGHS-LAB-2021-04471
            </span>
          </div>
        </div>
      </div>

      {/* Center Information */}
      <Card delay={80}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Centre Information</h4>
          <button onClick={() => setEditing(e => e === 'center' ? null : 'center')}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: editing === 'center' ? `linear-gradient(135deg,${BLUE},${TEAL})` : 'rgba(11,92,173,0.08)', color: editing === 'center' ? 'white' : BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: editing === 'center' ? '0 3px 10px rgba(11,92,173,0.28)' : 'none', transition: 'all .15s' }}
          >{editing === 'center' ? 'Save' : 'Edit'}</button>
        </div>
        <Row label="Centre Name" value={centerInfo.name} field="center" val={centerInfo.name} setter={v => setCenterInfo(c => ({...c,name:v}))} />
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid rgba(11,92,173,0.06)', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>DGHS License</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{centerInfo.dghs}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '2px 9px', border: '1px solid rgba(16,185,129,0.22)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              Verified
            </span>
          </div>
        </div>
        <Row label="Address" value={centerInfo.address} field="center" val={centerInfo.address} setter={v => setCenterInfo(c => ({...c,address:v}))} />
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Contact Person</span>
          {editing === 'center' ? <input value={centerInfo.contact} onChange={e => setCenterInfo(c => ({...c,contact:e.target.value}))} style={inputSt} onFocus={fi} onBlur={fo} />
            : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{centerInfo.contact}</span>}
        </div>
      </Card>

      {/* Contact */}
      <Card delay={160}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Contact Information</h4>
          <button onClick={() => setEditing(e => e === 'contact' ? null : 'contact')}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: editing === 'contact' ? `linear-gradient(135deg,${BLUE},${TEAL})` : 'rgba(11,92,173,0.08)', color: editing === 'contact' ? 'white' : BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: editing === 'contact' ? '0 3px 10px rgba(11,92,173,0.28)' : 'none', transition: 'all .15s' }}
          >{editing === 'contact' ? 'Save' : 'Edit'}</button>
        </div>
        <Row label="Phone" value={contact.phone} field="contact" val={contact.phone} setter={v => setContact(c => ({...c,phone:v}))} />
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</span>
          {editing === 'contact' ? <input value={contact.email} onChange={e => setContact(c => ({...c,email:e.target.value}))} style={inputSt} onFocus={fi} onBlur={fo} />
            : <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{contact.email}</span>}
        </div>
      </Card>

      {/* Security */}
      <Card delay={240}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 18px' }}>Security</h4>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid rgba(11,92,173,0.07)', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>Password</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Last changed 2 months ago</p>
          </div>
          <button style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: 'rgba(11,92,173,0.08)', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.14)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.08)' }}
          >Change Password</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>Two-Factor Authentication</p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Required for all report uploads</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.09)', borderRadius: 99, padding: '4px 12px', border: '1px solid rgba(16,185,129,0.22)' }}>Enabled</span>
        </div>
      </Card>

      {/* Activity Summary */}
      <Card delay={320}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 18px' }}>Activity Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: 'Total Reports',    value: '1,284', color: BLUE,      bg: 'rgba(11,92,173,0.08)' },
            { label: "This Month",       value: '47',    color: TEAL,      bg: 'rgba(15,163,163,0.10)' },
            { label: 'Pending Tests',    value: LAB_PENDING.length.toString(), color: '#f59e0b', bg: 'rgba(245,158,11,0.09)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px', textAlign: 'center' as const }}>
              <p style={{ fontSize: 32, fontWeight: 900, color: s.color, margin: '0 0 4px', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(11,92,173,0.07)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>All reports AES-256 encrypted · DGHS audit log maintained</span>
        </div>
      </Card>
    </div>
  )
}

/* ── LabDashboard shell ───────────────────────────────────────────── */
function LabDashboard({ onLogout, onNavigateHome }: { onLogout: () => void; onNavigateHome: () => void }) {
  const [activeNav, setActiveNav] = useState<LabNav>('dash')
  const [mounted,   setMounted]   = useState(false)
  const [uploadCount, setUploadCount] = useState(2)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(18px)', transition: `opacity .44s ease ${d}ms,transform .44s ease ${d}ms` })

  const titleMap: Partial<Record<LabNav, string>> = { uploads: 'My Uploads', profile: 'Profile' }

  return (
    <LabShell activeNav={activeNav} onNav={setActiveNav} onLogout={onLogout} onNavigateHome={onNavigateHome} topTitle={titleMap[activeNav]}>

      {activeNav === 'uploads' && <LabMyUploadsPage />}
      {activeNav === 'profile' && <LabProfilePage />}

      {activeNav === 'dash' && (
        <div style={{ padding: '24px 28px 48px', flex: 1 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 22 }}>
            {[
              { delay: 0,   label: 'Uploaded Today',  value: uploadCount,  color: TEAL,      bg: 'rgba(15,163,163,0.12)', sub: 'Encrypted & verified',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
              { delay: 80,  label: 'Pending Tests',   value: LAB_PENDING.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', sub: 'Awaiting report upload', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { delay: 160, label: 'Total Reports',   value: 1284,         color: BLUE,      bg: 'rgba(11,92,173,0.10)',  sub: 'All time, encrypted',    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            ].map(stat => (
              <div key={stat.label} style={{ ...fc(stat.delay), background: 'white', borderRadius: 18, padding: '22px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', transition: 'transform .2s,box-shadow .2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(11,92,173,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 44, fontWeight: 900, color: stat.color, margin: 0, lineHeight: 1, letterSpacing: '-1px' }}>{stat.value.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: '#cbd5e1', margin: '10px 0 0' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Inline search + upload card */}
          <div style={fc(240)}>
            <LabSearchUploadCard onUploaded={() => setUploadCount(c => c + 1)} />
          </div>

          {/* Recent uploads */}
          <div style={{ ...fc(360), marginTop: 22 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: '0 0 13px' }}>Recent Uploads</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LAB_UPLOADS_INIT.slice(0, 4).map((u, i) => (
                <div key={u.id} style={{ ...fc(360 + i * 50), display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 14, border: '1px solid rgba(11,92,173,0.07)', boxShadow: '0 1px 8px rgba(11,92,173,0.06)', transition: 'transform .18s,box-shadow .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(11,92,173,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(11,92,173,0.06)' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,163,163,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e' }}>{u.test}</span>
                      <span style={{ fontSize: 10, color: BLUE, background: 'rgba(11,92,173,0.08)', borderRadius: 99, padding: '2px 7px', border: '1px solid rgba(11,92,173,0.12)', fontWeight: 700 }}>{u.uhid}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{u.date} · {u.size}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Verified</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 13 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>All reports AES-256 encrypted · DGHS certified · Audit logged</span>
            </div>
          </div>

        </div>
      )}
    </LabShell>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN SECTION
═══════════════════════════════════════════════════════════════════ */

type AdminNav = 'dashboard' | 'doctors' | 'labs' | 'users' | 'activity' | 'audit'

/* ── Admin mock data ─────────────────────────────────────────────── */
const ADMIN_PENDING_DOCTORS = [
  { id: 1, name: 'Dr. Mehedi Hasan',   bmdc: 'BMDC-A-54321', spec: 'Cardiology',     submitted: '2026-08-08', docs: 3, phone: '01712-345678', email: 'mehedi@example.com' },
  { id: 2, name: 'Dr. Nadia Islam',    bmdc: 'BMDC-A-67890', spec: 'Gynaecology',    submitted: '2026-08-07', docs: 2, phone: '01811-234567', email: 'nadia@example.com' },
  { id: 3, name: 'Dr. Kamal Uddin',   bmdc: 'BMDC-A-11223', spec: 'Neurology',      submitted: '2026-08-05', docs: 4, phone: '01911-456789', email: 'kamal@example.com' },
]
const ADMIN_VERIFIED_DOCTORS = [
  { id: 4, name: 'Dr. Ayesha Karim',  bmdc: 'BMDC-A-09821', spec: 'General Practice', submitted: '2026-07-20', docs: 3, phone: '01700-111222', email: 'ayesha@example.com' },
  { id: 5, name: 'Dr. Priya Sen',     bmdc: 'BMDC-A-88712', spec: 'Pathology',       submitted: '2026-07-14', docs: 2, phone: '01600-333444', email: 'priya@example.com' },
]
const ADMIN_PENDING_LABS = [
  { id: 1, name: 'MediScan Diagnostics', dghs: 'DGHS-LAB-78901', address: 'Mirpur-10, Dhaka', submitted: '2026-08-09', docs: 2, phone: '02-8812345', email: 'admin@mediscan.bd' },
  { id: 2, name: 'Central Lab BD',       dghs: 'DGHS-LAB-33412', address: 'Gulshan-2, Dhaka', submitted: '2026-08-06', docs: 3, phone: '02-9876543', email: 'info@centrallab.bd' },
]
const ADMIN_APPROVED_LABS = [
  { id: 3, name: 'PathCare Diagnostics', dghs: 'DGHS-LAB-12345', address: 'Dhanmondi-27, Dhaka', submitted: '2026-07-22', docs: 4, phone: '02-8801234', email: 'info@pathcare.bd' },
]
const ADMIN_USERS = [
  { id: 1,  name: 'Rahim Uddin',        role: 'Patient', email: 'rahim@example.com',  phone: '01711-001122', uhid: 'BD-2026-01234', status: 'Active',    joined: '2026-01-15' },
  { id: 2,  name: 'Fatema Begum',       role: 'Patient', email: 'fatema@example.com', phone: '01811-003344', uhid: 'BD-2026-05678', status: 'Active',    joined: '2026-02-20' },
  { id: 3,  name: 'Dr. Ayesha Karim',  role: 'Doctor',  email: 'ayesha@example.com', phone: '01700-111222', uhid: 'BMDC-A-09821', status: 'Active',    joined: '2026-03-05' },
  { id: 4,  name: 'PathCare Diagnostics', role: 'Lab',  email: 'info@pathcare.bd',   phone: '02-8801234',  uhid: 'DGHS-12345',  status: 'Active',    joined: '2026-04-11' },
  { id: 5,  name: 'Karim Hossain',      role: 'Patient', email: 'karim@example.com',  phone: '01911-445566', uhid: 'BD-2025-09821', status: 'Suspended', joined: '2025-11-30' },
  { id: 6,  name: 'Nusrat Jahan',       role: 'Patient', email: 'nusrat@example.com', phone: '01611-778899', uhid: 'BD-2025-07712', status: 'Active',    joined: '2025-10-08' },
  { id: 7,  name: 'Dr. Mehedi Hasan',  role: 'Doctor',  email: 'mehedi@example.com', phone: '01712-345678', uhid: 'BMDC-A-54321', status: 'Pending',   joined: '2026-08-08' },
  { id: 8,  name: 'Dr. Priya Sen',     role: 'Doctor',  email: 'priya@example.com',  phone: '01600-333444', uhid: 'BMDC-A-88712', status: 'Active',    joined: '2026-07-14' },
]
const ADMIN_AUDIT_LOG = [
  { id: 1,  actor: 'Dr. Ayesha Karim',  role: 'Doctor',  action: 'Viewed',   target: 'Rahim Uddin · BD-2026-01234',    ts: '2026-08-10 14:32:11', ip: '192.168.1.10' },
  { id: 2,  actor: 'Rahim Uddin',       role: 'Patient', action: 'Granted',  target: 'Dr. Ayesha Karim',               ts: '2026-08-10 14:30:58', ip: '10.0.0.42' },
  { id: 3,  actor: 'System Admin',      role: 'Admin',   action: 'Approved', target: 'PathCare Diagnostics (Lab)',      ts: '2026-08-10 11:05:22', ip: '172.16.0.1' },
  { id: 4,  actor: 'PathCare Lab',      role: 'Lab',     action: 'Uploaded', target: 'HbA1c · BD-2026-01234',          ts: '2026-08-10 10:47:03', ip: '192.168.2.5' },
  { id: 5,  actor: 'Fatema Begum',      role: 'Patient', action: 'Login',    target: 'Patient Portal',                 ts: '2026-08-10 09:21:44', ip: '10.0.0.88' },
  { id: 6,  actor: 'Dr. Priya Sen',     role: 'Doctor',  action: 'Revoked',  target: 'Karim Hossain session',          ts: '2026-08-09 17:55:30', ip: '192.168.1.22' },
  { id: 7,  actor: 'System Admin',      role: 'Admin',   action: 'Approved', target: 'Dr. Ayesha Karim (Doctor)',      ts: '2026-08-09 12:14:09', ip: '172.16.0.1' },
  { id: 8,  actor: 'Karim Hossain',     role: 'Patient', action: 'Login',    target: 'Patient Portal',                 ts: '2026-08-08 08:30:17', ip: '10.0.1.55' },
]
const ACTIVITY_WEEKLY = [12, 19, 28, 22, 35, 41, 38]
const ACTIVITY_REGS = [
  { week: 'Wk 1', patients: 42, doctors: 5, labs: 2 },
  { week: 'Wk 2', patients: 58, doctors: 8, labs: 3 },
  { week: 'Wk 3', patients: 71, doctors: 6, labs: 1 },
  { week: 'Wk 4', patients: 89, doctors: 11, labs: 4 },
]

/* ── Admin Login Page ────────────────────────────────────────────── */
function AdminLoginPage({ onSuccess, onNavigateHome }: { onSuccess: () => void; onNavigateHome: () => void }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [mounted,  setMounted]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number) => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(22px)', transition: `opacity .5s ease ${d}ms,transform .5s ease ${d}ms` })

  const handleSubmit = () => {
    if (!email || !password) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onSuccess() }, 900)
  }

  const inSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }

  return (
    <div style={{ minHeight: '100vh', background: NAVY, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: -160, left: -160, width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle,rgba(11,92,173,0.18) 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -100, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle,rgba(15,163,163,0.12) 0%,transparent 70%)`, pointerEvents: 'none' }} />

      {/* Back link */}
      <button onClick={onNavigateHome} style={{ position: 'absolute', top: 24, left: 28, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'color .15s' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.80)' }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
        Back to home
      </button>

      {/* Card */}
      <div style={{ ...fc(0), width: '100%', maxWidth: 420, padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>

          {/* Logo + title */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 8px 28px rgba(11,92,173,0.45)` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 4px', letterSpacing: '-0.3px' }}>HealthNexus BD</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(11,92,173,0.25)', borderRadius: 99, border: '1px solid rgba(11,92,173,0.40)', marginTop: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Admin Console</span>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 7px' }}>Admin Email</p>
              <input type="email" placeholder="admin@healthnexus.gov.bd" value={email} onChange={e => setEmail(e.target.value)}
                style={inSt}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 4px rgba(11,92,173,0.20)` }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 7px' }}>Password</p>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  style={{ ...inSt, paddingRight: 46 }}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 4px rgba(11,92,173,0.20)` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                <button onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: 4, transition: 'color .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.80)' }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
                >
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', background: 'rgba(245,158,11,0.09)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.22)', marginBottom: 22 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 12, color: 'rgba(251,191,36,0.85)' }}>Authorized personnel only · All sessions are recorded</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(11,92,173,0.45)', transition: 'all .18s', opacity: loading ? 0.7 : 1 }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(11,92,173,0.55)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(11,92,173,0.45)' }}
          >{loading ? 'Authenticating…' : 'Sign In to Admin Console'}</button>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.04em' }}>Secured · AES-256 · All actions are audited</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Admin Shell (dark navy sidebar) ─────────────────────────────── */
function AdminShell({ activeNav, onNav, onLogout, onNavigateHome, children }: {
  activeNav: AdminNav; onNav: (n: AdminNav) => void; onLogout: () => void; onNavigateHome: () => void; children: ReactNode
}) {
  const navItems: { id: AdminNav; label: string; icon: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'doctors',   label: 'Verify Doctors',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m9 12 2 2 4-4"/></svg> },
    { id: 'labs',      label: 'Verify Labs',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg> },
    { id: 'users',     label: 'Users',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'activity',  label: 'Activity',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'audit',     label: 'Audit Log',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  ]

  const pendingCount = ADMIN_PENDING_DOCTORS.length + ADMIN_PENDING_LABS.length

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter',system-ui,sans-serif", background: '#f1f5f9', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 240, background: NAVY, display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '4px 0 24px rgba(0,0,0,0.25)' }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={onNavigateHome}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(11,92,173,0.45)', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.2px', lineHeight: 1.2 }}>HealthNexus BD</p>
              <span style={{ fontSize: 9, fontWeight: 800, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>ADMIN</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: active ? 'rgba(11,92,173,0.28)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.52)', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 2, transition: 'all .15s', position: 'relative', boxShadow: active ? 'inset 3px 0 0 ' + BLUE : 'none' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.52)' } }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === 'doctors' && pendingCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: '#ef4444', borderRadius: 99, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{ADMIN_PENDING_DOCTORS.length}</span>
                )}
                {item.id === 'labs' && ADMIN_PENDING_LABS.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white', background: '#ef4444', borderRadius: 99, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{ADMIN_PENDING_LABS.length}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: 'white' }}>A</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>System Admin</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>admin@healthnexus.gov.bd</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', padding: '9px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; e.currentTarget.style.color = '#fca5a5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 60, background: 'white', borderBottom: '1px solid rgba(11,92,173,0.09)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0, boxShadow: '0 1px 8px rgba(11,92,173,0.06)' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0c1a2e', margin: 0, letterSpacing: '-0.2px' }}>
              {activeNav === 'dashboard' ? 'Admin Dashboard' : activeNav === 'doctors' ? 'Doctor Verification' : activeNav === 'labs' ? 'Lab Verification' : activeNav === 'users' ? 'User Management' : activeNav === 'activity' ? 'Platform Activity' : 'Audit Log'}
            </h2>
          </div>
          {/* Global search */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Search…" style={{ paddingLeft: 34, paddingRight: 14, height: 36, width: 220, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.14)', background: '#f8fafc', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.14)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          {/* Bell */}
          <button style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.12)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', position: 'relative', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.12)'; e.currentTarget.style.color = '#64748b' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />
          </button>
          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${BLUE},${TEAL})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0 }}>A</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Mini SVG chart helpers ─────────────────────────────────────── */
function MiniLineChart({ data, color, w = 220, h = 60 }: { data: number[]; color: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / (max - min + 1)) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  const area = `M0,${h} L${pts.split(' ').map(p => p).join(' L')} L${w},${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((v - min) / (max - min + 1)) * (h - 8) - 4
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="white" strokeWidth="2" />
      })}
    </svg>
  )
}

function MiniBarChart({ data, w = 280, h = 80 }: { data: typeof ACTIVITY_REGS; w?: number; h?: number }) {
  const max = Math.max(...data.map(d => d.patients + d.doctors + d.labs))
  const bw = (w / data.length) * 0.55
  const gap = w / data.length
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((d, i) => {
        const x = i * gap + (gap - bw) / 2
        const pctP = d.patients / max
        const pctD = d.doctors / max
        const pctL = d.labs / max
        const hp = pctP * (h - 20)
        const hd = pctD * (h - 20)
        const hl = pctL * (h - 20)
        const total = hp + hd + hl
        return (
          <g key={i}>
            <rect x={x} y={h - 16 - total} width={bw} height={hp} rx="2" fill={BLUE} />
            <rect x={x} y={h - 16 - total + hp} width={bw} height={hd} rx="2" fill={TEAL} />
            <rect x={x} y={h - 16 - total + hp + hd} width={bw} height={hl} rx="2" fill="#f59e0b" />
            <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">{d.week}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ slices, r = 44, sw = 16 }: { slices: { value: number; color: string; label: string }[]; r?: number; sw?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  let offset = 0
  const cx = r + sw, cy = r + sw
  const size = (r + sw) * 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const pct = s.value / total
        const startAngle = offset * 2 * Math.PI - Math.PI / 2
        const endAngle = (offset + pct) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle)
        const large = pct > 0.5 ? 1 : 0
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
        offset += pct
        return <path key={i} d={d} fill={s.color} opacity="0.88" />
      })}
      <circle cx={cx} cy={cy} r={r - sw} fill="white" />
    </svg>
  )
}

/* ── Admin Dashboard ─────────────────────────────────────────────── */
function AdminDashboard({ onLogout, onNavigateHome }: { onLogout: () => void; onNavigateHome: () => void }) {
  const [activeNav, setActiveNav] = useState<AdminNav>('dashboard')

  return (
    <AdminShell activeNav={activeNav} onNav={setActiveNav} onLogout={onLogout} onNavigateHome={onNavigateHome}>
      {activeNav === 'dashboard'  && <AdminDashHome  onNav={setActiveNav} />}
      {activeNav === 'doctors'    && <AdminVerifyDoctors />}
      {activeNav === 'labs'       && <AdminVerifyLabs />}
      {activeNav === 'users'      && <AdminUsers />}
      {activeNav === 'activity'   && <AdminActivity />}
      {activeNav === 'audit'      && <AdminAudit />}
    </AdminShell>
  )
}

/* ── Admin Dashboard home ────────────────────────────────────────── */
function AdminDashHome({ onNav }: { onNav: (n: AdminNav) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: `opacity .42s ease ${d}ms,transform .42s ease ${d}ms` })

  const pendingCount = ADMIN_PENDING_DOCTORS.length + ADMIN_PENDING_LABS.length

  const stats = [
    { label: 'Total Patients',    value: '12,480', trend: '+142 this week', color: BLUE,      bg: `rgba(11,92,173,0.09)`,  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'Verified Doctors',  value: '412',    trend: '+8 this week',   color: TEAL,      bg: `rgba(15,163,163,0.09)`, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m9 12 2 2 4-4"/></svg> },
    { label: 'Approved Labs',     value: '89',     trend: '+3 this month',  color: '#10b981', bg: 'rgba(16,185,129,0.09)', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg> },
    { label: 'Pending Verifications', value: String(pendingCount), trend: 'Needs review', color: pendingCount > 0 ? '#ef4444' : '#10b981', bg: pendingCount > 0 ? 'rgba(239,68,68,0.09)' : 'rgba(16,185,129,0.09)', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, alert: pendingCount > 0 },
  ]

  const donutSlices = [
    { value: 12480, color: BLUE,      label: 'Patients' },
    { value: 412,   color: TEAL,      label: 'Doctors'  },
    { value: 89,    color: '#f59e0b', label: 'Labs'     },
  ]

  const recentActivity = ADMIN_AUDIT_LOG.slice(0, 5)

  const actionColor: Record<string, string> = { Viewed: '#3b82f6', Granted: '#10b981', Revoked: '#ef4444', Login: '#94a3b8', Approved: '#10b981', Uploaded: TEAL }

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ ...fc(i * 60), background: 'white', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: s.alert ? '1.5px solid rgba(239,68,68,0.28)' : '1px solid rgba(11,92,173,0.07)', transition: 'transform .2s,box-shadow .2s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(11,92,173,0.13)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(11,92,173,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 36, fontWeight: 900, color: s.color, margin: '0 0 8px', lineHeight: 1, letterSpacing: '-1px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: s.alert ? '#ef4444' : '#94a3b8', margin: 0, fontWeight: s.alert ? 700 : 400 }}>{s.trend}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, marginBottom: 20 }}>
        {/* Line chart: platform activity */}
        <div style={{ ...fc(240), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Weekly Platform Activity</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Records created / week</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <MiniLineChart data={ACTIVITY_WEEKLY} color={BLUE} w={420} h={72} />
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
              <span key={d} style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600, flex: 1, textAlign: i === 0 ? 'left' : i === 6 ? 'right' : 'center' }}>{d}</span>
            ))}
          </div>
        </div>
        {/* Donut: users by role */}
        <div style={{ ...fc(300), background: 'white', borderRadius: 18, padding: '22px 20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 14px', alignSelf: 'flex-start' }}>Users by Role</h3>
          <DonutChart slices={donutSlices} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14, width: '100%' }}>
            {donutSlices.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#475569', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0c1a2e' }}>{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Pending verifications table */}
        <div style={fc(360)}>
          <div style={{ background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0c1a2e', margin: 0 }}>Pending Verifications</h3>
              <button onClick={() => onNav('doctors')} style={{ background: 'none', border: 'none', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }} onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
              >View all →</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'Type', 'License No.', 'Submitted', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADMIN_PENDING_DOCTORS.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(11,92,173,0.05)', transition: 'background .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,92,173,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '10px 10px' }}><span style={{ fontWeight: 600, color: '#0c1a2e' }}>{d.name}</span></td>
                    <td style={{ padding: '10px 10px' }}><span style={{ fontSize: 10, fontWeight: 700, color: BLUE, background: 'rgba(11,92,173,0.09)', borderRadius: 99, padding: '2px 9px' }}>Doctor</span></td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{d.bmdc}</td>
                    <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{d.submitted}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onNav('doctors')} style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#065f46', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.color = '#065f46' }}
                        >Approve</button>
                        <button onClick={() => onNav('doctors')} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.09)', color: '#991b1b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.09)'; e.currentTarget.style.color = '#991b1b' }}
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ADMIN_PENDING_LABS.map(l => (
                  <tr key={`l${l.id}`} style={{ borderBottom: '1px solid rgba(11,92,173,0.05)', transition: 'background .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,92,173,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '10px 10px' }}><span style={{ fontWeight: 600, color: '#0c1a2e' }}>{l.name}</span></td>
                    <td style={{ padding: '10px 10px' }}><span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: 'rgba(15,163,163,0.10)', borderRadius: 99, padding: '2px 9px' }}>Lab</span></td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{l.dghs}</td>
                    <td style={{ padding: '10px 10px', color: '#94a3b8' }}>{l.submitted}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onNav('labs')} style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#065f46', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.color = '#065f46' }}
                        >Approve</button>
                        <button onClick={() => onNav('labs')} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.09)', color: '#991b1b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.09)'; e.currentTarget.style.color = '#991b1b' }}
                        >Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity feed */}
        <div style={{ ...fc(420), background: 'white', borderRadius: 18, padding: '22px 20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 14px' }}>Recent System Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(11,92,173,0.06)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${actionColor[a.action] ?? '#94a3b8'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: actionColor[a.action] ?? '#94a3b8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0c1a2e', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.actor}</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}><span style={{ fontWeight: 700, color: actionColor[a.action] ?? '#94a3b8' }}>{a.action}</span> · {a.target}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{a.ts.split(' ')[1]}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav('audit')} style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', color: BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
          >View full audit log →</button>
        </div>
      </div>
    </div>
  )
}

/* ── Verify Doctors ──────────────────────────────────────────────── */
function AdminVerifyDoctors() {
  const [tab,      setTab]      = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [searchQ,  setSearchQ]  = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [doctors,  setDoctors]  = useState({ pending: ADMIN_PENDING_DOCTORS, verified: ADMIN_VERIFIED_DOCTORS, rejected: [] as typeof ADMIN_PENDING_DOCTORS })
  const [mounted,  setMounted]  = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .4s ease ${d}ms,transform .4s ease ${d}ms` })

  const rows = (tab === 'pending' ? doctors.pending : tab === 'verified' ? doctors.verified : doctors.rejected)
    .filter(d => d.name.toLowerCase().includes(searchQ.toLowerCase()) || d.bmdc.toLowerCase().includes(searchQ.toLowerCase()))

  const approve = (id: number) => {
    const doc = doctors.pending.find(d => d.id === id)!
    setDoctors(prev => ({ ...prev, pending: prev.pending.filter(d => d.id !== id), verified: [doc, ...prev.verified] }))
    setExpanded(null)
  }
  const reject = (id: number) => {
    const doc = doctors.pending.find(d => d.id === id)!
    setDoctors(prev => ({ ...prev, pending: prev.pending.filter(d => d.id !== id), rejected: [doc, ...prev.rejected] }))
    setRejectId(null); setRejectReason(''); setExpanded(null)
  }

  const statusColor = { pending: '#f59e0b', verified: '#10b981', rejected: '#ef4444' }

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      {/* Tabs + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        {(['pending','verified','rejected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: tab === t ? BLUE : 'white', color: tab === t ? 'white' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t ? '0 4px 14px rgba(11,92,173,0.28)' : '0 1px 4px rgba(11,92,173,0.08)', transition: 'all .15s', textTransform: 'capitalize' }}
            onMouseEnter={e => { if (tab !== t) e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { if (tab !== t) e.currentTarget.style.background = 'white' }}
          >
            {t} {t === 'pending' && doctors.pending.length > 0 && <span style={{ marginLeft: 4, fontSize: 10, background: '#ef4444', color: 'white', borderRadius: 99, padding: '1px 6px' }}>{doctors.pending.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search by name or BMDC…" value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 34, paddingRight: 14, height: 38, width: 240, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.14)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px', fontStyle: 'italic' }}>Approval grants the doctor verified clinical access.</p>

      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 14px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Doctor', 'BMDC Number', 'Specialization', 'Submitted', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <>
                <tr key={d.id} style={{ ...fc(i * 50), borderBottom: expanded === d.id ? 'none' : '1px solid rgba(11,92,173,0.06)', background: expanded === d.id ? 'rgba(11,92,173,0.03)' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  onMouseEnter={e => { if (expanded !== d.id) (e.currentTarget as HTMLElement).style.background = 'rgba(11,92,173,0.03)' }}
                  onMouseLeave={e => { if (expanded !== d.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,rgba(11,92,173,0.14),rgba(15,163,163,0.14))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: BLUE, flexShrink: 0 }}>{d.name.split(' ').pop()![0]}</div>
                      <span style={{ fontWeight: 700, color: '#0c1a2e' }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{d.bmdc}</td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{d.spec}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{d.submitted}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[tab], background: `${statusColor[tab]}18`, borderRadius: 99, padding: '3px 10px', border: `1px solid ${statusColor[tab]}30`, textTransform: 'capitalize' }}>{tab}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded === d.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </td>
                </tr>
                {expanded === d.id && (
                  <tr key={`exp-${d.id}`}>
                    <td colSpan={6} style={{ padding: '0 16px 16px', background: 'rgba(11,92,173,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '14px 0 0' }}>
                        {[
                          { label: 'BMDC Number',     value: d.bmdc },
                          { label: 'Specialization',  value: d.spec },
                          { label: 'Phone',           value: d.phone },
                          { label: 'Email',           value: d.email },
                          { label: 'Documents',       value: `${d.docs} files attached` },
                          { label: 'Submitted',       value: d.submitted },
                        ].map(f => (
                          <div key={f.label} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(11,92,173,0.08)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{f.label}</p>
                            <p style={{ fontSize: 13, color: '#0c1a2e', fontWeight: 600, margin: 0 }}>{f.value}</p>
                          </div>
                        ))}
                      </div>
                      {tab === 'pending' && (
                        rejectId === d.id ? (
                          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 6px' }}>Rejection Reason</p>
                              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection…" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1.5px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.04)', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', height: 72, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => reject(d.id)} disabled={!rejectReason.trim()} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: rejectReason.trim() ? '#ef4444' : '#e2e8f0', color: rejectReason.trim() ? 'white' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Confirm Reject</button>
                              <button onClick={() => setRejectId(null)} style={{ padding: '10px 16px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.18)', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                            <button onClick={() => approve(d.id)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.32)', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.42)' }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.32)' }}
                            >✓ Approve Doctor</button>
                            <button onClick={() => { setRejectId(d.id); setRejectReason('') }} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(239,68,68,0.28)', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                            >✗ Reject</button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Verify Labs ─────────────────────────────────────────────────── */
function AdminVerifyLabs() {
  const [tab,      setTab]      = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [searchQ,  setSearchQ]  = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [labs,     setLabs]     = useState({ pending: ADMIN_PENDING_LABS, approved: ADMIN_APPROVED_LABS, rejected: [] as typeof ADMIN_PENDING_LABS })
  const [mounted,  setMounted]  = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .4s ease ${d}ms,transform .4s ease ${d}ms` })

  const rows = (tab === 'pending' ? labs.pending : tab === 'approved' ? labs.approved : labs.rejected)
    .filter(l => l.name.toLowerCase().includes(searchQ.toLowerCase()) || l.dghs.toLowerCase().includes(searchQ.toLowerCase()))

  const approve = (id: number) => {
    const lab = labs.pending.find(l => l.id === id)!
    setLabs(prev => ({ ...prev, pending: prev.pending.filter(l => l.id !== id), approved: [lab, ...prev.approved] }))
    setExpanded(null)
  }
  const reject = (id: number) => {
    const lab = labs.pending.find(l => l.id === id)!
    setLabs(prev => ({ ...prev, pending: prev.pending.filter(l => l.id !== id), rejected: [lab, ...prev.rejected] }))
    setRejectId(null); setRejectReason(''); setExpanded(null)
  }

  const statusColor = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        {(['pending','approved','rejected'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: tab === t ? TEAL : 'white', color: tab === t ? 'white' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: tab === t ? '0 4px 14px rgba(15,163,163,0.30)' : '0 1px 4px rgba(11,92,173,0.08)', transition: 'all .15s', textTransform: 'capitalize' }}
            onMouseEnter={e => { if (tab !== t) e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { if (tab !== t) e.currentTarget.style.background = 'white' }}
          >
            {t} {t === 'pending' && labs.pending.length > 0 && <span style={{ marginLeft: 4, fontSize: 10, background: '#ef4444', color: 'white', borderRadius: 99, padding: '1px 6px' }}>{labs.pending.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search by name or DGHS…" value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ paddingLeft: 34, paddingRight: 14, height: 38, width: 240, borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = TEAL; e.target.style.boxShadow = '0 0 0 3px rgba(15,163,163,0.10)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.14)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 14px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Lab / Center', 'DGHS License', 'Address', 'Submitted', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <>
                <tr key={l.id} style={{ ...fc(i * 50), borderBottom: expanded === l.id ? 'none' : '1px solid rgba(11,92,173,0.06)', background: expanded === l.id ? 'rgba(15,163,163,0.03)' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                  onMouseEnter={e => { if (expanded !== l.id) (e.currentTarget as HTMLElement).style.background = 'rgba(15,163,163,0.03)' }}
                  onMouseLeave={e => { if (expanded !== l.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(15,163,163,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: TEAL, flexShrink: 0 }}>{l.name[0]}</div>
                      <span style={{ fontWeight: 700, color: '#0c1a2e' }}>{l.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{l.dghs}</td>
                  <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{l.address}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{l.submitted}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[tab], background: `${statusColor[tab]}18`, borderRadius: 99, padding: '3px 10px', border: `1px solid ${statusColor[tab]}30`, textTransform: 'capitalize' }}>{tab}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded === l.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </td>
                </tr>
                {expanded === l.id && (
                  <tr key={`exp-${l.id}`}>
                    <td colSpan={6} style={{ padding: '0 16px 16px', background: 'rgba(15,163,163,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '14px 0 0' }}>
                        {[
                          { label: 'DGHS License',  value: l.dghs },
                          { label: 'Address',        value: l.address },
                          { label: 'Phone',          value: l.phone },
                          { label: 'Email',          value: l.email },
                          { label: 'Documents',      value: `${l.docs} files attached` },
                          { label: 'Submitted',      value: l.submitted },
                        ].map(f => (
                          <div key={f.label} style={{ background: 'white', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(15,163,163,0.12)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{f.label}</p>
                            <p style={{ fontSize: 13, color: '#0c1a2e', fontWeight: 600, margin: 0 }}>{f.value}</p>
                          </div>
                        ))}
                      </div>
                      {tab === 'pending' && (
                        rejectId === l.id ? (
                          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 6px' }}>Rejection Reason</p>
                              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection…" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1.5px solid rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.04)', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', height: 72, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button onClick={() => reject(l.id)} disabled={!rejectReason.trim()} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: rejectReason.trim() ? '#ef4444' : '#e2e8f0', color: rejectReason.trim() ? 'white' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Confirm Reject</button>
                              <button onClick={() => setRejectId(null)} style={{ padding: '10px 16px', borderRadius: 9, border: '1.5px solid rgba(11,92,173,0.18)', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                            <button onClick={() => approve(l.id)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.32)', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.42)' }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.32)' }}
                            >✓ Approve Lab</button>
                            <button onClick={() => { setRejectId(l.id); setRejectReason('') }} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(239,68,68,0.28)', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                            >✗ Reject</button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Users ───────────────────────────────────────────────────────── */
function AdminUsers() {
  const [searchQ,     setSearchQ]     = useState('')
  const [roleFilter,  setRoleFilter]  = useState<'All' | 'Patient' | 'Doctor' | 'Lab'>('All')
  const [statusFilter,setStatusFilter]= useState<'All' | 'Active' | 'Pending' | 'Suspended'>('All')
  const [users,       setUsers]       = useState(ADMIN_USERS)
  const [mounted,     setMounted]     = useState(false)
  const [page,        setPage]        = useState(1)
  const [confirmId,   setConfirmId]   = useState<number | null>(null)
  const PER_PAGE = 6

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .4s ease ${d}ms,transform .4s ease ${d}ms` })

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false
    if (statusFilter !== 'All' && u.status !== statusFilter) return false
    if (searchQ && !u.name.toLowerCase().includes(searchQ.toLowerCase()) && !u.email.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pages = Math.ceil(filtered.length / PER_PAGE)

  const toggleSuspend = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'Suspended' ? 'Active' : 'Suspended' } : u))
    setConfirmId(null)
  }

  const roleColor: Record<string, string> = { Patient: BLUE, Doctor: TEAL, Lab: '#f59e0b' }
  const statusColor: Record<string, string> = { Active: '#10b981', Pending: '#f59e0b', Suspended: '#ef4444' }

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search by name or email…" value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1) }} style={{ paddingLeft: 34, paddingRight: 14, height: 38, width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s,box-shadow .15s' }}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(11,92,173,0.08)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(11,92,173,0.14)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, alignSelf: 'center' }}>Role:</span>
          {(['All','Patient','Doctor','Lab'] as const).map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: roleFilter === r ? BLUE : 'white', color: roleFilter === r ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(11,92,173,0.08)', transition: 'all .15s' }}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, alignSelf: 'center' }}>Status:</span>
          {(['All','Active','Pending','Suspended'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: statusFilter === s ? '#0c1a2e' : 'white', color: statusFilter === s ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(11,92,173,0.08)', transition: 'all .15s' }}>{s}</button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>Showing {paged.length} of {filtered.length} users</p>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 14px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.07)', overflow: 'hidden', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['User', 'Role', 'Email', 'Phone', 'ID / UHID', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((u, i) => (
              <tr key={u.id} style={{ ...fc(i * 40), borderBottom: '1px solid rgba(11,92,173,0.05)', transition: 'background .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,92,173,0.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${roleColor[u.role]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: roleColor[u.role], flexShrink: 0 }}>{u.name[0]}</div>
                    <span style={{ fontWeight: 700, color: '#0c1a2e' }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: roleColor[u.role], background: `${roleColor[u.role]}18`, borderRadius: 99, padding: '2px 9px', border: `1px solid ${roleColor[u.role]}28` }}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>{u.phone}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{u.uhid}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[u.status], background: `${statusColor[u.status]}18`, borderRadius: 99, padding: '2px 9px', border: `1px solid ${statusColor[u.status]}28` }}>{u.status}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 12 }}>{u.joined}</td>
                <td style={{ padding: '12px 14px' }}>
                  {confirmId === u.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => toggleSuspend(u.id)} style={{ padding: '4px 12px', borderRadius: 7, border: 'none', background: u.status === 'Suspended' ? '#10b981' : '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
                      <button onClick={() => setConfirmId(null)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(11,92,173,0.16)', background: 'white', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(u.id)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: u.status === 'Suspended' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.09)', color: u.status === 'Suspended' ? '#065f46' : '#991b1b', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >{u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: page === p ? BLUE : 'white', color: page === p ? 'white' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(11,92,173,0.08)', transition: 'all .15s' }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Activity ────────────────────────────────────────────────────── */
function AdminActivity() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .42s ease ${d}ms,transform .42s ease ${d}ms` })

  const donutSlices = [
    { value: 12480, color: BLUE,      label: 'Patients' },
    { value: 412,   color: TEAL,      label: 'Doctors'  },
    { value: 89,    color: '#f59e0b', label: 'Labs'     },
  ]

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 18, marginBottom: 22 }}>
        {/* Registrations line chart */}
        <div style={{ ...fc(0), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Weekly Activity</h3>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Records created per week</p>
          <MiniLineChart data={ACTIVITY_WEEKLY} color={BLUE} w={200} h={72} />
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
              <span key={d} style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 600, flex:1, textAlign: i===0?'left':i===6?'right':'center' }}>{d}</span>
            ))}
          </div>
        </div>
        {/* Registrations stacked bar */}
        <div style={{ ...fc(80), background: 'white', borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 4px' }}>Registrations per Week</h3>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>By role type</p>
          <MiniBarChart data={ACTIVITY_REGS} w={220} h={90} />
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[{c:BLUE,l:'Patients'},{c:TEAL,l:'Doctors'},{c:'#f59e0b',l:'Labs'}].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Donut */}
        <div style={{ ...fc(160), background: 'white', borderRadius: 18, padding: '22px 20px', boxShadow: '0 2px 12px rgba(11,92,173,0.08)', border: '1px solid rgba(11,92,173,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0c1a2e', margin: '0 0 12px', alignSelf: 'flex-start' }}>Users by Role</h3>
          <DonutChart slices={donutSlices} r={38} sw={14} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, width: '100%' }}>
            {donutSlices.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#475569', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0c1a2e' }}>{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit log preview — link to full audit */}
      <AdminAuditTable fc={fc} showExport={false} />
    </div>
  )
}

/* ── Audit Log table (shared) ────────────────────────────────────── */
function AdminAuditTable({ fc, showExport }: { fc: (d: number) => React.CSSProperties; showExport: boolean }) {
  const [roleF,   setRoleF]   = useState<string>('All')
  const [actionF, setActionF] = useState<string>('All')
  const [dateF,   setDateF]   = useState('')

  const actionColor: Record<string, string> = { Viewed: '#3b82f6', Granted: '#10b981', Revoked: '#ef4444', Login: '#94a3b8', Approved: '#10b981', Uploaded: TEAL }

  const rows = ADMIN_AUDIT_LOG.filter(r => {
    if (roleF !== 'All' && r.role !== roleF) return false
    if (actionF !== 'All' && r.action !== actionF) return false
    if (dateF && !r.ts.startsWith(dateF)) return false
    return true
  })

  return (
    <div style={fc(240)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Immutable · Tamper-proof</span>
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Filters:</span>
        {/* Role filter */}
        <select value={roleF} onChange={e => setRoleF(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          {['All','Patient','Doctor','Lab','Admin'].map(r => <option key={r}>{r}</option>)}
        </select>
        {/* Action filter */}
        <select value={actionF} onChange={e => setActionF(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          {['All','Viewed','Granted','Revoked','Login','Approved','Uploaded'].map(a => <option key={a}>{a}</option>)}
        </select>
        {/* Date filter */}
        <input type="date" value={dateF} onChange={e => setDateF(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid rgba(11,92,173,0.14)', background: 'white', fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
        <div style={{ flex: 1 }} />
        {showExport && (
          <button style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg,${BLUE},${TEAL})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(11,92,173,0.28)', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(11,92,173,0.36)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(11,92,173,0.28)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        )}
      </div>
      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 2px 14px rgba(11,92,173,0.09)', border: '1px solid rgba(11,92,173,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Actor', 'Role', 'Action', 'Target', 'Timestamp', 'IP Address'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ ...fc(i * 40), borderBottom: '1px solid rgba(11,92,173,0.05)', transition: 'background .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(11,92,173,0.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0c1a2e' }}>{r.actor}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.role === 'Admin' ? '#8b5cf6' : r.role === 'Doctor' ? TEAL : r.role === 'Lab' ? '#f59e0b' : BLUE, background: r.role === 'Admin' ? 'rgba(139,92,246,0.10)' : r.role === 'Doctor' ? 'rgba(15,163,163,0.10)' : r.role === 'Lab' ? 'rgba(245,158,11,0.10)' : 'rgba(11,92,173,0.09)', borderRadius: 99, padding: '2px 9px' }}>{r.role}</span>
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: actionColor[r.action] ?? '#94a3b8', background: `${actionColor[r.action] ?? '#94a3b8'}18`, borderRadius: 99, padding: '2px 10px' }}>{r.action}</span>
                </td>
                <td style={{ padding: '11px 14px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.target}</td>
                <td style={{ padding: '11px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{r.ts}</td>
                <td style={{ padding: '11px 14px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{r.ip}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No log entries match the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Audit page ──────────────────────────────────────────────────── */
function AdminAudit() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  const fc = (d: number): React.CSSProperties => ({ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(14px)', transition: `opacity .42s ease ${d}ms,transform .42s ease ${d}ms` })

  return (
    <div style={{ padding: '24px 28px 48px' }}>
      <AdminAuditTable fc={fc} showExport={true} />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<'home' | 'auth' | 'dashboard' | 'doctor-dashboard' | 'lab-dashboard' | 'admin-login' | 'admin-dashboard'>('home')
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [mobileOpen, setMobileOpen] = useState(false)
  const navLinks = ['Home', 'Features', 'How it works', 'About']

  if (page === 'auth') {
    return <AuthPage defaultTab={authTab} onNavigateHome={() => setPage('home')} onSuccess={(r) => {
      if (r === 'Doctor') setPage('doctor-dashboard')
      else if (r === 'Lab') setPage('lab-dashboard')
      else setPage('dashboard')
    }} />
  }

  if (page === 'dashboard') {
    return <PatientDashboard onLogout={() => { setAuthTab('login'); setPage('auth') }} onNavigateHome={() => setPage('home')} />
  }

  if (page === 'doctor-dashboard') {
    return <DoctorDashboard onLogout={() => { setAuthTab('login'); setPage('auth') }} onNavigateHome={() => setPage('home')} />
  }

  if (page === 'lab-dashboard') {
    return <LabDashboard onLogout={() => { setAuthTab('login'); setPage('auth') }} onNavigateHome={() => setPage('home')} />
  }

  if (page === 'admin-login') {
    return <AdminLoginPage onSuccess={() => setPage('admin-dashboard')} onNavigateHome={() => setPage('home')} />
  }

  if (page === 'admin-dashboard') {
    return <AdminDashboard onLogout={() => setPage('admin-login')} onNavigateHome={() => setPage('home')} />
  }

  function openAuth(tab: AuthTab) {
    setAuthTab(tab)
    setPage('auth')
    setMobileOpen(false)
  }

  const trust = [
    { icon: <ShieldIcon />, label: 'AES-256 Encrypted', sub: 'Military-grade data security' },
    { icon: <FingerprintIcon />, label: 'OTP Consent Access', sub: 'You approve every access' },
    { icon: <SparkleIcon />, label: 'AI-Powered Insights', sub: 'Gemini clinical summaries' },
    { icon: <AuditIcon />, label: 'Immutable Audit Log', sub: 'Tamper-proof access history' },
  ]

  const features = [
    {
      illus: <UHIDIllustration />,
      title: 'Unified Health ID',
      desc: 'One lifelong identifier links your complete medical history across every hospital, clinic, and lab in Bangladesh.',
      tag: 'Identity',
      tagColor: BLUE,
    },
    {
      illus: <OTPIllustration />,
      title: 'OTP Consent Access',
      desc: 'Authorize any doctor with a one-time PIN. Access auto-expires. Every session is permanently logged.',
      tag: 'Privacy',
      tagColor: TEAL,
    },
    {
      illus: <AIIllustration />,
      title: 'AI Clinical Summary',
      desc: 'Gemini synthesizes your records into concise briefs, surfacing drug interactions, allergies, and critical flags.',
      tag: 'AI',
      tagColor: TEAL,
    },
    {
      illus: <AuditIllustration />,
      title: 'Immutable Audit Log',
      desc: 'Every record view, update, and consent event is cryptographically logged and tamper-proof.',
      tag: 'Trust',
      tagColor: BLUE,
    },
  ]

  const steps = [
    { img: STEP1_IMG, num: '01', title: 'Register & get your UHID', desc: 'Sign up with your NID or birth certificate. Receive your Unified Health ID instantly — your lifelong health identifier.', alt: 'Smiling female doctor with laptop — registration step' },
    { img: STEP2_IMG, num: '02', title: 'Visit any doctor', desc: 'Walk into any BMDC-verified clinic or hospital. Your complete history is ready to share — safely and digitally.', alt: 'Doctor examining child with mother present — clinic visit' },
    { img: STEP3_IMG, num: '03', title: 'Approve with one OTP', desc: 'When a doctor requests your records, approve with a one-time PIN. Revoke access anytime. You stay in control.', alt: 'Doctor consulting with elderly patient and family — OTP consent' },
  ]

  const stats = [
    { val: '64', label: 'Districts Covered' },
    { val: '12,000+', label: 'BMDC-Verified Doctors' },
    { val: '170M', label: 'Citizens Eligible' },
    { val: '99.9%', label: 'Uptime SLA' },
  ]

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#ffffff', color: '#1e293b', overflowX: 'hidden' }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(11,92,173,0.09)',
        boxShadow: '0 1px 16px rgba(11,92,173,0.07)',
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="#" onClick={e => { e.preventDefault(); setPage('home') }} style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ background: BLUE, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(11,92,173,0.28)' }}>
              <Logo />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: BLUE, letterSpacing: '-0.3px' }}>HealthNexus <span style={{ color: TEAL }}>BD</span></span>
          </a>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = BLUE)}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }} className="desktop-nav">
            <button onClick={() => openAuth('login')} style={{ fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 10, border: `1.5px solid ${BLUE}`, color: BLUE, background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >Login</button>
            <button onClick={() => openAuth('register')} style={{ fontSize: 14, fontWeight: 600, padding: '9px 22px', borderRadius: 10, border: 'none', color: 'white', background: BLUE, cursor: 'pointer', boxShadow: '0 3px 14px rgba(11,92,173,0.30)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0a4f99'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,92,173,0.38)' }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.boxShadow = '0 3px 14px rgba(11,92,173,0.30)' }}
            >Register Free</button>
          </div>

          {/* Hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2">
              {mobileOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}
            </svg>
          </button>
        </div>

        <div className="mobile-drawer" style={{
          background: 'white',
          borderTop: '1px solid rgba(11,92,173,0.08)',
          padding: mobileOpen ? '16px 20px 22px' : '0 20px',
          maxHeight: mobileOpen ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), padding 0.28s ease',
        }}>
          {navLinks.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileOpen(false)}
              style={{ display: 'block', padding: '11px 4px', fontSize: 15, fontWeight: 500, color: '#334155', textDecoration: 'none', borderBottom: '1px solid rgba(11,92,173,0.06)', transition: 'color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BLUE }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#334155' }}
            >{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => openAuth('login')} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1.5px solid ${BLUE}`, color: BLUE, background: 'transparent', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(11,92,173,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >Login</button>
            <button onClick={() => openAuth('register')} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', color: 'white', background: BLUE, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, boxShadow: '0 3px 12px rgba(11,92,173,0.28)', transition: 'background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0a4f99' }}
              onMouseLeave={e => { e.currentTarget.style.background = BLUE }}
            >Register Free</button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section id="home" style={{ position: 'relative', overflow: 'hidden', background: '#ffffff', minHeight: 620 }}>
        <HeroBgTexture />

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center', minHeight: 620 }}>
          {/* Left copy */}
          <div style={{ padding: '72px 0 60px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(15,163,163,0.10)', border: '1px solid rgba(15,163,163,0.28)', borderRadius: 999, padding: '5px 14px', marginBottom: 24 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: TEAL, display: 'inline-block', boxShadow: `0 0 0 3px rgba(15,163,163,0.25)` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bangladesh National Health Platform</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.1rem)', fontWeight: 900, color: '#0c1a2e', lineHeight: 1.13, letterSpacing: '-0.6px', margin: '0 0 20px' }}>
              One Lifelong<br />
              <span style={{ color: BLUE }}>Health ID</span><br />
              for Every Citizen
            </h1>

            <p style={{ fontSize: 16, color: '#4a6380', lineHeight: 1.75, maxWidth: 440, margin: '0 0 36px', wordBreak: 'break-word' }}>
              HealthNexus BD unifies your entire medical history under one secure identifier. Own your records, authorize doctors with an OTP, and get AI-powered clinical summaries — all encrypted end-to-end.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
              <button onClick={() => openAuth('register')} style={{ fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 12, border: 'none', color: 'white', background: BLUE, cursor: 'pointer', boxShadow: '0 4px 22px rgba(11,92,173,0.34)', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(11,92,173,0.40)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 22px rgba(11,92,173,0.34)' }}
              >Get Started — Free</button>
              <button style={{ fontSize: 15, fontWeight: 600, padding: '13px 28px', borderRadius: 12, border: '1.5px solid rgba(11,92,173,0.28)', color: BLUE, background: 'white', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = '0 4px 14px rgba(11,92,173,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(11,92,173,0.28)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={BLUE} strokeWidth="1.8"/><polygon points="10 8 16 12 10 16 10 8" fill={BLUE}/></svg>
                Learn More
              </button>
            </div>

            {/* social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex' }}>
                {[BLUE, TEAL, '#2563eb', '#0891b2', '#059669'].map((c, i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, ${c}bb)`, border: '2.5px solid white', marginLeft: i ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="white" opacity=".85"/><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="white" opacity=".85"/></svg>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>50,000+ citizens enrolled</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>across all 64 districts of Bangladesh</p>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingTop: 40, paddingBottom: 0, zIndex: 1 }}>
            {/* soft glow behind image */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(15,163,163,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 72px rgba(11,92,173,0.22), 0 4px 20px rgba(11,92,173,0.10)', maxWidth: 460, width: '100%' }}>
              <img
                src={HERO_IMG}
                alt="Doctor and patient reviewing health records on a tablet in a hospital"
                style={{ width: '100%', height: 480, objectFit: 'cover', objectPosition: 'center top', display: 'block', background: '#c7d8ed' }}
              />
              {/* overlay gradient at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, rgba(11,92,173,0.65), transparent)' }} />

              {/* floating UHID chip */}
              <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'white', borderRadius: 14, padding: '10px 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: BLUE, borderRadius: 9, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 9h6M14 12h5"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Verified UHID</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: BLUE, margin: 0, fontVariantNumeric: 'tabular-nums' }}>BD-2025-081492</p>
                </div>
              </div>

              {/* floating consent chip */}
              <div style={{ position: 'absolute', top: 20, right: 20, background: 'white', borderRadius: 14, padding: '9px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: '#e8f7f7', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 600 }}>Access Granted</p>
                  <p style={{ fontSize: 11, color: TEAL, fontWeight: 700, margin: 0 }}>via OTP Consent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST BADGES ════════════════════════════════════════ */}
      <section style={{ background: 'white', borderTop: '1px solid rgba(11,92,173,0.08)', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>
        <div className="trust-grid" style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {trust.map((b, i) => (
            <div key={i} className="trust-item" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '24px 20px',
              borderRight: i < trust.length - 1 ? '1px solid rgba(11,92,173,0.08)' : 'none',
              transition: 'background 0.15s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7faff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ background: 'rgba(15,163,163,0.09)', borderRadius: 12, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {b.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0c1a2e', margin: '0 0 2px', wordBreak: 'break-word' }}>{b.label}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <GalleryCarousel />

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <section id="features" style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Core Platform</p>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', letterSpacing: '-0.4px' }}>
            Everything your health record needs
          </h2>
          <p style={{ fontSize: 16, color: '#4a6380', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Designed for Bangladesh — accessible to patients, verified doctors, accredited labs, and administrators nationwide.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 22 }}>
          {features.map((f, i) => (
            <div key={i}
              style={{ background: 'white', borderRadius: 18, padding: '30px 28px', border: '1px solid rgba(11,92,173,0.09)', boxShadow: '0 2px 16px rgba(11,92,173,0.07)', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(11,92,173,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(11,92,173,0.07)' }}
            >
              <div style={{ marginBottom: 20 }}>{f.illus}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0c1a2e', margin: 0 }}>{f.title}</h3>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: f.tagColor === TEAL ? 'rgba(15,163,163,0.12)' : 'rgba(11,92,173,0.09)', color: f.tagColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.tag}</span>
              </div>
              <p style={{ fontSize: 14, color: '#4a6380', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: 'white', borderTop: '1px solid rgba(11,92,173,0.08)', borderBottom: '1px solid rgba(11,92,173,0.08)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '96px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Simple Process</p>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', fontWeight: 800, color: '#0c1a2e', margin: '0 0 16px', letterSpacing: '-0.4px' }}>
              How HealthNexus BD works
            </h2>
            <p style={{ fontSize: 16, color: '#4a6380', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
              Three steps to a secure, lifetime health record — no paperwork, no waiting.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, position: 'relative' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ background: 'white', borderRadius: 18, border: '1px solid rgba(11,92,173,0.09)', overflow: 'hidden', boxShadow: '0 2px 16px rgba(11,92,173,0.07)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(11,92,173,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(11,92,173,0.07)'; e.currentTarget.style.transform = 'none' }}
                >
                  {/* Photo */}
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#c7d8ed' }}>
                    <img src={s.img} alt={s.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                    {/* step badge */}
                    <div style={{ position: 'absolute', top: 14, left: 14, width: 34, height: 34, borderRadius: '50%', background: BLUE, color: 'white', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 12px rgba(11,92,173,0.35)' }}>{i + 1}</div>
                    {/* faint gradient at bottom of photo */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)' }} />
                  </div>

                  {/* Text */}
                  <div style={{ padding: '20px 24px 26px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Step {s.num}</p>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0c1a2e', margin: '0 0 10px' }}>{s.title}</h3>
                    <p style={{ fontSize: 14, color: '#4a6380', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>

                {/* connector arrow between steps */}
                {i < steps.length - 1 && (
                  <div className="step-arrow" style={{ position: 'absolute', top: '40%', right: -20, transform: 'translateY(-50%)', zIndex: 2 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" fill="white" stroke="rgba(11,92,173,0.18)" strokeWidth="1" />
                      <path d="M9 12h6M12 9l3 3-3 3" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div style={{ marginTop: 64, borderRadius: 22, padding: '52px 40px', background: `linear-gradient(130deg, ${BLUE} 0%, #0d6ec7 45%, ${TEAL} 100%)`, boxShadow: '0 16px 48px rgba(11,92,173,0.28)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800, color: 'white', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
              Ready to own your health data?
            </h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.7 }}>
              Join 50,000+ Bangladeshi citizens who have already secured their lifelong health record. Free for all patients, forever.
            </p>
            <button onClick={() => openAuth('register')} style={{ fontSize: 15, fontWeight: 700, padding: '13px 32px', borderRadius: 12, border: 'none', color: BLUE, background: 'white', cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,0.18)', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.18)' }}
            >Create Your Free Health ID</button>
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ═════════════════════════════════════════ */}
      <section id="about" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #0d6ec7 60%, ${TEAL} 100%)` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0, alignItems: 'center' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '20px 16px', borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
              <p style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{s.val}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
          {/* live status */}
          <div style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 99, padding: '8px 18px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.30)', display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>All systems operational</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', margin: '8px 0 0', fontWeight: 500 }}>Secure by design · DGHS Certified</p>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={{ background: NAVY }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 24px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48 }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <div style={{ background: BLUE, borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Logo />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>HealthNexus <span style={{ color: TEAL }}>BD</span></span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 1.7, maxWidth: 220, margin: '0 0 20px' }}>
              Bangladesh's unified digital health record platform — secure, AI-powered, and citizen-first.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                <path key="fb" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
                <><path key="tw1" d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></>,
                <><rect key="li1" x="2" y="9" width="4" height="12"/><circle key="li2" cx="4" cy="4" r="2"/><path key="li3" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/></>,
              ].map((icon, i) => (
                <a key={i} href="#" style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = TEAL }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            { heading: 'Platform', links: ['Features', 'How It Works', 'For Doctors', 'For Labs', 'For Admins', 'API Docs'] },
            { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Data Policy', 'BMDC Compliance', 'DGDA Guidelines'] },
            { heading: 'Contact', links: ['support@healthnexus.gov.bd', 'DGHS, Mohakhali, Dhaka-1212', '+880-2-9891068', 'Open Mon–Fri, 9am–5pm'] },
          ].map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 18px' }}>{col.heading}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = TEAL }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
                    >{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', maxWidth: 1120, margin: '0 auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            © 2025 HealthNexus BD · Government of the People's Republic of Bangladesh · Ministry of Health & Family Welfare
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>All systems operational</span>
            </div>
            <button onClick={() => setPage('admin-login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: 0, transition: 'color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.18)' }}
            >Admin</button>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 1024px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
        @media (max-width: 768px) {
          .step-arrow { display: none !important; }
          /* Trust badges: 1 column on mobile */
          .trust-grid { grid-template-columns: 1fr !important; }
          .trust-item { border-right: none !important; border-bottom: 1px solid rgba(11,92,173,0.08); }
          /* No horizontal scroll anywhere */
          body { overflow-x: hidden; }
          /* Hero section safe padding */
          section { box-sizing: border-box; }
        }
      `}</style>
    </div>
  )
}
