"""HealthNexus BD ER diagram (plain draw.io style, large text), generated from backend/prisma/schema.prisma (crow's-foot notation).

Everything shown is read from the schema: table and column names (@map/@@map), PostgreSQL
types, PK / FK / UK, nullability, and each relationship's cardinality (from whether the FK
is nullable and/or unique). Only the positions and line routes are hand-placed.
Usage: python erd.py <schema.prisma> <out_dir>
"""
import html, re, sys
from pathlib import Path

SCHEMA, OUT = Path(sys.argv[1]), Path(sys.argv[2])
# Live column counts (information_schema, Neon) — the parsed schema must match them.
LIVE = {'access_sessions': 6, 'admins': 4, 'ai_summaries': 8, 'audit_logs': 7, 'diagnostic_labs': 6,
        'doctor_registry': 7, 'doctors': 7, 'lab_registry': 7, 'lab_reports': 8, 'medical_records': 10,
        'notifications': 8, 'otp_tokens': 10, 'password_reset_tokens': 7, 'patients': 11,
        'prescriptions': 6, 'users': 9}

# ================================================================ parse schema.prisma
src = SCHEMA.read_text(encoding='utf-8')
src = re.sub(r'//[^\n]*', '', src)
ENUMS = {m.group(1): m.group(2).split() for m in re.finditer(r'enum (\w+) \{([^}]*)\}', src)}
SCALARS = {'String', 'Int', 'Boolean', 'DateTime', 'Json', 'Float', 'Decimal', 'BigInt'}
models, tables, relations = {}, {}, []
for m in re.finditer(r'model (\w+) \{(.*?)\n\}', src, re.S):
    name, body = m.group(1), m.group(2)
    table = re.search(r'@@map\("(\w+)"\)', body).group(1)
    models[name] = table
    cols, rels = [], []
    for line in body.splitlines():
        line = line.strip()
        if not line or line.startswith('@@'):
            continue
        parts = line.split()
        field, ftype = parts[0], parts[1]
        base = ftype.rstrip('?[]')
        if base in SCALARS or base in ENUMS:
            col = re.search(r'@map\("(\w+)"\)', line)
            dbt = re.search(r'@db\.(\w+)', line)
            if base in ENUMS:
                pg = base
            elif dbt:
                pg = {'Uuid': 'uuid', 'Timestamptz': 'timestamptz', 'Date': 'date', 'SmallInt': 'smallint',
                      'Inet': 'inet'}[dbt.group(1)]
            else:
                pg = {'String': 'text', 'Int': 'integer', 'Boolean': 'boolean', 'Json': 'jsonb',
                      'DateTime': 'timestamp'}[base]
            cols.append({'field': field, 'name': col.group(1) if col else field, 'type': pg,
                         'null': ftype.endswith('?'), 'pk': '@id' in line, 'uk': '@unique' in line, 'fk': False})
        rel = re.search(r'@relation\((?:"\w+",\s*)?fields: \[(\w+)\], references: \[(\w+)\]', line)
        if rel:
            rels.append((rel.group(1), base))
    tables[table] = {'model': name, 'cols': cols}
    for fk_field, parent_model in rels:
        c = next(c for c in cols if c['field'] == fk_field)
        c['fk'] = True
        relations.append({'child': table, 'col': c['name'], 'parent_model': parent_model,
                          'nullable': c['null'], 'unique': c['uk']})
for r in relations:
    r['parent'] = models[r['parent_model']]
for t, n in LIVE.items():
    assert len(tables[t]['cols']) == n, f'{t}: schema {len(tables[t]["cols"])} cols, live {n}'
assert set(tables) == set(LIVE), 'table set differs from the live database'
# Logical references (columns that point at users.id with no FK constraint in the database).
LOGICAL = [('doctor_registry', 'claimed_by_user_id'), ('lab_registry', 'claimed_by_user_id')]

# ================================================================ layout (4 columns, tables stacked)
FS = 17
HEAD, ROW = 34, 26
GAP_Y, TOP, LEFT, MARK = 64, 10, 10, 30      # MARK: straight run needed for a crow's-foot marker
KEY_W = 62
COLS = [
    ['admins', 'password_reset_tokens', 'audit_logs', 'notifications'],
    ['doctor_registry', 'lab_registry', 'users', 'patients'],
    ['doctors', 'diagnostic_labs', 'access_sessions', 'otp_tokens'],
    ['medical_records', 'lab_reports', 'prescriptions', 'ai_summaries'],
]
COL_OF = {t: i for i, col in enumerate(COLS) for t in col}
NAME_W = {i: int(max(len(c['name']) for t in col for c in tables[t]['cols']) * FS * 0.5 + 16) for i, col in enumerate(COLS)}
TYPE_W = {i: int(max(len(c['type']) for t in col for c in tables[t]['cols']) * FS * 0.5 + 16) for i, col in enumerate(COLS)}
TWC = {i: max(KEY_W + NAME_W[i] + TYPE_W[i], max(len(t) for t in col) * FS * 0.6 + 30) for i, col in enumerate(COLS)}
YTOP = {}
COL_SHIFT = {1: 12}   # keeps users.id off the same height as a row it would run into
for ci, col in enumerate(COLS):
    y = TOP + COL_SHIFT.get(ci, 0)
    for t in col:
        YTOP[t] = y
        y += HEAD + ROW * len(tables[t]['cols']) + GAP_Y


