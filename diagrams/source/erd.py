"""HealthNexus BD ER diagram, generated from backend/prisma/schema.prisma (crow's-foot notation).

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

# ================================================================ layout
TW, HEAD, ROW = 330, 36, 23
C = [60, 480, 900, 1320, 1740, 2160]
POS = {
    'admins': (C[2], 80), 'users': (C[3], 80), 'doctor_registry': (C[4], 80), 'lab_registry': (C[5], 80),
    'password_reset_tokens': (C[2], 250),
    'patients': (C[1], 560), 'doctors': (C[3], 560), 'diagnostic_labs': (C[5], 560),
    'audit_logs': (C[0], 940), 'access_sessions': (C[2], 940), 'medical_records': (C[3], 940),
    'lab_reports': (C[5], 940),
    'notifications': (C[0], 1230), 'otp_tokens': (C[2], 1310), 'prescriptions': (C[3], 1320),
    'ai_summaries': (C[4], 1320),
}
TITLE = {'audit_logs': 'audit_logs  (append-only)'}


def box(t):
    x, y = POS[t]
    return x, y, x + TW, y + HEAD + ROW * len(tables[t]['cols']) + 10


def edge(t, side, c):
    """A point on a table's side: c is an absolute x (top/bottom) or y (left/right)."""
    x1, y1, x2, y2 = box(t)
    return {'top': (c, y1), 'bottom': (c, y2), 'left': (x1, c), 'right': (x2, c)}[side]


# Routes run PARENT -> CHILD: [start on parent, bends..., end on child], keyed by (child, fk column).
R = {}
def route(child, col, pts):
    R[(child, col)] = pts

ux1, uy1, ux2, uy2 = box('users')
route('admins', 'user_id', [edge('users', 'left', 140), edge('admins', 'right', 140)])
route('password_reset_tokens', 'user_id', [edge('users', 'left', 290), edge('password_reset_tokens', 'right', 290)])
route('doctors', 'user_id', [edge('users', 'bottom', 1485), edge('doctors', 'top', 1485)])
route('patients', 'user_id', [edge('users', 'bottom', 1380), (1380, 515), (645, 515), edge('patients', 'top', 645)])
route('diagnostic_labs', 'user_id', [edge('users', 'right', 300), (2325, 300), edge('diagnostic_labs', 'top', 2325)])
route('audit_logs', 'actor_user_id', [edge('users', 'top', 1360), (1360, 40), (25, 40), (25, 1040), edge('audit_logs', 'left', 1040)])
route('medical_records', 'patient_id', [edge('patients', 'right', 760), (1280, 760), (1280, 1000), edge('medical_records', 'left', 1000)])
route('medical_records', 'doctor_id', [edge('doctors', 'bottom', 1485), edge('medical_records', 'top', 1485)])
route('access_sessions', 'patient_id', [edge('patients', 'right', 820), (865, 820), (865, 1000), edge('access_sessions', 'left', 1000)])
route('access_sessions', 'doctor_id', [edge('doctors', 'left', 660), (1065, 660), edge('access_sessions', 'top', 1065)])
route('otp_tokens', 'patient_id', [edge('patients', 'bottom', 645), (645, 1370), edge('otp_tokens', 'left', 1370)])
route('otp_tokens', 'doctor_id', [edge('doctors', 'left', 710), (1255, 710), (1255, 1370), edge('otp_tokens', 'right', 1370)])
route('otp_tokens', 'session_id', [edge('access_sessions', 'bottom', 1065), edge('otp_tokens', 'top', 1065)])
route('prescriptions', 'record_id', [edge('medical_records', 'bottom', 1485), edge('prescriptions', 'top', 1485)])
route('ai_summaries', 'record_id', [edge('medical_records', 'right', 1150), (1905, 1150), edge('ai_summaries', 'top', 1905)])
route('lab_reports', 'record_id', [edge('medical_records', 'right', 1010), edge('lab_reports', 'left', 1010)])
route('lab_reports', 'lab_id', [edge('diagnostic_labs', 'bottom', 2325), edge('lab_reports', 'top', 2325)])
route('lab_reports', 'patient_id', [edge('patients', 'bottom', 760), (760, 1255), (2325, 1255), edge('lab_reports', 'bottom', 2325)])
route('audit_logs', 'patient_id', [edge('patients', 'left', 700), (225, 700), edge('audit_logs', 'top', 225)])
route('notifications', 'patient_id', [edge('patients', 'left', 780), (440, 780), (440, 1330), edge('notifications', 'right', 1330)])
LOGICAL_ROUTES = {
    'doctor_registry': [edge('doctor_registry', 'left', 150), edge('users', 'right', 150)],
    'lab_registry': [edge('lab_registry', 'top', 2325), (2325, 58), (1600, 58), edge('users', 'top', 1600)],
}
missing = {(r['child'], r['col']) for r in relations} - set(R)
assert not missing, f'no route for {missing}'
assert len(relations) == 20, f'expected the 20 database foreign keys, parsed {len(relations)}'

