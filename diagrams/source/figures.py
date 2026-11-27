"""Block diagram, deployment architecture and Gantt chart for the HealthNexus BD report -> SVG."""
import html, sys
from datetime import date
from pathlib import Path

OUT = Path(sys.argv[1])
FONT = 'Helvetica, Arial, sans-serif'


def T(x, y, s, size=14, weight='normal', anchor='middle', color='#111', italic=False):
    lines = s.split('\n')
    lh = size * 1.22
    y0 = y - (len(lines) - 1) * lh / 2
    st = 'font-style:italic;' if italic else ''
    return ''.join(f'<text x="{x:.1f}" y="{y0 + i * lh:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
                   f'fill="{color}" text-anchor="{anchor}" dominant-baseline="central" style="{st}">{html.escape(l)}</text>'
                   for i, l in enumerate(lines))


def head(W, H, title):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
            '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
            '<path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker></defs>',
            f'<rect width="{W}" height="{H}" fill="#fff"/>', T(W / 2, 28, title, 21, 'bold')]


def box(x, y, w, h, text, fill='#fff', stroke='#444', size=14, weight='bold', rx=10, dash=False):
    d = ' stroke-dasharray="7 5"' if dash else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.6"{d}/>'
            + (T(x + w / 2, y + h / 2, text, size, weight) if text else ''))


def group(x, y, w, h, title, fill, stroke):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
            + T(x + 18, y + 22, title, 15, 'bold', 'start', stroke))


def arrow(pts, label='', both=False, lx=0, ly=0, color='#333', dash=False):
    d = ' '.join(f'{x},{y}' for x, y in pts)
    m = ' marker-start="url(#a)"' if both else ''
    s = ' stroke-dasharray="7 5"' if dash else ''
    o = f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="1.8" marker-end="url(#a)"{m}{s}/>'
    if label:
        (x1, y1), (x2, y2) = pts[0], pts[1]
        o += (f'<rect x="{(x1 + x2) / 2 + lx - len(label) * 3.6 - 6}" y="{(y1 + y2) / 2 + ly - 11}" width="{len(label) * 7.2 + 12}" height="22" '
              f'rx="4" fill="#fff" fill-opacity="0.95"/>' + T((x1 + x2) / 2 + lx, (y1 + y2) / 2 + ly, label, 12.5, 'normal', color='#333', italic=True))
    return o


# ================================================================ block diagram
def block():
    W, H = 1900, 1180
    o = head(W, H, 'HealthNexus BD — Project Block Diagram')
    # users
    o.append(group(60, 60, 1780, 150, 'Users', '#f7f9fc', '#5b7bb0'))
    users = [('Patient', '#dae8fc'), ('Doctor', '#ffe6cc'), ('Diagnostic Lab', '#e1d5e7'), ('System Admin', '#f8cecc')]
    for i, (u, c) in enumerate(users):
        o.append(box(150 + i * 420, 100, 330, 80, u, c, size=16))
    # frontend
    o.append(group(60, 260, 1780, 170, 'Presentation layer — Web App (React 19 + Vite + Tailwind, English / বাংলা)', '#eef6ff', '#2f6db5'))
    fe = ['Patient\nDashboard', 'Doctor\nDashboard', 'Lab\nDashboard', 'Admin\nConsole', 'Landing &\nAuthentication', 'AI Health\nAssistant (chat)']
    for i, f in enumerate(fe):
        o.append(box(100 + i * 290, 305, 250, 100, f, '#ffffff', '#2f6db5', 15))
    # backend
    o.append(group(60, 490, 1780, 330, 'Application layer — Backend REST API (Node.js 22 + Express + TypeScript)', '#effaf0', '#3d8b45'))
    be = ['Authentication &\nRole-based Access (JWT)', 'Consent Engine\n(OTP + 30-min sessions)', 'Medical Records &\nPrescriptions',
          'Lab Report Upload\n(prescribed tests only)', 'AI Services\n(summary, alerts, chat)', 'Notifications &\nFollow-up Reminders',
          'Admin: Verification\n& User Management', 'Security: AES-256,\nrate limits, audit log']
    for i, b in enumerate(be):
        col, row = i % 4, i // 4
        o.append(box(110 + col * 435, 540 + row * 135, 380, 105, b, '#ffffff', '#3d8b45', 15))
    # data + external
    o.append(group(60, 880, 860, 250, 'Data layer', '#fff9e8', '#b38600'))
    o.append(box(100, 935, 370, 160, 'PostgreSQL (Neon)\n16 tables · encrypted records\nappend-only audit log', '#fff', '#b38600', 15))
    o.append(box(510, 935, 370, 160, 'Cloud File Storage\n(Cloudinary)\nAES-256 encrypted PDFs', '#fff', '#b38600', 15))
    o.append(group(980, 880, 860, 250, 'External services', '#f6f6f6', '#666666'))
    ext = ['Google Gemini AI', 'SMS Gateway\n(BulkSMSBD)', 'Email (Gmail SMTP)', 'BMDC / DGHS\nRegistry (mock)']
    for i, e in enumerate(ext):
        col, row = i % 2, i // 2
        o.append(box(1020 + col * 405, 935 + row * 90, 375, 75, e, '#fff', '#666', 15))
    # flows between layers
    o.append(arrow([(950, 210), (950, 260)], 'HTTPS', both=True, lx=45))
    o.append(arrow([(950, 430), (950, 490)], 'REST · JSON · JWT', both=True, lx=85))
    o.append(arrow([(490, 820), (490, 880)], 'Prisma ORM (TLS)', both=True, lx=-85))
    o.append(arrow([(1410, 820), (1410, 880)], 'HTTPS APIs', both=True, lx=60))
    o.append('</svg>')
    return ''.join(o)


