"""HealthNexus BD use case diagram: one layout -> an editable .drawio file and an SVG (-> PNG).

Every use case is linked to EVERY actor that performs it (the mid-defense feedback).
"""
import html, math, sys
from pathlib import Path

OUT_DIR = Path(sys.argv[1])
W, H = 2700, 1760
BOX = (300, 40, 2400, 1690)  # system boundary x1, y1, x2, y2
EW, EH = 262, 64             # use case ellipse size

import math as _m


def arc_y(ax, ay, ys, rx, ry, side=1):
    """Points at the given heights on an elliptical arc around the actor (side=1 right, -1 left)."""
    return [(round(ax + side * rx * _m.sqrt(max(0.0, 1 - ((ay - y) / ry) ** 2))), y) for y in ys]


PAT, DOC = (120, 700), (120, 1040)
ADM, LAB = (2580, 700), (2580, 1040)

# ---------------------------------------------------------------- actors (the four stakeholders)
ACTORS = {
    'patient': ('Patient', *PAT, '#dae8fc', '#6c8ebf', True),
    'doctor': ('Doctor', *DOC, '#ffe6cc', '#d79b00', True),
    'admin': ('System Admin', *ADM, '#f8cecc', '#b85450', True),
    'lab': ('Diagnostic Lab', *LAB, '#e1d5e7', '#9673a6', True),
}

# ---------------------------------------------------------------- use cases
pat = arc_y(*PAT, [100, 180, 260, 340, 420, 500, 580, 660], 760, 760)
doc = arc_y(*DOC, [1165, 1250, 1335, 1420, 1505, 1590], 760, 760)
adm = arc_y(*ADM, [300, 400, 500, 600], 760, 760, side=-1)
lab = arc_y(*LAB, [1150, 1270, 1390], 760, 760, side=-1)
C = 1350
UC = {
    # Patient
    'regPatient': ('Register as Patient', *pat[0], 'main'),
    'profile': ('Manage Health Profile', *pat[1], 'main'),
    'history': ('View Medical History,\nPrescriptions & Side Effects', *pat[2], 'main'),
    'labReports': ('View & Download\nLab Reports', *pat[3], 'main'),
    'notify': ('View Notifications', *pat[4], 'main'),
    'consentCtl': ('Deny Request /\nRevoke Doctor Access', *pat[5], 'main'),
    'auditOwn': ('View Who Accessed\nMy Data', *pat[6], 'main'),
    'uhid': ('Generate UHID', pat[0][0] + 340, pat[0][1], 'sub'),
    'assistant': ('Chat with AI' + chr(10) + 'Health Assistant', *pat[7], 'main'),

    # Shared by several stakeholders (centre)
    'regPro': ('Register with BMDC /\nDGHS Licence', C, 690, 'shared'),
    'login': ('Log In', C, 780, 'shared'),
    'logout': ('Log Out', C, 870, 'shared'),
    'reset': ('Reset Password', C, 960, 'shared'),
    'otp': ('Give / Verify Consent\nOTP (Session Access)', C, 1050, 'shared'),
    'search': ('Search Patient\n(UHID / Mobile)', C, 1140, 'shared'),

    # Doctor
    'requestAccess': ('Request Record Access\n(OTP to Patient)', *doc[0], 'main'),
    'viewChart': ('View Patient History\n& Lab Reports', *doc[1], 'main'),
    'visit': ('Record Visit\n& Diagnosis', *doc[2], 'main'),
    'prescribe': ('Write Prescription &\nRecommend Tests', *doc[3], 'main'),
    'myPatients': ('View My Patients', *doc[4], 'main'),
    'aiSummary': ('View AI Clinical\nSummary & Alerts', *doc[5], 'main'),
    'allergy': ('Check Allergy & Drug\nInteractions', doc[3][0] + 340, doc[3][1], 'sub'),

    # Admin
    'verifyApps': ('Approve / Reject\nDoctor & Lab', *adm[0], 'main'),
    'manageUsers': ('Suspend / Reactivate\nUsers', *adm[1], 'main'),
    'stats': ('View Statistics\n& Trends', *adm[2], 'main'),
    'auditAll': ('Monitor Platform\nAudit Log', *adm[3], 'main'),

    # Lab
    'tests': ('View Prescribed Tests', *lab[0], 'main'),
    'upload': ('Upload Encrypted\nReport (PDF)', *lab[1], 'main'),
    'uploads': ('View Upload History', *lab[2], 'main'),
}

# ---------------------------------------------------------------- associations (actor — use case)
ASSOC = [
    *[('patient', u) for u in ['regPatient', 'profile', 'history', 'labReports', 'notify', 'consentCtl',
                               'auditOwn', 'assistant', 'login', 'logout', 'reset', 'otp']],
    *[('doctor', u) for u in ['regPro', 'login', 'logout', 'reset', 'search', 'requestAccess', 'otp',
                              'viewChart', 'visit', 'prescribe', 'myPatients', 'aiSummary']],
    *[('lab', u) for u in ['regPro', 'login', 'logout', 'reset', 'search', 'tests', 'upload', 'uploads']],
    *[('admin', u) for u in ['login', 'logout', 'reset', 'verifyApps', 'manageUsers', 'stats', 'auditAll']],
]

