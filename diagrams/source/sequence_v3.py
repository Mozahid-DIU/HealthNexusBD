"""UML sequence diagram engine (plain draw.io output) for HealthNexus BD.

Participants are actors (stick figures) or boxes. Steps, in order:
  msg(a, b, text)   call (solid line, filled arrow)
  ret(a, b, text)   reply (dashed line, open arrow)
  selfc(a, text)    a call to itself
  alt([(guard, [steps...]), ...])   an 'alt' frame with one section per guard
check() reports labels that don't fit between their lifelines.
"""
import html

FS = 20
TOP, HEAD_H, STEP, PAD = 10, 76, 54, 30
CHAR = FS * 0.52      # average character width


class Seq:
    def __init__(self, name, participants, col_w=300):
        self.name, self.parts, self.col_w = name, participants, col_w   # participants: [(id, label, kind)]
        self.idx = {p[0]: i for i, p in enumerate(participants)}
        self.steps = []

    msg = staticmethod(lambda a, b, text: ('msg', a, b, text))
    ret = staticmethod(lambda a, b, text: ('ret', a, b, text))
    selfc = staticmethod(lambda a, text: ('self', a, a, text))
    alt = staticmethod(lambda sections: ('alt', sections))

    def add(self, *steps):
        self.steps.extend(steps)

    def x(self, pid):
        return PAD + self.col_w / 2 + self.idx[pid] * self.col_w

    def width(self):
        return int(PAD * 2 + self.col_w * len(self.parts))

    def involved(self, alt):
        ids = set()
        for _, sub in alt[1]:
            for s in sub:
                ids |= self.involved(s) if s[0] == 'alt' else {s[1], s[2]}
        return ids

    def layout(self):
        items, y = [], TOP + HEAD_H + 60

        def walk(steps, depth):
            nonlocal y
            for s in steps:
                if s[0] != 'alt':
                    items.append({'kind': s[0], 'a': s[1], 'b': s[2], 'text': s[3], 'y': y})
                    y += STEP + (22 if s[0] == 'self' else 0)
                    continue
                xs = [self.x(p) for p in self.involved(s)]
                pad = self.col_w * 0.42 + depth * 12
                frame = {'kind': 'alt', 'top': y - 36, 'x1': min(xs) - pad, 'x2': max(xs) + pad, 'guards': []}
                items.append(frame)
                for gi, (guard, sub) in enumerate(s[1]):
                    if gi == 0:
                        frame['guards'].append((guard, None, frame['top'] + 4))
                        y = frame['top'] + 4 + 26 + 36
                    else:
                        sep = y - 18
                        frame['guards'].append((guard, sep, sep + 4))
                        y = sep + 4 + 26 + 36
                    walk(sub, depth + 1)
                frame['bottom'] = y - 20
                y += 30

        walk(self.steps, 0)
        return items, y

    def check(self):
        out = []
        for it in self.layout()[0]:
            if it['kind'] == 'alt':
                continue
            longest = max(len(l) for l in it['text'].split('\n')) * CHAR
            room = self.col_w - 64 if it['kind'] == 'self' else abs(self.x(it['b']) - self.x(it['a'])) - 24
            if longest > room:
                out.append(f'"{it["text"]}" is {longest:.0f}px, room {room:.0f}px')
        return out

    def drawio(self):
        items, bottom = self.layout()
        esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
        cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
        for pid, label, kind in self.parts:
            x = self.x(pid)
            if kind == 'actor':
                style = (f'shape=umlLifeline;participant=umlActor;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;'
                         f'collapsible=0;recursiveResize=0;verticalAlign=top;spacingTop={HEAD_H - 22};outlineConnect=0;'
                         f'size={HEAD_H - 24};fontSize={FS};labelBackgroundColor=#ffffff;')
                geo = f'x="{x - 18}" y="{TOP}" width="36" height="{bottom - TOP}"'
            else:
                style = (f'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;'
                         f'recursiveResize=0;outlineConnect=0;size=50;fontSize={FS};')
                geo = f'x="{x - 90}" y="{TOP + 8}" width="180" height="{bottom - TOP - 8}"'
            cells.append(f'<mxCell id="p_{pid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                         f'<mxGeometry {geo} as="geometry"/></mxCell>')
        for i, it in enumerate(items):
            if it['kind'] == 'alt':
                x1, x2, y1, y2 = it['x1'], it['x2'], it['top'], it['bottom']
                cells.append(f'<mxCell id="alt{i}" value="alt" style="shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;'
                             f'height=28;fontSize={FS - 2};" vertex="1" parent="1"><mxGeometry x="{x1:.0f}" y="{y1}" width="{x2 - x1:.0f}" '
                             f'height="{y2 - y1}" as="geometry"/></mxCell>')
                for gi, (guard, sep, gy) in enumerate(it['guards']):
                    gx = x1 + 70 if gi == 0 else x1 + 10
                    gw = (len(guard) + 2) * (FS - 2) * 0.52 + 12
                    cells.append(f'<mxCell id="g{i}_{gi}" value="{esc("[" + guard + "]")}" style="text;html=1;align=left;verticalAlign=middle;'
                                 f'fontSize={FS - 2};fillColor=#ffffff;spacingLeft=4;" vertex="1" parent="1"><mxGeometry x="{gx:.0f}" y="{gy}" width="{gw:.0f}" '
                                 f'height="24" as="geometry"/></mxCell>')
                    if sep is not None:
                        cells.append(f'<mxCell id="d{i}_{gi}" style="endArrow=none;dashed=1;html=1;" edge="1" parent="1">'
                                     f'<mxGeometry relative="1" as="geometry"><mxPoint x="{x1:.0f}" y="{sep}" as="sourcePoint"/>'
                                     f'<mxPoint x="{x2:.0f}" y="{sep}" as="targetPoint"/></mxGeometry></mxCell>')
                continue
            xa, xb, y = self.x(it['a']), self.x(it['b']), it['y']
            if it['kind'] == 'self':
                pts = f'<Array as="points"><mxPoint x="{xa + 40}" y="{y - 8}"/><mxPoint x="{xa + 40}" y="{y + 22}"/></Array>'
                src, dst = (xa, y - 8), (xa + 2, y + 22)
                style = 'html=1;endArrow=block;endFill=1;align=left;spacingLeft=46;labelBackgroundColor=#ffffff;'
            else:
                pts, src, dst = '', (xa, y), (xb, y)
                style = ('html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=10;' if it['kind'] == 'ret'
                         else 'html=1;verticalAlign=bottom;endArrow=block;endFill=1;')
            cells.append(f'<mxCell id="m{i}" value="{esc(it["text"])}" style="{style}fontSize={FS};" edge="1" parent="1">'
                         f'<mxGeometry relative="1" as="geometry"><mxPoint x="{src[0]}" y="{src[1]}" as="sourcePoint"/>'
                         f'<mxPoint x="{dst[0]}" y="{dst[1]}" as="targetPoint"/>{pts}</mxGeometry></mxCell>')
        W, H = self.width(), bottom + 10
        return (f'<mxfile host="app.diagrams.net"><diagram id="{self.name}" name="{esc(self.name)}">'
                f'<mxGraphModel grid="1" gridSize="10" page="1" pageWidth="{W}" pageHeight="{H}" math="0" shadow="0"><root>'
                + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')