def theight(t):
    return HEAD + ROW * len(tables[t]['cols'])


def row_y(t, name):
    i = next(i for i, c in enumerate(tables[t]['cols']) if c['name'] == name)
    return YTOP[t] + HEAD + ROW * i + ROW / 2


rel_of = {(r['child'], r['col']): r for r in relations}
# (child, column, parent, how[, side]) - how: adj | vert | same | two
LINKS = [
    ('admins', 'user_id', 'users', 'adj'),
    ('password_reset_tokens', 'user_id', 'users', 'adj'),
    ('audit_logs', 'actor_user_id', 'users', 'adj'),
    ('doctor_registry', 'claimed_by_user_id', 'users', 'same', 'left'),
    ('doctors', 'user_id', 'users', 'adj'),
    ('diagnostic_labs', 'user_id', 'users', 'adj'),
    ('patients', 'user_id', 'users', 'vert'),
    ('lab_registry', 'claimed_by_user_id', 'users', 'vert'),
    ('audit_logs', 'patient_id', 'patients', 'adj'),
    ('notifications', 'patient_id', 'patients', 'adj'),
    ('access_sessions', 'patient_id', 'patients', 'adj'),
    ('otp_tokens', 'patient_id', 'patients', 'adj'),
    ('medical_records', 'patient_id', 'patients', 'two'),
    ('lab_reports', 'patient_id', 'patients', 'two'),
    ('medical_records', 'doctor_id', 'doctors', 'adj'),
    ('access_sessions', 'doctor_id', 'doctors', 'same', 'right'),
    ('otp_tokens', 'doctor_id', 'doctors', 'same', 'right'),
    ('otp_tokens', 'session_id', 'access_sessions', 'same', 'right'),
    ('lab_reports', 'lab_id', 'diagnostic_labs', 'adj'),
    ('lab_reports', 'record_id', 'medical_records', 'same', 'right'),
    ('prescriptions', 'record_id', 'medical_records', 'same', 'right'),
    ('ai_summaries', 'record_id', 'medical_records', 'same', 'right'),
]
assert {(c, k) for c, k, *_ in LINKS} == set(rel_of) | set(LOGICAL), 'every FK and logical link needs a route'
for c, k, p, *_ in LINKS:
    assert (c, k) in LOGICAL or rel_of[(c, k)]['parent'] == p, f'{c}.{k} parent mismatch'

def cardinality(r):
    """(parent end, child end): parent || exactly one or o| zero-or-one; child o< many or o| at most one."""
    return ('o|' if r['nullable'] else '||'), ('o|' if r['unique'] else 'o<')


# --- parent attach rows: each parent side gets its own rows, starting at the id row
spec = []
for c, k, p, how, *side in LINKS:
    pc, cc = COL_OF[p], COL_OF[c]
    if how in ('adj', 'two'):
        ps = 'right' if cc > pc else 'left'
    elif how == 'same':
        ps = side[0]
    else:
        ps = 'vert'
    spec.append({'child': c, 'col': k, 'parent': p, 'how': how, 'pside': ps, 'yc': row_y(c, k),
                 'logical': (c, k) in LOGICAL})
def parent_mark(s):
    return '||' if s['logical'] else cardinality(rel_of[(s['child'], s['col'])])[0]


# Every line leaves its parent from the PK (id) row, so no line seems to point at another column.
# Lines with the same parent marker share one start point (drawn as one marker); a different marker
# on the same side starts a few pixels above/below it, still inside the id row.
for (p, ps) in {(s['parent'], s['pside']) for s in spec if s['pside'] != 'vert'}:
    side = [s for s in spec if s['parent'] == p and s['pside'] == ps]
    marks = sorted({parent_mark(s) for s in side}, key=lambda m: m != '||')
    for s in side:
        i = marks.index(parent_mark(s))
        s['yp'] = YTOP[p] + HEAD + ROW / 2 + (i - (len(marks) - 1) / 2) * 10