# ================================================================ checks
def crossings():
    hits = []
    allroutes = [(f"{r['parent']}->{r['child']}.{r['col']}", R[(r['child'], r['col'])], {r['parent'], r['child']}) for r in relations]
    allroutes += [(f'{t}~>users', pts, {t, 'users'}) for t, pts in LOGICAL_ROUTES.items()]
    for name, pts, own in allroutes:
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            if abs(x1 - x2) > 0.5 and abs(y1 - y2) > 0.5:
                hits.append(f'{name}: diagonal segment')
            for t in tables:
                if t in own:
                    continue
                bx1, by1, bx2, by2 = box(t)
                for i in range(1, 60):
                    x, y = x1 + (x2 - x1) * i / 60, y1 + (y2 - y1) * i / 60
                    if bx1 - 4 < x < bx2 + 4 and by1 - 4 < y < by2 + 4:
                        hits.append(f'{name} crosses {t}')
                        break
    return hits


# ================================================================ SVG
def T(x, y, s, size=13, weight='normal', anchor='start', color='#111', italic=False, family='Helvetica, Arial, sans-serif'):
    st = 'font-style:italic;' if italic else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{color}" '
            f'text-anchor="{anchor}" dominant-baseline="central" style="{st}">{html.escape(s)}</text>')


def cardinality(r):
    """(parent end, child end) markers. Parent: || exactly one, o| zero-or-one. Child: o< many, o| at most one."""
    return ('o|' if r['nullable'] else '||'), ('o|' if r['unique'] else 'o<')


def marker(p, q, kind):
    """Crow's-foot marker at end p of a line whose next point is q."""
    (px, py), (qx, qy) = p, q
    L = ((qx - px) ** 2 + (qy - py) ** 2) ** 0.5
    ux, uy = (qx - px) / L, (qy - py) / L     # along the line, away from the table
    nx, ny = -uy, ux                           # perpendicular
    at = lambda d, s=0: (px + ux * d + nx * s, py + uy * d + ny * s)
    o = []
    bar = lambda d: o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#111" stroke-width="1.8"/>' % (*at(d, -8), *at(d, 8)))
    circ = lambda d: o.append('<circle cx="%.1f" cy="%.1f" r="5.5" fill="#fff" stroke="#111" stroke-width="1.6"/>' % at(d))
    if kind == '||':
        bar(9); bar(16)
    elif kind == 'o|':
        bar(9); circ(22)
    elif kind == 'o<':
        for s in (-9, 0, 9):
            o.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#111" stroke-width="1.6"/>' % (*at(0, s), *at(15)))
        circ(24)
    return ''.join(o)


