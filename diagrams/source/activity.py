"""Swimlane activity diagrams for HealthNexus BD -> SVG (for PNG) + editable .drawio.

Nodes sit on a (lane, row) grid. Edges are orthogonal: 'v' (straight down/up in a lane),
'h' (straight across a row), 'hv' (across at the source row, then down/up into the target),
'vh' (down/up in the source lane, then across into the target), or 'loop' (out of the
side, along the lane edge, back into the target's side). A checker reports any edge that
passes through a node it doesn't connect.
"""
import html
from dataclasses import dataclass, field

LANE_W, HEAD_H, ROW_H, TOP = 460, 56, 92, 40
AW, AH = 290, 54     # action
DW, DH = 200, 84     # decision
BAR_W = 330          # merge / choice bar
FONT = 'Helvetica, Arial, sans-serif'


@dataclass
class Node:
    id: str
    kind: str          # start | end | action | decision | bar
    lane: int
    row: float
    text: str = ''
    dx: float = 0      # nudge inside the lane


@dataclass
class Edge:
    a: str
    b: str
    label: str = ''
    mode: str = 'auto'
    side: str = 'right'      # for loops / which side to leave a decision
    off: float = 0           # loop distance from the node
    pts: list = field(default_factory=list)  # computed
    via: list = field(default_factory=list)  # bend points for mode='via'