# --- vertical runs per gap (gap g lies left of column g; gap 4 = right margin)
CHANNEL = YTOP['access_sessions'] - GAP_Y / 2       # horizontal pass between diagnostic_labs and access_sessions
runs = []
two_i = 0
for s in spec:
    pc, cc = COL_OF[s['parent']], COL_OF[s['child']]
    if s['how'] == 'adj':
        runs.append((max(pc, cc), s, 0, s['yp'], s['yc']))
    elif s['how'] == 'same':
        runs.append((pc if s['pside'] == 'left' else pc + 1, s, 0, s['yp'], s['yc']))
    elif s['how'] == 'two':
        s['ych'] = CHANNEL + (two_i * 14 - 7)
        two_i += 1
        runs.append((pc + 1, s, 0, s['yp'], s['ych']))
        runs.append((cc, s, 1, s['ych'], s['yc']))
lanes = {}
for g in sorted({r[0] for r in runs}):
    taken = []
    for _, s, leg, a, b in sorted((r for r in runs if r[0] == g), key=lambda r: -abs(r[3] - r[4])):
        lo, hi = min(a, b) - 14, max(a, b) + 14
        for li, iv in enumerate(taken):
            if all(hi < l or lo > h for l, h in iv):
                iv.append((lo, hi))
                break
        else:
            li = len(taken)
            taken.append([(lo, hi)])
        s.setdefault('lane', {})[leg] = (g, li)
    lanes[g] = len(taken)
LANE_GAP = 22
GAPW = {g: MARK * 2 + 16 + LANE_GAP * (lanes.get(g, 1) - 1) for g in range(1, 4)}
GAPW[0] = MARK + 16 + LANE_GAP * (lanes[0] - 1) if 0 in lanes else LEFT
GAPW[4] = MARK + 16 + LANE_GAP * (lanes[4] - 1) if 4 in lanes else LEFT
XL = {}
x = GAPW[0]
for i in range(4):
    XL[i] = x
    x += TWC[i] + GAPW[i + 1]
W = int(x)
H = int(max(YTOP[t] + theight(t) for t in tables) + TOP)


def box(t):
    x1, y1 = XL[COL_OF[t]], YTOP[t]
    return x1, y1, x1 + TWC[COL_OF[t]], y1 + theight(t)


def lane_x(g, li):
    if g == 0:
        return GAPW[0] - MARK - li * LANE_GAP
    return XL[g - 1] + TWC[g - 1] + MARK + 8 + li * LANE_GAP


def side_x(t, side):
    x1, _, x2, _ = box(t)
    return x1 if side == 'left' else x2


for s in spec:
    p, c = s['parent'], s['child']
    if s['how'] == 'vert':
        xm = (box(p)[0] + box(p)[2]) / 2
        if YTOP[p] < YTOP[c]:
            s['pts'] = [(xm, box(p)[3]), (xm, box(c)[1])]
        else:
            s['pts'] = [(xm, box(p)[1]), (xm, box(c)[3])]
        continue
    cside = s['pside'] if s['how'] == 'same' else ('left' if s['pside'] == 'right' else 'right')
    P, C = (side_x(p, s['pside']), s['yp']), (side_x(c, cside), s['yc'])
    if s['how'] == 'two':
        x1, x2 = lane_x(*s['lane'][0]), lane_x(*s['lane'][1])
        s['pts'] = [P, (x1, P[1]), (x1, s['ych']), (x2, s['ych']), (x2, C[1]), C]
    elif abs(P[1] - C[1]) > 0.5:
        lx = lane_x(*s['lane'][0])
        s['pts'] = [P, (lx, P[1]), (lx, C[1]), C]
    else:
        s['pts'] = [P, C]


# ================================================================ checks
def overlap(a1, b1, a2, b2):
    return min(max(a1, b1), max(a2, b2)) - max(min(a1, b1), min(a2, b2))