# ================================================================ deployment architecture
def deployment():
    W, H = 1900, 1060
    o = head(W, H, 'HealthNexus BD — Production Deployment Architecture')
    # client
    o.append(group(60, 70, 360, 330, 'Client', '#f7f9fc', '#5b7bb0'))
    o.append(box(100, 120, 280, 110, "User's browser\n(phone / laptop)", '#dae8fc', '#5b7bb0', 15))
    o.append(T(240, 300, 'Patient · Doctor · Lab · Admin', 13.5, 'normal', color='#444'))
    o.append(T(240, 330, 'English / বাংলা UI', 13.5, 'normal', color='#444'))
    # vercel
    o.append(group(560, 70, 470, 330, 'Vercel (global CDN)', '#eef6ff', '#2f6db5'))
    o.append(box(600, 125, 390, 120, 'React SPA (static build)\nhealthnexus-bd.vercel.app', '#fff', '#2f6db5', 15))
    o.append(T(795, 300, 'HTTPS · security headers', 13.5, 'normal', color='#444'))
    o.append(T(795, 330, 'SPA rewrites · cached assets', 13.5, 'normal', color='#444'))
    # render
    o.append(group(560, 470, 470, 420, 'Render — Ohio, US-East (free web service)', '#effaf0', '#3d8b45'))
    o.append(box(600, 525, 390, 150, 'Backend API\nNode.js 22 · Express · Prisma\nhealthnexus-bd-api.onrender.com', '#fff', '#3d8b45', 15))
    o.append(T(795, 730, 'JWT auth · RBAC · rate limits (trust proxy)', 13.5, 'normal', color='#444'))
    o.append(T(795, 760, 'AES-256 encryption · audit logging', 13.5, 'normal', color='#444'))
    o.append(T(795, 790, 'Follow-up reminder scheduler (hourly)', 13.5, 'normal', color='#444'))
    o.append(T(795, 820, 'Secrets in environment variables', 13.5, 'normal', color='#444'))
    # data / services
    o.append(group(1180, 70, 660, 820, 'Managed data & external services', '#fafafa', '#777777'))
    svc = [('Neon PostgreSQL\n(AWS us-east-2, TLS)', '#fff6dc', '#b38600'),
           ('Cloudinary\n(encrypted lab PDFs)', '#fff6dc', '#b38600'),
           ('Google Gemini API\n(de-identified prompts)', '#fff', '#777'),
           ('BulkSMSBD\n(OTP & reset codes by SMS)', '#fff', '#777'),
           ('Gmail SMTP\n(password-reset email)', '#fff', '#777')]
    ys = []
    for i, (s, fill, st) in enumerate(svc):
        y = 120 + i * 150
        ys.append(y + 50)
        o.append(box(1300, y, 420, 100, s, fill, st, 15))
    # ci / ops
    o.append(group(60, 470, 360, 420, 'Source & operations', '#f6f2fa', '#7d5ba6'))
    o.append(box(100, 525, 280, 90, 'GitHub repository\n(main branch)', '#fff', '#7d5ba6', 15))
    o.append(box(100, 690, 280, 100, 'GitHub Actions\nkeep-alive (every 5 min)', '#fff', '#7d5ba6', 15))
    # arrows
    o.append(arrow([(380, 160), (600, 160)], 'loads app (HTTPS)'))
    o.append(arrow([(380, 205), (510, 205), (510, 640), (600, 640)]))
    o.append(T(498, 420, 'REST API calls', 12.5, 'normal', 'end', '#333', True))
    o.append(T(498, 440, '(HTTPS, JWT)', 12.5, 'normal', 'end', '#333', True))
    for y in ys:
        o.append(arrow([(990, 600), (1140, 600), (1140, y), (1300, y)]))
    o.append(T(1062, 590, 'TLS', 12.5, 'normal', italic=True, color='#333'))
    o.append(arrow([(380, 555), (600, 555)], 'auto-deploy on push', lx=0, ly=-16, dash=True))
    o.append(arrow([(380, 740), (545, 740), (545, 660), (600, 660)], '', dash=True))
    o.append(T(462, 724, 'GET /api/health', 12.5, 'normal', 'middle', '#333', True))
    o.append(T(240, 940, 'Frontend deployed with the Vercel CLI · backend auto-deploys from GitHub', 13, 'normal', 'start', '#555', True))
    o.append('</svg>')
    return ''.join(o)