class Diagram:
    def __init__(self, title, lanes):
        self.title, self.lanes = title, lanes   # lanes: [(name, fill, header[, width])]
        self.lw = [l[3] if len(l) > 3 else LANE_W for l in lanes]
        self.lx = [sum(self.lw[:i]) for i in range(len(lanes))]
        self.nodes, self.edges = {}, []

    # ------------------------------------------------------------- building
    def n(self, id, kind, lane, row, text='', dx=0):
        self.nodes[id] = Node(id, kind, lane, row, text, dx)

    def e(self, a, b, label='', mode='auto', side='right', off=0, via=()):
        self.edges.append(Edge(a, b, label, mode, side, off, via=list(via)))

    # ------------------------------------------------------------- geometry
    def cx(self, n):
        return self.lx[n.lane] + self.lw[n.lane] / 2 + n.dx

    def cy(self, n):
        return TOP + HEAD_H + 40 + n.row * ROW_H

    def size(self, n):
        if n.kind == 'bar':
            return (float(n.text) if n.text else BAR_W), 10
        return {'start': (30, 30), 'end': (34, 34), 'action': (AW, AH), 'decision': (DW, DH)}[n.kind]

    def box(self, n):
        w, h = self.size(n)
        return self.cx(n) - w / 2, self.cy(n) - h / 2, self.cx(n) + w / 2, self.cy(n) + h / 2

    def port(self, n, side):
        x1, y1, x2, y2 = self.box(n)
        cx, cy = self.cx(n), self.cy(n)
        return {'top': (cx, y1), 'bottom': (cx, y2), 'left': (x1, cy), 'right': (x2, cy)}[side]

    def route(self, e):
        A, B = self.nodes[e.a], self.nodes[e.b]
        ax, ay, bx, by = self.cx(A), self.cy(A), self.cx(B), self.cy(B)
        mode = e.mode
        if mode == 'auto':
            if A.lane == B.lane and abs(ax - bx) < 1:
                mode = 'v' if by > ay else 'loop'
            elif abs(ay - by) < 1:
                mode = 'h'
            else:
                mode = 'hv'
        if mode == 'v':
            down = by > ay
            return [self.port(A, 'bottom' if down else 'top'), self.port(B, 'top' if down else 'bottom')]
        if mode == 'h':
            right = bx > ax
            return [self.port(A, 'right' if right else 'left'), self.port(B, 'left' if right else 'right')]
        if mode == 'hv':
            right = bx > ax
            p0 = self.port(A, 'right' if right else 'left')
            down = by > ay
            p2 = self.port(B, 'top' if down else 'bottom')
            return [p0, (bx, p0[1]), p2]
        if mode == 'vh':
            down = by > ay
            p0 = self.port(A, 'bottom' if down else 'top')
            right = bx > ax
            p2 = self.port(B, 'left' if right else 'right')
            return [p0, (ax, p2[1]), p2]
        if mode == 'loop':
            side = e.side
            p0 = self.port(A, side)
            p2 = self.port(B, side)
            sign = 1 if side == 'right' else -1
            x = max(p0[0], p2[0]) + 34 + e.off if side == 'right' else min(p0[0], p2[0]) - 34 - e.off
            return [p0, (x, p0[1]), (x, p2[1]), p2]
        if mode == 'via':           # explicit bend points between two given ports
            return [self.port(A, e.side.split('>')[0])] + list(e.via) + [self.port(B, e.side.split('>')[1])]
        if mode == 'drop':          # straight down at the TARGET's x (out of a wide bar)
            return [(bx, self.box(A)[3]), self.port(B, 'top')]
        if mode == 'join':          # straight down at the SOURCE's x (into a wide bar)
            return [self.port(A, 'bottom'), (ax, self.box(B)[1])]
        if mode == 'down-across':   # leave the bottom, go down to the target row, then across
            p0 = self.port(A, 'bottom')
            right = bx > ax
            p2 = self.port(B, 'left' if right else 'right')
            return [p0, (ax, by), p2]
        if mode == 'side-down':     # leave a decision's side, then down into the target's top
            p0 = self.port(A, e.side)
            p2 = self.port(B, 'top' if by > ay else 'bottom')
            return [p0, (bx, p0[1]), p2]
        raise ValueError(mode)

    # ------------------------------------------------------------- checks
    def collisions(self):
        hits = []
        for e in self.edges:
            pts = self.route(e)
            for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
                for n in self.nodes.values():
                    if n.id in (e.a, e.b):
                        continue
                    bx1, by1, bx2, by2 = self.box(n)
                    for i in range(1, 50):
                        t = i / 50
                        x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
                        if bx1 + 2 < x < bx2 - 2 and by1 + 2 < y < by2 - 2:
                            hits.append(f'{e.a}->{e.b} crosses {n.id}')
                            break
        return sorted(set(hits))

    # ------------------------------------------------------------- SVG
    def height(self):
        return int(max(self.cy(n) for n in self.nodes.values()) + 90)

    def width(self):
        return sum(self.lw)

    @staticmethod
    def text(x, y, s, size=14, weight='bold', anchor='middle', color='#111'):
        lines = s.split('\n')
        lh = size * 1.2
        y0 = y - (len(lines) - 1) * lh / 2
        return ''.join(f'<text x="{x:.1f}" y="{y0 + i * lh:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" '
                       f'fill="{color}" text-anchor="{anchor}" dominant-baseline="central">{html.escape(l)}</text>'
                       for i, l in enumerate(lines))

    def svg(self):
        W, H = self.width(), self.height() + TOP + 10
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
             '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto">'
             '<path d="M0,0 L10,5 L0,10 z" fill="#222"/></marker></defs>',
             f'<rect width="{W}" height="{H}" fill="#fff"/>',
             self.text(W / 2, 20, self.title, size=19)]
        for i, (name, fill, head, *_) in enumerate(self.lanes):
            x, lw = self.lx[i], self.lw[i]
            o.append(f'<rect x="{x}" y="{TOP}" width="{lw}" height="{H - TOP - 6}" fill="{fill}" stroke="#bbb"/>')
            o.append(f'<rect x="{x}" y="{TOP}" width="{lw}" height="{HEAD_H}" fill="{head}" stroke="#bbb"/>')
            o.append(self.text(x + lw / 2, TOP + HEAD_H / 2, name.upper(), size=17, color='#fff'))
        for e in self.edges:
            pts = self.route(e)
            d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
            o.append(f'<polyline points="{d}" fill="none" stroke="#222" stroke-width="1.6" marker-end="url(#arr)"/>')
            if e.label:
                (x1, y1), (x2, y2) = pts[0], pts[1]
                horizontal = abs(y2 - y1) < 1
                lx, ly = (x1 + (16 if x2 > x1 else -16), y1 - 11) if horizontal else (x1 + 22, y1 + 16)
                anchor = ('start' if x2 > x1 else 'end') if horizontal else 'start'
                o.append(self.text(lx, ly, e.label, size=13, anchor=anchor, color='#b00020' if e.label == 'No' else '#0a6b2c'))
        for n in self.nodes.values():
            x1, y1, x2, y2 = self.box(n)
            cx, cy = self.cx(n), self.cy(n)
            if n.kind == 'start':
                o.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="#111"/>')
            elif n.kind == 'end':
                o.append(f'<circle cx="{cx}" cy="{cy}" r="17" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="{cx}" cy="{cy}" r="11" fill="#111"/>')
            elif n.kind == 'action':
                o.append(f'<rect x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" rx="16" fill="#fff" stroke="#222" stroke-width="1.6"/>')
                o.append(self.text(cx, cy, n.text, size=14))
            elif n.kind == 'decision':
                o.append(f'<polygon points="{cx},{y1} {x2},{cy} {cx},{y2} {x1},{cy}" fill="#fffbe6" stroke="#222" stroke-width="1.6"/>')
                o.append(self.text(cx, cy, n.text, size=13))
            elif n.kind == 'bar':
                o.append(f'<rect x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" fill="#222"/>')
        o.append('</svg>')
        return ''.join(o)

    # ------------------------------------------------------------- draw.io
    def drawio(self, diagram_id):
        esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
        cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
        H = self.height() + TOP + 10
        cells.append(f'<mxCell id="title" value="{esc(self.title)}" style="text;html=1;align=center;fontSize=19;fontStyle=1;" vertex="1" parent="1">'
                     f'<mxGeometry x="0" y="4" width="{self.width()}" height="30" as="geometry"/></mxCell>')
        for i, (name, fill, head, *_) in enumerate(self.lanes):
            cells.append(f'<mxCell id="lane{i}" value="{esc(name.upper())}" style="swimlane;html=1;startSize={HEAD_H};fillColor={head};'
                         f'swimlaneFillColor={fill};fontColor=#ffffff;fontSize=17;fontStyle=1;strokeColor=#bbbbbb;" vertex="1" parent="1">'
                         f'<mxGeometry x="{self.lx[i]}" y="{TOP}" width="{self.lw[i]}" height="{H - TOP - 6}" as="geometry"/></mxCell>')
        for n in self.nodes.values():
            x1, y1, x2, y2 = self.box(n)
            style = {
                'start': 'ellipse;fillColor=#111111;strokeColor=#111111;',
                'end': 'ellipse;shape=endState;fillColor=#111111;strokeColor=#111111;',
                'action': 'rounded=1;arcSize=30;whiteSpace=wrap;html=1;fontSize=14;fontStyle=1;fillColor=#ffffff;strokeColor=#222222;',
                'decision': 'rhombus;whiteSpace=wrap;html=1;fontSize=13;fontStyle=1;fillColor=#fffbe6;strokeColor=#222222;',
                'bar': 'shape=line;strokeWidth=10;strokeColor=#222222;',
            }[n.kind]
            cells.append(f'<mxCell id="{n.id}" value="{"" if n.kind == "bar" else esc(n.text)}" style="{style}" vertex="1" parent="1">'
                         f'<mxGeometry x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" as="geometry"/></mxCell>')
        for i, e in enumerate(self.edges):
            pts = self.route(e)
            (sx, sy), (tx, ty) = pts[0], pts[-1]
            A, B = self.nodes[e.a], self.nodes[e.b]
            ax1, ay1, ax2, ay2 = self.box(A)
            bx1, by1, bx2, by2 = self.box(B)
            ex, ey = (sx - ax1) / (ax2 - ax1), (sy - ay1) / (ay2 - ay1)
            nx, ny = (tx - bx1) / (bx2 - bx1), (ty - by1) / (by2 - by1)
            way = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
            color = '#b00020' if e.label == 'No' else '#0a6b2c'
            cells.append(f'<mxCell id="e{i}" value="{esc(e.label)}" style="edgeStyle=none;html=1;endArrow=block;endFill=1;strokeColor=#222222;'
                         f'fontSize=13;fontStyle=1;fontColor={color};labelBackgroundColor=#ffffff;exitX={ex:.3f};exitY={ey:.3f};exitDx=0;exitDy=0;'
                         f'entryX={nx:.3f};entryY={ny:.3f};entryDx=0;entryDy=0;" edge="1" parent="1" source="{e.a}" target="{e.b}">'
                         f'<mxGeometry relative="1" as="geometry"><Array as="points">{way}</Array></mxGeometry></mxCell>')
        return (f'<mxfile host="HealthNexus-generator"><diagram id="{diagram_id}" name="{esc(self.title)}">'
                f'<mxGraphModel grid="0" page="1" pageWidth="{self.width()}" pageHeight="{H}" background="#ffffff"><root>'
                + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')
