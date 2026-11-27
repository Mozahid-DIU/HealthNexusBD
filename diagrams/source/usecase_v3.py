"""Use case diagram in plain draw.io style (white shapes, black lines, short labels, large text).

Each actor's own use cases sit on a fan around it: every ellipse is pushed out along its ray until its
nearest point is exactly R away, so all ellipses lie outside the circle of radius R and the actor's lines
(which stay inside that circle) can't cut through them. Shared use cases sit in a middle column, in a gap
of the fans. Writes a .drawio file; render it with drawio-render.mjs.
Usage: python usecase_h.py OUT_DIR
"""
import html, math, os, sys
from pathlib import Path

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else None
FS = 20
LINE = FS * 1.25
W, H = 1843, 1296
BOX = (180, 14, 1663, 1282)
env = lambda k, d: float(os.environ.get(k, d))


def ew(label):
    return max(150, int(max(len(l) for l in label.split('\n')) * FS * 0.56) + 44)


def eh(label):
    return int(LINE * (label.count('\n') + 1) + 22)


def nearest(ax, ay, cx, cy, a, b):
    return min(math.hypot(cx + a * math.cos(t) - ax, cy + b * math.sin(t) - ay) for t in (i * math.pi / 90 for i in range(180)))


def fan(actor, labels, a0, a1, r, side=1):
    """Ellipses at evenly spaced angles a0..a1 (degrees, 0 = towards the middle, negative = up), nearest point r away."""
    ax, ay = actor
    out = []
    for i, label in enumerate(labels):
        th = math.radians(a0 + (a1 - a0) * i / max(1, len(labels) - 1))
        dx, dy = side * math.cos(th), math.sin(th)
        lo, hi = 0.0, 3000.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if nearest(ax, ay, ax + dx * mid, ay + dy * mid, ew(label) / 2, eh(label) / 2) < r:
                lo = mid
            else:
                hi = mid
        out.append((label, round(ax + dx * hi), round(ay + dy * hi)))
    return out


PAT, DOC, ADM, LAB = (79, 518), (79, 806), (1764, 518), (1764, 806)
ACTORS = {'patient': ('Patient', *PAT), 'doctor': ('Doctor', *DOC), 'admin': ('Admin', *ADM), 'lab': ('Lab', *LAB)}


def arc(actor, labels, ys, r, side=1, ry=None):
    ax, ay = actor
    ry = ry or r
    return [(l, round(ax + side * r * math.sqrt(max(0.0, 1 - ((ay - y) / ry) ** 2))), y) for l, y in zip(labels, ys)]


step = lambda a, n, d: [round(a + i * d) for i in range(n)]
pat = arc(PAT, ['Register', 'Manage Profile', 'View Medical History', 'View Lab Reports', 'View Notifications',
                'Deny / Revoke Access', 'View Access Log', 'Chat with Assistant'],
          step(env('PY', 84), 8, env('PS', 57)), env('PR', 740), ry=env('PRY', 480) or None)
doc = arc(DOC, ['Request Access', 'View Patient History', 'Record Visit', 'Write Prescription', 'View My Patients',
                'View AI Summary'], step(env('DY', 893), 6, env('DS', 65)), env('DR', 691))
adm = arc(ADM, ['Verify Doctor / Lab', 'Suspend /\nReactivate User', 'View Statistics', 'View Audit Log'],
          step(env('AY0', 216), 4, env('AS', 86)), env('AR', 547), side=-1)
lab = arc(LAB, ['View Prescribed Tests', 'Upload Report', 'View Upload History'],
          step(env('LY', 900), 3, env('LS', 108)), env('LR', 547), side=-1)
C = int(env('C', 980))
CY = step(env('CY', 545), 6, env('CS', 60))
ids = ['reg', 'profile', 'history', 'reports', 'notify', 'revoke', 'accessLog', 'chat',
       'request', 'chart', 'visit', 'prescribe', 'myPatients', 'ai',
       'verify', 'suspend', 'stats', 'audit', 'tests', 'upload', 'uploads']
UC = dict(zip(ids, pat + doc + adm + lab))
UC.update({
    'login': ('Login', C, CY[0]),
    'logout': ('Logout', C, CY[1]),
    'reset': ('Reset Password', C, CY[2]),
    'otp': ('Verify OTP', C, CY[3]),
    'regPro': ('Register with Licence', C, CY[4]),
    'search': ('Search Patient', C, CY[5]),
})
NUDGE = {'history': (int(env('HX', 0)), 0), 'profile': (int(env('PX', 0)), 0)}
for k, (dx, dy) in NUDGE.items():
    UC[k] = (UC[k][0], UC[k][1] + dx, UC[k][2] + dy)
UC['uhid'] =('Generate UHID', UC['reg'][1] + int(env('UX', 350)), UC['reg'][2] + int(env('UY', 0)))
UC['allergy'] = ('Check Allergy', UC['prescribe'][1] + int(env('AX', 350)), UC['prescribe'][2] + int(env('AY', 0)))

ASSOC = [
    *[('patient', u) for u in ['reg', 'profile', 'history', 'reports', 'notify', 'revoke', 'accessLog', 'chat',
                               'login', 'logout', 'reset', 'otp']],
    *[('doctor', u) for u in ['regPro', 'login', 'logout', 'reset', 'otp', 'search', 'request', 'chart', 'visit',
                              'prescribe', 'myPatients', 'ai']],
    *[('lab', u) for u in ['regPro', 'login', 'logout', 'reset', 'search', 'tests', 'upload', 'uploads']],
    *[('admin', u) for u in ['login', 'logout', 'reset', 'verify', 'suspend', 'stats', 'audit']],
]
REL = [('reg', 'uhid', 'include'), ('prescribe', 'allergy', 'include')]