def problems():
    out = []
    for s in spec:
        name = f"{s['parent']}->{s['child']}.{s['col']}"
        pts = s['pts']
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            for t in tables:
                if t in (s['parent'], s['child']):
                    continue
                bx1, by1, bx2, by2 = box(t)
                for i in range(1, 80):
                    x, y = x1 + (x2 - x1) * i / 80, y1 + (y2 - y1) * i / 80
                    if bx1 - 3 < x < bx2 + 3 and by1 - 3 < y < by2 + 3:
                        out.append(f'{name} crosses {t}')
                        break
        for a, b in ((pts[0], pts[1]), (pts[-1], pts[-2])):
            if not s['logical'] and abs(a[0] - b[0]) + abs(a[1] - b[1]) < MARK - 2:
                out.append(f'{name}: no room for the marker')
    segs = [(s, a, b) for s in spec for a, b in zip(s['pts'], s['pts'][1:])]
    for i, (s1, a1, b1) in enumerate(segs):
        for s2, a2, b2 in segs[i + 1:]:
            if s1 is s2:
                continue
            if a1 == a2 == s1['pts'][0] == s2['pts'][0]:   # shared start at the same PK row: drawn as one line
                continue
            vert = abs(a1[0] - b1[0]) < .5 and abs(a2[0] - b2[0]) < .5 and abs(a1[0] - a2[0]) < 6
            horiz = abs(a1[1] - b1[1]) < .5 and abs(a2[1] - b2[1]) < .5 and abs(a1[1] - a2[1]) < 6
            if vert and overlap(a1[1], b1[1], a2[1], b2[1]) > 2 or horiz and overlap(a1[0], b1[0], a2[0], b2[0]) > 2:
                out.append(f"{s1['child']}.{s1['col']} runs on top of {s2['child']}.{s2['col']}")
    return out


# ================================================================ draw.io
def drawio():
    esc = lambda s: html.escape(s, quote=True)
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for t, info in tables.items():
        x1, y1, x2, y2 = box(t)
        cells.append(f'<mxCell id="t_{t}" value="{esc(t)}" style="shape=table;startSize={HEAD};container=1;collapsible=0;'
                     f'childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;html=1;fontSize={FS};" '
                     f'vertex="1" parent="1"><mxGeometry x="{x1}" y="{y1}" width="{x2 - x1}" height="{y2 - y1}" as="geometry"/></mxCell>')
        k = COL_OF[t]
        nw, tw = NAME_W[k], x2 - x1 - KEY_W - NAME_W[k]
        for i, c in enumerate(info['cols']):
            keys = ','.join(k for k, on in (('PK', c['pk']), ('FK', c['fk']), ('UK', c['uk'] and not c['pk'])) if on)
            rid = f'r_{t}_{i}'
            cells.append(f'<mxCell id="{rid}" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;'
                         f'collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;'
                         f'bottom={1 if c["pk"] else 0};html=1;" vertex="1" parent="t_{t}"><mxGeometry y="{HEAD + i * ROW}" width="{x2 - x1}" '
                         f'height="{ROW}" as="geometry"/></mxCell>')
            parts = [(keys, KEY_W, 0, f'fontStyle=1;fontSize={FS - 3};'), (c['name'], nw, KEY_W, 'align=left;spacingLeft=4;'),
                     (c['type'], tw, KEY_W + nw, 'align=left;spacingLeft=4;')]
            for j, (val, w, x0, extra) in enumerate(parts):
                cells.append(f'<mxCell id="{rid}c{j}" value="{esc(val)}" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;'
                             f'left=0;bottom=0;right=0;overflow=hidden;html=1;fontSize={FS - 1};{extra}" vertex="1" parent="{rid}">'
                             f'<mxGeometry x="{x0}" width="{w}" height="{ROW}" as="geometry"/></mxCell>')
    arrow = {'||': 'ERmandOne', 'o|': 'ERzeroToOne', 'o<': 'ERzeroToMany'}
    for i, s in enumerate(spec):
        pts = s['pts']
        way = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
        if s['logical']:
            style = 'edgeStyle=none;html=1;rounded=0;dashed=1;endArrow=none;startArrow=none;'
        else:
            pm, cm = cardinality(rel_of[(s['child'], s['col'])])
            style = (f'edgeStyle=none;html=1;rounded=0;startArrow={arrow[pm]};endArrow={arrow[cm]};startFill=0;endFill=0;'
                     f'startSize=11;endSize=11;')
        cells.append(f'<mxCell id="rel{i}" style="{style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
                     f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/><mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
                     f'<Array as="points">{way}</Array></mxGeometry></mxCell>')
    return (f'<mxfile host="app.diagrams.net"><diagram id="erd" name="ERD"><mxGraphModel grid="1" gridSize="10" page="1" '
            f'pageWidth="{W}" pageHeight="{H}" math="0" shadow="0"><root>' + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')


OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'ERD.drawio').write_text(drawio(), encoding='utf-8')
print(f'tables {len(tables)} | columns {sum(len(t["cols"]) for t in tables.values())} | FKs {len(relations)} | '
      f'canvas {W}x{H} | table widths {TWC} | lanes {lanes}')
for r in relations:
    pm, cm = cardinality(r)
    print(f'  {r["parent"]:<16} {pm}--{cm} {r["child"]}.{r["col"]}')
hits = problems()
print('problems:', len(hits), *[f'\n  {h}' for h in hits])