def svg():
    W, H = 2560, 1940
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<rect width="{W}" height="{H}" fill="#fff"/>',
         T(W / 2, 16, 'HealthNexus BD — Entity Relationship Diagram (PostgreSQL, 16 tables)', size=20, weight='bold', anchor='middle')]
    for r in relations:
        pts = R[(r['child'], r['col'])]
        o.append('<polyline points="%s" fill="none" stroke="#333" stroke-width="1.5"/>' % ' '.join(f'{x},{y}' for x, y in pts))
        pm, cm = cardinality(r)
        o.append(marker(pts[0], pts[1], pm))
        o.append(marker(pts[-1], pts[-2], cm))
    for t, pts in LOGICAL_ROUTES.items():
        o.append('<polyline points="%s" fill="none" stroke="#777" stroke-width="1.5" stroke-dasharray="8 6"/>' % ' '.join(f'{x},{y}' for x, y in pts))
    (lx, ly) = LOGICAL_ROUTES['doctor_registry'][0]
    o.append(T(lx - 45, ly - 12, 'claimed by', size=12, italic=True, color='#555', anchor='middle'))
    COLORS = {'users': '#dae8fc', 'patients': '#d5e8d4', 'doctors': '#ffe6cc', 'diagnostic_labs': '#e1d5e7',
              'admins': '#f8cecc', 'doctor_registry': '#eeeeee', 'lab_registry': '#eeeeee', 'audit_logs': '#e6e6e6'}
    for t, info in tables.items():
        x1, y1, x2, y2 = box(t)
        head = COLORS.get(t, '#fff2cc')
        o.append(f'<rect x="{x1}" y="{y1}" width="{TW}" height="{y2 - y1}" rx="6" fill="#fff" stroke="#444" stroke-width="1.5"/>')
        o.append(f'<path d="M{x1},{y1 + HEAD} v-{HEAD - 6} q0,-6 6,-6 h{TW - 12} q6,0 6,6 v{HEAD - 6} z" fill="{head}" stroke="#444" stroke-width="1.5"/>')
        o.append(T((x1 + x2) / 2, y1 + HEAD / 2, TITLE.get(t, t), size=15, weight='bold', anchor='middle'))
        for i, c in enumerate(info['cols']):
            cy = y1 + HEAD + 6 + ROW * i + ROW / 2
            keys = [k for k, on in (('PK', c['pk']), ('FK', c['fk']), ('UK', c['uk'] and not c['pk'])) if on]
            key = ','.join(keys)
            kc = '#b8860b' if c['pk'] else ('#1f5fa8' if c['fk'] else '#6a3d9a')
            if key:
                o.append(T(x1 + 9, cy, key, size=11, weight='bold', color=kc))
            o.append(T(x1 + 58, cy, c['name'], size=13, weight='bold' if c['pk'] else 'normal', color='#111'))
            typ = c['type'] + ('?' if c['null'] else '')
            o.append(T(x2 - 10, cy, typ, size=12.5, anchor='end', color='#555' if not c['null'] else '#888', italic=c['null']))
    # enums
    ex, ey = 60, 1630
    o.append(T(ex, ey, 'Enum types', size=15, weight='bold'))
    for i, (name, vals) in enumerate(ENUMS.items()):
        col, row = i % 3, i // 3
        bx, by = ex + col * 470, ey + 24 + row * 70
        o.append(f'<rect x="{bx}" y="{by}" width="450" height="58" rx="6" fill="#fafafa" stroke="#999"/>')
        o.append(T(bx + 12, by + 16, f'«enum» {name}', size=13, weight='bold'))
        o.append(T(bx + 12, by + 39, ' | '.join(vals), size=12.5, color='#333'))
    # legend
    gx, gy = 1520, 1830
    o.append(f'<rect x="{gx - 20}" y="{gy - 40}" width="1000" height="104" rx="6" fill="#fcfcfc" stroke="#bbb"/>')
    o.append(T(gx, gy - 22, 'Legend', size=14, weight='bold'))
    samples = [('||', 'exactly one'), ('o|', 'zero or one'), ('o<', 'zero or many')]
    for i, (k, text) in enumerate(samples):
        sx = gx + i * 230
        o.append(f'<line x1="{sx}" y1="{gy + 8}" x2="{sx + 70}" y2="{gy + 8}" stroke="#333" stroke-width="1.5"/>')
        o.append(marker((sx, gy + 8), (sx + 70, gy + 8), k))
        o.append(T(sx + 80, gy + 8, text, size=13))
    o.append(T(gx, gy + 40, 'PK primary key · FK foreign key · UK unique · type? = nullable · dashed = logical link (no FK)', size=13, color='#333'))
    o.append('</svg>')
    return ''.join(o)