# ---------------------------------------------------------------- «include» / «extend»
REL = [
    ('regPatient', 'uhid', 'include'),
    ('prescribe', 'allergy', 'include'),
]


# ================================================================ geometry
def ellipse_edge(cx, cy, tx, ty, a=EW / 2, b=EH / 2):
    """Point on the ellipse (centre cx,cy) towards (tx,ty)."""
    dx, dy = tx - cx, ty - cy
    if dx == dy == 0:
        return cx, cy
    t = 1 / math.sqrt((dx / a) ** 2 + (dy / b) ** 2)
    return cx + dx * t, cy + dy * t


def actor_anchor(aid, tx, ty):
    _, x, y, *_ = ACTORS[aid]
    if ACTORS[aid][5]:  # primary: from the side facing the use case, at shoulder height
        return (x + 26 if tx > x else x - 26), y - 8
    return x, y - 50  # secondary (below the box): from the head


# ================================================================ SVG
def svg_text(x, y, text, size=15, weight='bold', anchor='middle', color='#000', italic=False):
    lines = text.split('\n')
    lh = size * 1.18
    y0 = y - (len(lines) - 1) * lh / 2
    style = 'font-style:italic;' if italic else ''
    return ''.join(
        f'<text x="{x:.1f}" y="{y0 + i * lh:.1f}" font-family="Helvetica, Arial, sans-serif" font-size="{size}" '
        f'font-weight="{weight}" fill="{color}" text-anchor="{anchor}" dominant-baseline="central" style="{style}">'
        f'{html.escape(line)}</text>' for i, line in enumerate(lines))


def svg_actor(label, x, y, fill, stroke, primary):
    s = 1.0 if primary else 0.85
    head = 14 * s
    parts = [
        f'<rect x="{x - 38}" y="{y - 70 * s}" width="76" height="{128 * s}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>',
        f'<circle cx="{x}" cy="{y - 50 * s}" r="{head}" fill="#fff" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x}" y1="{y - 36 * s}" x2="{x}" y2="{y + 10 * s}" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x - 24 * s}" y1="{y - 18 * s}" x2="{x + 24 * s}" y2="{y - 18 * s}" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x}" y1="{y + 10 * s}" x2="{x - 20 * s}" y2="{y + 44 * s}" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x}" y1="{y + 10 * s}" x2="{x + 20 * s}" y2="{y + 44 * s}" stroke="#000" stroke-width="2"/>',
    ]
    parts.append(svg_text(x, y + 70 * s + 10 + (8 if '\n' in label else 0), label, size=16 if primary else 14))
    return ''.join(parts)


def build_svg():
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
           '<defs><marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" '
           'orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11" fill="none" stroke="#000" stroke-width="1.6"/></marker></defs>',
           f'<rect width="{W}" height="{H}" fill="#fff"/>']
    x1, y1, x2, y2 = BOX
    out.append(f'<rect x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" fill="none" stroke="#000" stroke-width="2.5"/>')
    out.append(svg_text(x2 - 24, y1 + 28, 'HealthNexus BD — Unified Patient Health Record System', size=19, anchor='end'))
    # associations
    for aid, uid in ASSOC:
        _, cx, cy, _ = UC[uid]
        ax, ay = actor_anchor(aid, cx, cy)
        ex, ey = ellipse_edge(cx, cy, ax, ay)
        color = '#000' if ACTORS[aid][5] else '#555'
        dash = '' if ACTORS[aid][5] else ' stroke-dasharray="1 0"'
        out.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{color}" stroke-width="1.4"{dash}/>')
    # include / extend
    for a, b, kind in REL:
        _, ax_, ay_, _ = UC[a]
        _, bx_, by_, _ = UC[b]
        sx, sy = ellipse_edge(ax_, ay_, bx_, by_)
        tx, ty = ellipse_edge(bx_, by_, ax_, ay_)
        out.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{tx:.1f}" y2="{ty:.1f}" stroke="#000" stroke-width="1.5" '
                   f'stroke-dasharray="7 5" marker-end="url(#open)"/>')
        mx, my = (sx + tx) / 2, (sy + ty) / 2
        label = '«include»' if kind == 'include' else '«extend»'
        out.append(f'<rect x="{mx - 40}" y="{my - 11}" width="80" height="22" fill="#fff"/>')
        out.append(svg_text(mx, my, label, size=13, weight='normal', italic=True))
    # use cases
    for uid, (label, cx, cy, kind) in UC.items():
        fill = {'main': '#ffffff', 'shared': '#fff9e6', 'sub': '#f5f8fc'}[kind]
        out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{EW / 2}" ry="{EH / 2}" fill="{fill}" stroke="#000" stroke-width="1.6"/>')
        out.append(svg_text(cx, cy, label, size=14.5))
    # actors
    for aid, (label, x, y, fill, stroke, primary) in ACTORS.items():
        out.append(svg_actor(label, x, y, fill, stroke, primary))
    # legend
    lx, ly = 2010, 1520
    out.append(svg_text(lx, ly, 'Legend', size=15, anchor='start'))
    for i, (fill, text) in enumerate([('#ffffff', 'Use case of one actor'), ('#fff9e6', 'Shared by several actors'),
                                      ('#f5f8fc', '«include» / «extend» use case')]):
        out.append(f'<ellipse cx="{lx + 28}" cy="{ly + 34 + i * 34}" rx="26" ry="12" fill="{fill}" stroke="#000" stroke-width="1.3"/>')
        out.append(svg_text(lx + 64, ly + 34 + i * 34, text, size=13, weight='normal', anchor='start'))
    out.append('</svg>')
    return ''.join(out)


