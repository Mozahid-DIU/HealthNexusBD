"""Block diagram, deployment diagram and Gantt chart for the HealthNexus BD report, as plain draw.io files.

Usage: python figures_v3.py OUT_DIR   (then render each .drawio with drawio-render.mjs)
"""
import html
import sys
from datetime import date
from pathlib import Path

OUT = Path(sys.argv[1])
FS = 20


class Doc:
    def __init__(self, name):
        self.name, self.cells, self.n = name, [], 0

    def _id(self):
        self.n += 1
        return f'c{self.n}'

    def box(self, x, y, w, h, text='', style=''):
        cid = self._id()
        value = html.escape(text).replace('\n', '&lt;br&gt;')
        self.cells.append(f'<mxCell id="{cid}" value="{value}" style="rounded=0;whiteSpace=wrap;html=1;fontSize={FS};{style}" '
                          f'vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return (x, y, w, h)

    def group(self, x, y, w, h, title):
        return self.box(x, y, w, h, title, 'fillColor=none;verticalAlign=top;align=left;spacingLeft=10;spacingTop=4;fontStyle=1;')

    def text(self, x, y, w, h, text, style=''):
        return self.box(x, y, w, h, text, f'text;strokeColor=none;fillColor=none;{style}')

    def line(self, pts, label='', style='', both=False):
        cid = self._id()
        way = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
        start = 'startArrow=classic;' if both else ''
        self.cells.append(f'<mxCell id="{cid}" value="{html.escape(label)}" style="edgeStyle=none;html=1;rounded=0;endArrow=classic;'
                          f'{start}fontSize={FS - 2};labelBackgroundColor=#ffffff;{style}" edge="1" parent="1">'
                          f'<mxGeometry relative="1" as="geometry"><mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/>'
                          f'<mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/><Array as="points">{way}</Array>'
                          f'</mxGeometry></mxCell>')

    def xml(self, w, h):
        return (f'<mxfile host="app.diagrams.net"><diagram id="{self.name}" name="{self.name}"><mxGraphModel grid="1" gridSize="10" '
                f'page="1" pageWidth="{w}" pageHeight="{h}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
                + ''.join(self.cells) + '</root></mxGraphModel></diagram></mxfile>')


def row(d, labels, x0, width, y, w, h):
    gap = (width - len(labels) * w) / (len(labels) + 1)
    return [d.box(round(x0 + gap + i * (w + gap)), y, w, h, t) for i, t in enumerate(labels)]


# ================================================================ block diagram
def block():
    d = Doc('Block Diagram')
    X, GW = 20, 1460
    d.group(X, 10, GW, 130, 'Users')
    row(d, ['Patient', 'Doctor', 'Lab', 'Admin'], X, GW, 55, 280, 60)
    d.group(X, 200, GW, 160, 'Web App (React)')
    row(d, ['Patient\nDashboard', 'Doctor\nDashboard', 'Lab\nDashboard', 'Admin\nPanel', 'Landing &\nLogin', 'Health\nAssistant'],
        X, GW, 248, 200, 86)
    d.group(X, 420, GW, 290, 'Server (Node.js + Express)')
    row(d, ['Login &\nRoles (JWT)', 'OTP Consent\n& Sessions', 'Records &\nPrescriptions', 'Lab Report\nUpload'], X, GW, 470, 300, 90)
    row(d, ['AI Summary,\nAlerts & Chat', 'Notifications\n& Reminders', 'Doctor / Lab\nVerification', 'Encryption &\nAudit Log'],
        X, GW, 590, 300, 90)
    d.group(X, 770, 700, 200, 'Data')
    row(d, ['PostgreSQL\n(Neon)', 'File Storage\n(Cloudinary)'], X, 700, 830, 260, 100)
    d.group(780, 770, 700, 200, 'External Services')
    row(d, ['Gemini AI', 'SMS Gateway', 'Gmail SMTP'], 780, 700, 845, 190, 70)
    d.line([(750, 140), (750, 200)], 'HTTPS', both=True)
    d.line([(750, 360), (750, 420)], 'REST API (JSON)', both=True)
    d.line([(370, 710), (370, 770)], 'Prisma ORM', both=True)
    d.line([(1130, 710), (1130, 770)], 'HTTPS', both=True)
    return d.xml(1500, 990)


# ================================================================ deployment
def deployment():
    d = Doc('Deployment')
    d.box(20, 110, 240, 90, "User's Browser\n(phone / laptop)")
    d.group(360, 40, 340, 230, 'Vercel (CDN)')
    d.box(400, 110, 260, 100, 'React App\n(static build)')
    d.group(360, 370, 340, 270, 'Render (Ohio)')
    d.box(400, 450, 260, 120, 'Node.js API\n(Express + Prisma)')
    d.box(410, 740, 240, 80, 'GitHub\n(main branch)')
    d.box(20, 740, 240, 80, 'GitHub Actions')
    services = ['Neon PostgreSQL', 'Cloudinary', 'Google Gemini API', 'BulkSMSBD (SMS)', 'Gmail SMTP']
    ys = []
    for i, s in enumerate(services):
        y = 40 + i * 130
        d.box(1060, y, 300, 76, s)
        ys.append(y + 38)
    d.line([(260, 155), (400, 155)])
    d.text(270, 118, 120, 30, 'HTTPS')
    d.line([(260, 185), (310, 185), (310, 490), (400, 490)])
    d.text(110, 320, 190, 30, 'REST API + JWT', 'align=right;')
    for y in ys:
        d.line([(660, 510), (900, 510), (900, y), (1060, y)])
    d.line([(530, 740), (530, 570)], '', 'dashed=1;')
    d.text(540, 660, 150, 30, 'auto deploy', 'align=left;')
    d.line([(140, 740), (140, 680), (350, 680), (350, 540), (400, 540)], '', 'dashed=1;')
    d.text(20, 640, 320, 30, 'health check (every 5 min)', 'align=left;')
    return d.xml(1380, 830)


# ================================================================ gantt chart
def gantt():
    d = Doc('Gantt Chart')
    start, end = date(2026, 6, 22), date(2026, 12, 16)
    X0, X1, top, RH = 300, 1480, 60, 44
    px = lambda day: round(X0 + (day - start).days / (end - start).days * (X1 - X0))
    tasks = [
        ('Proposal & requirements', date(2026, 6, 22), date(2026, 7, 1)),
        ('SRS, UML & DB design', date(2026, 7, 1), date(2026, 7, 12)),
        ('Mid-defense preparation', date(2026, 7, 13), date(2026, 7, 23)),
        ('UI/UX design (Figma)', date(2026, 7, 24), date(2026, 8, 12)),
        ('Backend core', date(2026, 8, 12), date(2026, 8, 30)),
        ('Security & testing', date(2026, 9, 1), date(2026, 10, 19)),
        ('Frontend setup', date(2026, 10, 19), date(2026, 10, 25)),
        ('Dashboards (all roles)', date(2026, 10, 26), date(2026, 11, 12)),
        ('Landing page & login', date(2026, 11, 12), date(2026, 11, 14)),
        ('AI features', date(2026, 11, 14), date(2026, 11, 16)),
        ('Deployment & SMS', date(2026, 11, 15), date(2026, 11, 24)),
        ('Report & diagrams', date(2026, 11, 20), date(2026, 11, 30)),
    ]
    bottom = top + RH * len(tasks)
    d.box(20, top - 50, X1 - 20, bottom - top + 50, '', 'fillColor=none;')
    d.text(30, top - 50, X0 - 40, 50, 'Task', 'align=left;fontStyle=1;')
    d.line([(20, top), (X1, top)], '', 'endArrow=none;')
    d.line([(X0, top - 50), (X0, bottom)], '', 'endArrow=none;')
    for mo in range(7, 13):
        x = px(date(2026, mo, 1))
        d.line([(x, top - 50), (x, bottom)], '', 'endArrow=none;strokeColor=#bbbbbb;')
        d.text(x + 4, top - 50, 120, 50, date(2026, mo, 1).strftime('%b'), 'align=left;fontStyle=1;')
    for i, (name, a, b) in enumerate(tasks):
        y = top + i * RH
        d.text(30, y, X0 - 40, RH, name, 'align=left;')
        x1 = px(a)
        d.box(x1, y + 10, max(px(b) - x1, 8), RH - 20, '', 'fillColor=#dae8fc;strokeColor=#6c8ebf;')
    milestones = [('Proposal', date(2026, 7, 1)), ('Mid-defense', date(2026, 7, 23)), ('Backend done', date(2026, 8, 30)),
                  ('Live', date(2026, 11, 19)), ('Submission', date(2026, 11, 30))]
    my = bottom + 30
    d.text(30, my - 10, X0 - 40, 40, 'Milestones', 'align=left;fontStyle=1;')
    for i, (name, day) in enumerate(milestones):
        x = px(day)
        d.box(x - 10, my, 20, 20, '', 'rhombus;fillColor=#000000;')
        d.text(x - 80, my + 22 + (i % 2) * 26, 160, 26, name, 'align=center;fontSize=18;')
    return d.xml(1500, my + 90)


OUT.mkdir(parents=True, exist_ok=True)
for name, fn in [('Block', block), ('Deployment', deployment), ('Gantt', gantt)]:
    (OUT / f'{name}.drawio').write_text(fn(), encoding='utf-8')
print('ok')