# ---------------------------------------------------------------- geometry check
def ell_edge(cx, cy, w, h, tx, ty):
    dx, dy = tx - cx, ty - cy
    t = 1 / math.sqrt((dx / (w / 2)) ** 2 + (dy / (h / 2)) ** 2)
    return cx + dx * t, cy + dy * t


def anchor(aid, tx, ty):
    _, x, y = ACTORS[aid]
    return (x + 22 if tx > x else x - 22), y - 8


def seg_hits(p1, p2, cx, cy, a, b):
    x1, y1 = (p1[0] - cx) / a, (p1[1] - cy) / b
    x2, y2 = (p2[0] - cx) / a, (p2[1] - cy) / b
    dx, dy = x2 - x1, y2 - y1
    t = max(0.0, min(1.0, -(x1 * dx + y1 * dy) / (dx * dx + dy * dy or 1)))
    return (x1 + t * dx) ** 2 + (y1 + t * dy) ** 2 < 1


def problems():
    hits, segs = [], []
    for aid, uid in ASSOC:
        label, cx, cy = UC[uid]
        p = anchor(aid, cx, cy)
        segs.append((f'{aid}-{uid}', p, ell_edge(cx, cy, ew(label), eh(label), *p), {uid}))
    for a, b, _ in REL:
        la, ax, ay = UC[a]
        lb, bx, by = UC[b]
        segs.append((f'{a}>{b}', ell_edge(ax, ay, ew(la), eh(la), bx, by), ell_edge(bx, by, ew(lb), eh(lb), ax, ay), {a, b}))
    for name, p1, p2, own in segs:
        for uid, (label, cx, cy) in UC.items():
            if uid not in own and seg_hits(p1, p2, cx, cy, ew(label) / 2 + 6, eh(label) / 2 + 6):
                hits.append(f'{name} crosses {uid}')
    items = list(UC.items())
    for i, (u1, (l1, x1, y1)) in enumerate(items):
        for u2, (l2, x2, y2) in items[i + 1:]:
            if abs(x1 - x2) < (ew(l1) + ew(l2)) / 2 + 10 and abs(y1 - y2) < (eh(l1) + eh(l2)) / 2 + 8:
                hits.append(f'{u1} overlaps {u2}')
    for uid, (label, cx, cy) in UC.items():
        if cx - ew(label) / 2 < BOX[0] + 10 or cx + ew(label) / 2 > BOX[2] - 10 or cy - eh(label) / 2 < BOX[1] + LINE + 16 \
                or cy + eh(label) / 2 > BOX[3] - 10:
            hits.append(f'{uid} outside the boundary')
    return hits


# ---------------------------------------------------------------- draw.io
def drawio():
    esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
    c = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    x1, y1, x2, y2 = BOX
    c.append(f'<mxCell id="sys" value="HealthNexus BD" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;verticalAlign=top;'
             f'fontSize={FS + 2};fontStyle=1;spacingTop=4;" vertex="1" parent="1"><mxGeometry x="{x1}" y="{y1}" width="{x2 - x1}" '
             f'height="{y2 - y1}" as="geometry"/></mxCell>')
    for aid, (label, x, y) in ACTORS.items():
        c.append(f'<mxCell id="{aid}" value="{label}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;'
                 f'outlineConnect=0;fontSize={FS};" vertex="1" parent="1"><mxGeometry x="{x - 22}" y="{y - 50}" width="44" height="84" as="geometry"/></mxCell>')
    for uid, (label, cx, cy) in UC.items():
        w, h = ew(label), eh(label)
        c.append(f'<mxCell id="{uid}" value="{esc(label)}" style="ellipse;whiteSpace=wrap;html=1;fontSize={FS};" vertex="1" parent="1">'
                 f'<mxGeometry x="{cx - w / 2:.0f}" y="{cy - h / 2:.0f}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    for i, (aid, uid) in enumerate(ASSOC):
        c.append(f'<mxCell id="as{i}" style="endArrow=none;html=1;" edge="1" parent="1" source="{aid}" target="{uid}">'
                 f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    for i, (a, b, kind) in enumerate(REL):
        c.append(f'<mxCell id="rel{i}" value="&amp;lt;&amp;lt;{kind}&amp;gt;&amp;gt;" style="endArrow=open;html=1;dashed=1;endSize=12;'
                 f'fontSize={FS - 3};labelBackgroundColor=#ffffff;" edge="1" parent="1" source="{a}" target="{b}">'
                 f'<mxGeometry relative="1" as="geometry"/></mxCell>')
    return (f'<mxfile host="app.diagrams.net"><diagram id="usecase" name="Use Case"><mxGraphModel dx="1400" dy="900" grid="1" '
            f'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{W}" '
            f'pageHeight="{H}" math="0" shadow="0"><root>' + ''.join(c) + '</root></mxGraphModel></diagram></mxfile>')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'UseCase.drawio').write_text(drawio(), encoding='utf-8')
    hits = problems()
    print(f'problems {len(hits)}', *[f'\n  {h}' for h in hits])