# ================================================================ draw.io
def drawio_xml():
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    x1, y1, x2, y2 = BOX
    cells.append(f'<mxCell id="sys" value="" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;strokeWidth=2.5;" '
                 f'parent="1" vertex="1"><mxGeometry x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" as="geometry"/></mxCell>')
    cells.append(f'<mxCell id="sysLabel" value="HealthNexus BD — Unified Patient Health Record System" '
                 f'style="text;html=1;align=right;verticalAlign=middle;fontSize=19;fontStyle=1;spacingRight=24;" parent="1" vertex="1">'
                 f'<mxGeometry x="{x1}" y="{y1 + 8}" width="{x2 - x1}" height="36" as="geometry"/></mxCell>')
    esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
    for aid, (label, x, y, fill, stroke, primary) in ACTORS.items():
        w, h = (48, 84) if primary else (40, 70)
        cells.append(f'<mxCell id="{aid}" value="{esc(label)}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;'
                     f'html=1;outlineConnect=0;fillColor={fill};strokeColor={stroke};fontSize={16 if primary else 14};fontStyle=1;" '
                     f'parent="1" vertex="1"><mxGeometry x="{x - w / 2}" y="{y - 64}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    for uid, (label, cx, cy, kind) in UC.items():
        fill = {'main': '#ffffff', 'shared': '#fff9e6', 'sub': '#f5f8fc'}[kind]
        cells.append(f'<mxCell id="{uid}" value="{esc(label)}" style="ellipse;whiteSpace=wrap;html=1;fontSize=14;fontStyle=1;'
                     f'fillColor={fill};strokeColor=#000000;" parent="1" vertex="1">'
                     f'<mxGeometry x="{cx - EW / 2}" y="{cy - EH / 2}" width="{EW}" height="{EH}" as="geometry"/></mxCell>')
    for i, (aid, uid) in enumerate(ASSOC):
        cells.append(f'<mxCell id="as{i}" style="endArrow=none;html=1;strokeColor=#000000;" parent="1" source="{aid}" target="{uid}" edge="1">'
                     f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    for i, (a, b, kind) in enumerate(REL):
        label = '&amp;laquo;include&amp;raquo;' if kind == 'include' else '&amp;laquo;extend&amp;raquo;'
        cells.append(f'<mxCell id="rel{i}" value="{label}" style="endArrow=open;html=1;dashed=1;strokeColor=#000000;fontSize=13;'
                     f'fontStyle=2;labelBackgroundColor=#ffffff;endSize=10;" parent="1" source="{a}" target="{b}" edge="1">'
                     f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    return ('<mxfile host="HealthNexus-generator"><diagram id="usecase-v2" name="Use Case">'
            f'<mxGraphModel dx="0" dy="0" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
            f'pageScale="1" pageWidth="{W}" pageHeight="{H}" background="#ffffff" math="0" shadow="0"><root>'
            + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')


def collisions():
    """Lines that pass through a use case they don't connect to."""
    segs = []
    for aid, uid in ASSOC:
        _, cx, cy, _ = UC[uid]
        ax, ay = actor_anchor(aid, cx, cy)
        segs.append((f'{aid}-{uid}', (ax, ay), ellipse_edge(cx, cy, ax, ay), {uid}))
    for a, b, k in REL:
        pa, pb = UC[a][1:3], UC[b][1:3]
        segs.append((f'{a}>{b}', ellipse_edge(*pa, *pb), ellipse_edge(*pb, *pa), {a, b}))
    hits = []
    for name, (x1, y1), (x2, y2), own in segs:
        for uid, (_, cx, cy, _) in UC.items():
            if uid in own:
                continue
            for i in range(1, 80):
                t = i / 80
                x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
                if ((x - cx) / (EW / 2 + 4)) ** 2 + ((y - cy) / (EH / 2 + 4)) ** 2 < 1:
                    hits.append(f'{name} crosses {uid}')
                    break
    return hits


OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / 'usecase.svg').write_text(build_svg(), encoding='utf-8')
(OUT_DIR / 'HealthNexus-UseCase-v2.drawio').write_text(drawio_xml(), encoding='utf-8')
print('use cases:', len(UC), '| associations:', len(ASSOC), '| include/extend:', len(REL))
for h in collisions():
    print('  CROSS', h)