# ================================================================ draw.io
def drawio():
    esc = lambda s: html.escape(s, quote=True)
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for t, info in tables.items():
        x1, y1, x2, y2 = box(t)
        cells.append(f'<mxCell id="t_{t}" value="{esc(TITLE.get(t, t))}" style="shape=table;startSize={HEAD};container=1;collapsible=0;'
                     f'childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;fontSize=15;strokeColor=#444444;'
                     f'fillColor=#fff2cc;" vertex="1" parent="1"><mxGeometry x="{x1}" y="{y1}" width="{TW}" height="{y2 - y1}" as="geometry"/></mxCell>')
        for i, c in enumerate(info['cols']):
            keys = ','.join(k for k, on in (('PK', c['pk']), ('FK', c['fk']), ('UK', c['uk'] and not c['pk'])) if on)
            rid = f'r_{t}_{i}'
            cells.append(f'<mxCell id="{rid}" style="shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;'
                         f'collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;strokeColor=inherit;top=0;left=0;right=0;bottom=0;" '
                         f'vertex="1" parent="t_{t}"><mxGeometry y="{HEAD + i * ROW}" width="{TW}" height="{ROW}" as="geometry"/></mxCell>')
            cells.append(f'<mxCell id="{rid}k" value="{keys}" style="shape=partialRectangle;overflow=hidden;connectable=0;fillColor=none;'
                         f'top=0;left=0;bottom=0;right=0;fontStyle=1;fontSize=11;" vertex="1" parent="{rid}"><mxGeometry width="50" height="{ROW}" as="geometry"/></mxCell>')
            typ = c['type'] + ('?' if c['null'] else '')
            cells.append(f'<mxCell id="{rid}v" value="{esc(c["name"] + " : " + typ)}" style="shape=partialRectangle;overflow=hidden;connectable=0;'
                         f'fillColor=none;align=left;top=0;left=0;bottom=0;right=0;spacingLeft=6;fontSize=13;{"fontStyle=1;" if c["pk"] else ""}" '
                         f'vertex="1" parent="{rid}"><mxGeometry x="50" width="{TW - 50}" height="{ROW}" as="geometry"/></mxCell>')
    arrow = {'||': 'ERmandOne', 'o|': 'ERzeroToOne', 'o<': 'ERzeroToMany'}
    for i, r in enumerate(relations):
        pts = R[(r['child'], r['col'])]
        pm, cm = cardinality(r)
        way = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
        cells.append(f'<mxCell id="rel{i}" style="edgeStyle=none;html=1;startArrow={arrow[pm]};endArrow={arrow[cm]};startFill=0;endFill=0;'
                     f'strokeColor=#333333;startSize=12;endSize=12;" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
                     f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/><mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
                     f'<Array as="points">{way}</Array></mxGeometry></mxCell>')
    for t, pts in LOGICAL_ROUTES.items():
        way = ''.join(f'<mxPoint x="{x}" y="{y}"/>' for x, y in pts[1:-1])
        cells.append(f'<mxCell id="log_{t}" value="claimed by (no FK)" style="edgeStyle=none;html=1;dashed=1;endArrow=none;strokeColor=#777777;'
                     f'fontSize=11;fontStyle=2;" edge="1" parent="1"><mxGeometry relative="1" as="geometry">'
                     f'<mxPoint x="{pts[0][0]}" y="{pts[0][1]}" as="sourcePoint"/><mxPoint x="{pts[-1][0]}" y="{pts[-1][1]}" as="targetPoint"/>'
                     f'<Array as="points">{way}</Array></mxGeometry></mxCell>')
    return ('<mxfile host="HealthNexus-generator"><diagram id="erd" name="ERD"><mxGraphModel grid="0" page="1" pageWidth="2560" '
            'pageHeight="1940" background="#ffffff"><root>' + ''.join(cells) + '</root></mxGraphModel></diagram></mxfile>')


OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'erd.svg').write_text(svg(), encoding='utf-8')
(OUT / 'HealthNexus-ERD-v2.drawio').write_text(drawio(), encoding='utf-8')
print(f'tables {len(tables)} | columns {sum(len(t["cols"]) for t in tables.values())} | FKs {len(relations)} | enums {len(ENUMS)}')
for r in relations:
    pm, cm = cardinality(r)
    print(f'  {r["parent"]:<16} {pm}——{cm[::-1] if cm == "o<" else cm} {r["child"]}.{r["col"]}')
hits = crossings()
print('crossings:', len(hits), *[f'\n  {h}' for h in hits])
