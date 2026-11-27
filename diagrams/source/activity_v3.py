"""Swimlane activity diagram engine (plain draw.io output) for HealthNexus BD.

Nodes sit on a (lane, row) grid. Edges are orthogonal: 'v' (straight down/up in a lane),
'h' (straight across a row), 'hv' (across at the source row, then down/up into the target),
'vh' (down/up in the source lane, then across into the target), or 'loop' (out of the
side, along the lane edge, back into the target's side). A checker reports any edge that
passes through a node it doesn't connect.
"""
import html
from dataclasses import dataclass, field

FS = 22             # font size (large so it prints at a readable size)
LANE_W, HEAD_H, ROW_H, TOP = 460, 44, 104, 0
AW, AH = 300, 70     # action
DW, DH = 280, 112    # decision
BAR_W = 330          # merge / choice bar


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

    def overlaps(self):
        out, ns = [], list(self.nodes.values())
        for i, a in enumerate(ns):
            for b in ns[i + 1:]:
                ax1, ay1, ax2, ay2 = self.box(a)
                bx1, by1, bx2, by2 = self.box(b)
                if ax1 < bx2 + 12 and bx1 < ax2 + 12 and ay1 < by2 + 12 and by1 < ay2 + 12:
                    out.append(f'{a.id} overlaps {b.id}')
        for n in ns:
            x1, _, x2, _ = self.box(n)
            lx = self.lx[n.lane]
            if x1 < lx + 6 or x2 > lx + self.lw[n.lane] - 6:
                out.append(f'{n.id} leaves its lane')
        return out

    def height(self):
        return int(max(self.cy(n) for n in self.nodes.values()) + 70)

    def width(self):
        return sum(self.lw)

    # ------------------------------------------------------------- draw.io
    def drawio(self, diagram_id):
        esc = lambda s: html.escape(s).replace('\n', '&lt;br&gt;')
        cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
        H = self.height()
        for i, (name, *_) in enumerate(self.lanes):
            cells.append(f'<mxCell id="lane{i}" value="{esc(name)}" style="swimlane;html=1;startSize={HEAD_H};fontSize={FS};" '
                         f'vertex="1" parent="1"><mxGeometry x="{self.lx[i]}" y="{TOP}" width="{self.lw[i]}" height="{H - TOP}" as="geometry"/></mxCell>')
        for n in self.nodes.values():
            x1, y1, x2, y2 = self.box(n)
            style = {
                'start': 'ellipse;html=1;fillColor=#000000;strokeColor=#000000;',
                'end': 'ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;',
                'action': f'rounded=1;whiteSpace=wrap;html=1;fontSize={FS};',
                'decision': f'rhombus;whiteSpace=wrap;html=1;fontSize={FS};',
                'bar': 'rounded=0;html=1;fillColor=#000000;strokeColor=#000000;',
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
            # guard label just beside the start of the edge (not on top of a short arrow)
            (x0, y0), (x1_, y1_) = pts[0], pts[1]
            if abs(y1_ - y0) < 1:
                off = (28 if x1_ > x0 else -28, -14)
            else:
                off = (20, 16 if y1_ > y0 else -16)
            label_geo = f'x="-1" ' if e.label else ''
            label_off = f'<mxPoint x="{off[0]}" y="{off[1]}" as="offset"/>' if e.label else ''
            cells.append(f'<mxCell id="e{i}" value="{esc(e.label)}" style="edgeStyle=none;html=1;endArrow=classic;endSize=9;rounded=0;'
                         f'fontSize={FS - 2};labelBackgroundColor=#ffffff;exitX={ex:.3f};exitY={ey:.3f};exitDx=0;exitDy=0;'
                         f'entryX={nx:.3f};entryY={ny:.3f};entryDx=0;entryDy=0;" edge="1" parent="1" source="{e.a}" target="{e.b}">'
                         f'<mxGeometry {label_geo}relative="1" as="geometry"><Array as="points">{way}</Array>{label_off}'
                         f'</mxGeometry></mxCell>')
        return (f'<mxfile host="HealthNexus-generator"><diagram id="{diagram_id}" name="{esc(self.title)}">'
                f'<mxGraphModel grid="0" page="1" pageWidth="{self.width()}" pageHeight="{H}" background="#ffffff"><root>'
                + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')
