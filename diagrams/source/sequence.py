"""UML sequence diagrams -> SVG (for PNG) + editable .drawio.

Participants are actors (stick figures) or components (boxes). Steps, in order:
  msg(a, b, text)            synchronous call (solid line, filled arrow)
  ret(a, b, text)            reply (dashed line, open arrow)
  self(a, text)              a call to itself
  alt([(guard, [steps...]), ...])   an 'alt' frame with one section per guard
Messages are numbered automatically.
"""
import html

COL_W, TOP, HEAD_H, STEP, PAD = 250, 60, 70, 46, 40
FONT = 'Helvetica, Arial, sans-serif'


class Seq:
    def __init__(self, title, participants):
        # participants: [(id, label, kind, fill, stroke)]  kind: actor | box
        self.title, self.parts = title, participants
        self.idx = {p[0]: i for i, p in enumerate(participants)}
        self.steps = []

    def msg(self, a, b, text):
        return ('msg', a, b, text)

    def ret(self, a, b, text):
        return ('ret', a, b, text)

    def selfc(self, a, text):
        return ('self', a, a, text)

    def alt(self, sections):
        return ('alt', sections)

    def add(self, *steps):
        self.steps.extend(steps)

    # ------------------------------------------------------------- layout
    def x(self, pid):
        return PAD + COL_W / 2 + self.idx[pid] * COL_W

    def layout(self):
        """Flatten steps into drawable items with y positions."""
        items, y, n = [], TOP + HEAD_H + 50, [0]

        def walk(steps, depth):
            nonlocal y
            for s in steps:
                if s[0] == 'alt':
                    top = y - 26
                    xs = [self.x(p) for p in self.involved(s)]
                    x1, x2 = min(xs) - 95 - depth * 10, max(xs) + 95 + depth * 10
                    frame = {'kind': 'alt', 'top': top, 'x1': x1, 'x2': x2, 'guards': []}
                    items.append(frame)
                    y += 16
                    for gi, (guard, sub) in enumerate(s[1]):
                        if gi:
                            y += 6
                        frame['guards'].append((guard, y - 18))
                        y += 22
                        walk(sub, depth + 1)
                    frame['bottom'] = y - 18
                    y += 22
                else:
                    n[0] += 1
                    items.append({'kind': s[0], 'a': s[1], 'b': s[2], 'text': f'{n[0]}: {s[3]}', 'y': y})
                    y += STEP + (16 if s[0] == 'self' else 0)

        walk(self.steps, 0)
        return items, y + 20

    def involved(self, alt):
        ids = set()
        for _, sub in alt[1]:
            for s in sub:
                if s[0] == 'alt':
                    ids |= self.involved(s)
                else:
                    ids |= {s[1], s[2]}
        return ids

    # ------------------------------------------------------------- SVG
    @staticmethod
    def t(x, y, s, size=13.5, weight='normal', anchor='middle', color='#111', italic=False):
        lines = s.split('\n')
        lh = size * 1.2
        y0 = y - (len(lines) - 1) * lh / 2
        st = 'font-style:italic;' if italic else ''
        return ''.join(f'<text x="{x:.1f}" y="{y0 + i * lh:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
                       f'fill="{color}" text-anchor="{anchor}" dominant-baseline="central" style="{st}">{html.escape(l)}</text>'
                       for i, l in enumerate(lines))

    @staticmethod
    def bg(x, y, text, anchor):
        lines = text.split(chr(10))
        w = max(len(l) for l in lines) * 7.0 + 8
        h = 17 * len(lines)
        x0 = x - w / 2 if anchor == 'middle' else x - 3
        return f'<rect x="{x0:.1f}" y="{y - h / 2:.1f}" width="{w:.1f}" height="{h}" fill="#ffffff" fill-opacity="0.92"/>'

    def svg(self):
        items, bottom = self.layout()
        W = int(PAD * 2 + COL_W * len(self.parts))
        H = int(bottom + 30)
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
             '<defs><marker id="sync" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="10" markerHeight="10" orient="auto">'
             '<path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker>'
             '<marker id="reply" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="10" markerHeight="10" orient="auto">'
             '<path d="M0,0 L10,5 L0,10" fill="none" stroke="#111" stroke-width="1.4"/></marker></defs>',
             f'<rect width="{W}" height="{H}" fill="#fff"/>',
             self.t(W / 2, 26, self.title, size=19, weight='bold')]
        # lifelines + heads
        for pid, label, kind, fill, stroke in self.parts:
            x = self.x(pid)
            o.append(f'<line x1="{x}" y1="{TOP + HEAD_H}" x2="{x}" y2="{bottom}" stroke="#888" stroke-width="1.3" stroke-dasharray="6 5"/>')
            if kind == 'actor':
                hy = TOP - 4
                o.append(f'<circle cx="{x}" cy="{hy + 9}" r="9" fill="{fill}" stroke="#111" stroke-width="1.8"/>'
                         f'<line x1="{x}" y1="{hy + 18}" x2="{x}" y2="{hy + 40}" stroke="#111" stroke-width="1.8"/>'
                         f'<line x1="{x - 14}" y1="{hy + 26}" x2="{x + 14}" y2="{hy + 26}" stroke="#111" stroke-width="1.8"/>'
                         f'<line x1="{x}" y1="{hy + 40}" x2="{x - 12}" y2="{hy + 54}" stroke="#111" stroke-width="1.8"/>'
                         f'<line x1="{x}" y1="{hy + 40}" x2="{x + 12}" y2="{hy + 54}" stroke="#111" stroke-width="1.8"/>')
                o.append(self.t(x, TOP + HEAD_H - 6, label, size=14.5, weight='bold'))
            else:
                o.append(f'<rect x="{x - 100}" y="{TOP + 8}" width="200" height="{HEAD_H - 14}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>')
                o.append(self.t(x, TOP + 8 + (HEAD_H - 14) / 2, label, size=14.5, weight='bold'))
        # alt frames (under the arrows)
        for it in items:
            if it['kind'] != 'alt':
                continue
            x1, x2, y1, y2 = it['x1'], it['x2'], it['top'], it['bottom']
            o.append(f'<rect x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" fill="#fafafa" fill-opacity="0.55" stroke="#555" stroke-width="1.3"/>')
            o.append(f'<path d="M{x1},{y1} h44 v14 l-8,8 h-36 z" fill="#e8e8e8" stroke="#555" stroke-width="1.2"/>')
            o.append(self.t(x1 + 20, y1 + 11, 'alt', size=13, weight='bold'))
            for gi, (guard, gy) in enumerate(it['guards']):
                if gi:
                    o.append(f'<line x1="{x1}" y1="{gy - 6}" x2="{x2}" y2="{gy - 6}" stroke="#555" stroke-width="1.2" stroke-dasharray="7 5"/>')
                o.append(self.t(x1 + 52, gy + 6, f'[{guard}]', size=12.5, anchor='start', italic=True, color='#333'))
        # messages
        for it in items:
            if it['kind'] == 'alt':
                continue
            xa, xb, y = self.x(it['a']), self.x(it['b']), it['y']
            if it['kind'] == 'self':
                o.append(f'<path d="M{xa},{y - 8} h46 v26 h-44" fill="none" stroke="#111" stroke-width="1.5" marker-end="url(#sync)"/>')
                o.append(self.bg(xa + 52, y + 5, it['text'], 'start'))
                o.append(self.t(xa + 54, y + 5, it['text'], anchor='start'))
                continue
            dashed = it['kind'] == 'ret'
            dx = -2 if xb > xa else 2
            dash = 'stroke-dasharray="7 5"' if dashed else ''
            marker = '#reply' if dashed else '#sync'
            o.append(f'<line x1="{xa}" y1="{y}" x2="{xb + dx}" y2="{y}" stroke="#111" stroke-width="1.5" '
                     f'{dash} marker-end="url({marker})"/>')
            o.append(self.bg((xa + xb) / 2, y - 11, it['text'], 'middle'))
            o.append(self.t((xa + xb) / 2, y - 11, it['text']))
        o.append('</svg>')
        return ''.join(o)

    # ------------------------------------------------------------- draw.io
    def drawio(self, diagram_id):
        items, bottom = self.layout()
        esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
        W = int(PAD * 2 + COL_W * len(self.parts))
        cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>',
                 f'<mxCell id="title" value="{esc(self.title)}" style="text;html=1;align=center;fontSize=19;fontStyle=1;" vertex="1" parent="1">'
                 f'<mxGeometry x="0" y="10" width="{W}" height="30" as="geometry"/></mxCell>']
        for pid, label, kind, fill, stroke in self.parts:
            x = self.x(pid)
            if kind == 'actor':
                style = (f'shape=umlLifeline;participant=umlActor;perimeter=lifelinePerimeter;html=1;container=0;collapsible=0;'
                         f'verticalAlign=top;spacingTop=36;size=60;fillColor={fill};strokeColor=#111111;fontStyle=1;fontSize=14;')
            else:
                style = (f'shape=umlLifeline;perimeter=lifelinePerimeter;html=1;container=0;collapsible=0;size=56;'
                         f'fillColor={fill};strokeColor={stroke};fontStyle=1;fontSize=14;whiteSpace=wrap;')
            cells.append(f'<mxCell id="p_{pid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                         f'<mxGeometry x="{x - 100}" y="{TOP + 8}" width="200" height="{bottom - TOP - 8}" as="geometry"/></mxCell>')
        for i, it in enumerate(items):
            if it['kind'] == 'alt':
                x1, x2, y1, y2 = it['x1'], it['x2'], it['top'], it['bottom']
                cells.append(f'<mxCell id="alt{i}" value="alt" style="shape=umlFrame;whiteSpace=wrap;html=1;width=46;height=22;fontStyle=1;'
                             f'fillColor=none;strokeColor=#555555;" vertex="1" parent="1"><mxGeometry x="{x1}" y="{y1}" width="{x2 - x1}" '
                             f'height="{y2 - y1}" as="geometry"/></mxCell>')
                for gi, (guard, gy) in enumerate(it['guards']):
                    cells.append(f'<mxCell id="g{i}_{gi}" value="{esc("[" + guard + "]")}" style="text;html=1;align=left;fontStyle=2;fontSize=12;" '
                                 f'vertex="1" parent="1"><mxGeometry x="{x1 + 52}" y="{gy - 4}" width="{x2 - x1 - 60}" height="20" as="geometry"/></mxCell>')
                    if gi:
                        cells.append(f'<mxCell id="d{i}_{gi}" style="endArrow=none;dashed=1;html=1;strokeColor=#555555;" edge="1" parent="1">'
                                     f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1}" y="{gy - 6}" as="sourcePoint"/>'
                                     f'<mxPoint x="{x2}" y="{gy - 6}" as="targetPoint"/></mxGeometry></mxCell>')
                continue
            xa, xb, y = self.x(it['a']), self.x(it['b']), it['y']
            if it['kind'] == 'self':
                pts = f'<Array as="points"><mxPoint x="{xa + 46}" y="{y - 8}"/><mxPoint x="{xa + 46}" y="{y + 18}"/></Array>'
                src, dst = (xa, y - 8), (xa + 2, y + 18)
                style = 'html=1;endArrow=block;endFill=1;align=left;spacingLeft=52;'
            else:
                pts, src, dst = '', (xa, y), (xb, y)
                style = ('html=1;endArrow=open;dashed=1;endSize=10;verticalAlign=bottom;' if it['kind'] == 'ret'
                         else 'html=1;endArrow=block;endFill=1;verticalAlign=bottom;')
            cells.append(f'<mxCell id="m{i}" value="{esc(it["text"])}" style="{style}fontSize=13;strokeColor=#111111;labelBackgroundColor=none;" '
                         f'edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{src[0]}" y="{src[1]}" as="sourcePoint"/>'
                         f'<mxPoint x="{dst[0]}" y="{dst[1]}" as="targetPoint"/>{pts}</mxGeometry></mxCell>')
        H = int(bottom + 30)
        return (f'<mxfile host="HealthNexus-generator"><diagram id="{diagram_id}" name="{esc(self.title)}">'
                f'<mxGraphModel grid="0" page="1" pageWidth="{W}" pageHeight="{H}" background="#ffffff"><root>'
                + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')