# ================================================================ gantt chart
def gantt():
    start, end = date(2026, 6, 22), date(2026, 12, 6)
    X0, W = 470, 1750
    days = (end - start).days
    px = lambda d: X0 + (d - start).days / days * (W - X0 - 40)
    tasks = [
        ('Proposal & requirement study', date(2026, 6, 22), date(2026, 7, 1), '#9fb7d9'),
        ('SRS, UML & database design', date(2026, 7, 1), date(2026, 7, 12), '#9fb7d9'),
        ('Mid-defense preparation', date(2026, 7, 13), date(2026, 7, 25), '#d9a7a7'),
        ('UI/UX design (Figma)', date(2026, 7, 26), date(2026, 8, 12), '#b9a5d6'),
        ('Database & backend core', date(2026, 8, 12), date(2026, 8, 30), '#8fc79a'),
        ('Security hardening & automated tests', date(2026, 9, 1), date(2026, 10, 19), '#8fc79a'),
        ('Frontend shell, i18n & UI kit', date(2026, 10, 19), date(2026, 10, 25), '#f2c27b'),
        ('Patient, doctor, lab & admin dashboards', date(2026, 10, 26), date(2026, 11, 12), '#f2c27b'),
        ('Landing page & authentication UI', date(2026, 11, 12), date(2026, 11, 14), '#f2c27b'),
        ('AI features (summary, side effects, assistant)', date(2026, 11, 14), date(2026, 11, 16), '#e89a8f'),
        ('Deployment, real SMS & live testing', date(2026, 11, 15), date(2026, 11, 24), '#7fb3c9'),
        ('Report & diagrams', date(2026, 11, 20), date(2026, 11, 30), '#c4c4c4'),
    ]
    milestones = [('Proposal', date(2026, 7, 1)), ('Mid-defense', date(2026, 7, 25)), ('Backend core done', date(2026, 8, 15)),
                  ('Live deployment', date(2026, 11, 19)), ('Report submission', date(2026, 11, 30))]
    RH, top = 52, 120
    H = top + RH * len(tasks) + 170
    o = head(W, H, 'HealthNexus BD — Project Gantt Chart (2026)')
    # month grid
    m = date(2026, 7, 1)
    months = [date(2026, mo, 1) for mo in range(7, 13)]
    o.append(f'<rect x="{X0}" y="{top - 40}" width="{W - X0 - 40}" height="{RH * len(tasks) + 40}" fill="#fcfcfc" stroke="#ccc"/>')
    for mo in months:
        x = px(mo)
        o.append(f'<line x1="{x:.1f}" y1="{top - 40}" x2="{x:.1f}" y2="{top + RH * len(tasks)}" stroke="#ddd"/>')
        o.append(T(x + 40, top - 20, mo.strftime('%b %Y'), 13.5, 'bold', color='#444'))
    for i, (name, a, b, c) in enumerate(tasks):
        y = top + i * RH
        if i % 2:
            o.append(f'<rect x="40" y="{y}" width="{W - 80}" height="{RH}" fill="#f6f8fb" opacity="0.7"/>')
        o.append(T(60, y + RH / 2, f'{i + 1}. {name}', 14, 'normal', 'start'))
        x1, x2 = px(a), max(px(b), px(a) + 6)
        o.append(f'<rect x="{x1:.1f}" y="{y + 12}" width="{x2 - x1:.1f}" height="{RH - 24}" rx="5" fill="{c}" stroke="#555" stroke-width="1"/>')
        label = f'{a.day} {a.strftime("%b")} – {b.day} {b.strftime("%b")}'
        if x2 + 110 > W - 40:
            o.append(T(x1 - 8, y + RH / 2, label, 12, 'normal', 'end', '#555'))
        else:
            o.append(T(x2 + 8, y + RH / 2, label, 12, 'normal', 'start', '#555'))
    yb = top + RH * len(tasks) + 50
    o.append(T(60, yb, 'Milestones', 14, 'bold', 'start'))
    for i, (name, d) in enumerate(milestones):
        x = px(d)
        o.append(f'<line x1="{x:.1f}" y1="{top - 40}" x2="{x:.1f}" y2="{yb - 14}" stroke="#b00020" stroke-dasharray="4 4" opacity="0.6"/>')
        o.append(f'<polygon points="{x:.1f},{yb - 10} {x + 9:.1f},{yb} {x:.1f},{yb + 10} {x - 9:.1f},{yb}" fill="#b00020"/>')
        o.append(T(x, yb + 26 + (i % 2) * 22, f'{name} ({d.day} {d.strftime("%b")})', 12.5, 'bold', 'middle', '#b00020'))
    o.append('</svg>')
    return ''.join(o)


OUT.mkdir(parents=True, exist_ok=True)
for name, fn in [('block', block), ('deployment', deployment), ('gantt', gantt)]:
    (OUT / f'fig-{name}.svg').write_text(fn(), encoding='utf-8')
print('ok')
