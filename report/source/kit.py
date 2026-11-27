"""Small helpers on top of python-docx for the DIU project report layout.

Layout follows the DIU SWE demo report: A4, Times New Roman 12 pt body, centred chapter titles,
footer "(c)Daffodil International University" with the page number, roman numbers for the front
matter and arabic numbers from Chapter 1.
"""
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

FONT = 'Times New Roman'
BLACK = RGBColor(0, 0, 0)
GREY = RGBColor(0x43, 0x43, 0x43)   # demo sub-section headings
BODY_PT = 12
LINE_MULT = 1.38                     # Word multiple; gives the demo's 19 pt line pitch at 12 pt
PARA_GAP = 18                        # demo leaves one empty line (about 19 pt) between paragraphs
TEXT_W = Inches(6.27)         # A4 width 8.27in - 1in - 1in
MAX_FIG_H = Inches(8.0)
FOOTER_TEXT = '©Daffodil International University'
ROTATED = Path(__file__).resolve().parents[1] / 'assets' / 'rotated'


# ------------------------------------------------------------------ low-level xml helpers
def _set_font(style_or_run, size=None, bold=None, italic=None):
    font = style_or_run.font
    font.name = FONT
    font.color.rgb = BLACK
    if size is not None:
        font.size = Pt(size)
    if bold is not None:
        font.bold = bold
    if italic is not None:
        font.italic = italic
    rpr = style_or_run.element.get_or_add_rPr()
    fonts = rpr.find(qn('w:rFonts'))
    if fonts is None:
        fonts = OxmlElement('w:rFonts')
        rpr.insert(0, fonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'):
        fonts.set(qn(attr), FONT)
    for attr in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
        fonts.attrib.pop(qn(attr), None)


def _field(paragraph, instr, placeholder=''):
    """Insert a complex field (TOC, PAGE, ...). Word fills it when fields are updated."""
    def fld(kind):
        el = OxmlElement('w:fldChar')
        el.set(qn('w:fldCharType'), kind)
        if kind == 'begin':
            el.set(qn('w:dirty'), 'true')
        return el

    run = paragraph.add_run()
    run._r.append(fld('begin'))
    instr_run = paragraph.add_run()
    text = OxmlElement('w:instrText')
    text.set(qn('xml:space'), 'preserve')
    text.text = f' {instr} '
    instr_run._r.append(text)
    paragraph.add_run()._r.append(fld('separate'))
    paragraph.add_run(placeholder)
    paragraph.add_run()._r.append(fld('end'))


def _cell_shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_fill)
    tc_pr.append(shd)


def _repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement('w:tblHeader')
    el.set(qn('w:val'), 'true')
    tr_pr.append(el)


def _no_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement('w:cantSplit')
    el.set(qn('w:val'), 'true')
    tr_pr.append(el)


# ------------------------------------------------------------------ the report builder
class Report:
    def __init__(self):
        self.doc = Document()
        self._styles()
        sec = self.doc.sections[0]
        self._page(sec)
        self.fig_no = {}      # chapter -> running figure number
        self.tab_no = {}

    # ---------------------------------------------------------------- setup
    def _page(self, sec):
        # Demo: A4, text block from x=72pt to ~526pt and from y=72pt, i.e. 1 inch on every side.
        sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
        sec.left_margin, sec.right_margin = Inches(1.0), Inches(1.0)
        sec.top_margin, sec.bottom_margin = Inches(1.0), Inches(1.0)
        sec.footer_distance = Inches(0.5)

    def _styles(self):
        """Values measured from the DIU demo report (docs/Demo Project Doc.pdf), Chapter 1 and front matter."""
        st = self.doc.styles
        normal = st['Normal']
        _set_font(normal, BODY_PT)
        pf = normal.paragraph_format
        pf.line_spacing = LINE_MULT          # demo line pitch 19 pt for 12 pt text
        pf.space_after = Pt(PARA_GAP)        # demo leaves one empty line between paragraphs
        pf.space_before = Pt(0)

        # Heading 1: chapter titles (the run sizes are set in h1()); Heading 2: "1.1 Background" 16 pt regular;
        # Heading 3: "1.1.1 Context and Relevance" 14 pt regular, dark grey #434343.
        for name, size, bold, color, align, before, after in [
                ('Heading 1', 20, True, BLACK, WD_ALIGN_PARAGRAPH.CENTER, 0, 24),
                ('Heading 2', 16, False, BLACK, None, 14, 10),
                ('Heading 3', 14, False, GREY, None, 10, 8)]:
            s = st[name]
            _set_font(s, size, bold=bold, italic=False)
            s.font.color.rgb = color
            s.paragraph_format.keep_with_next = True
            s.paragraph_format.space_before = Pt(before)
            s.paragraph_format.space_after = Pt(after)
            s.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
            if align is not None:
                s.paragraph_format.alignment = align

        for name in ('List Bullet', 'List Bullet 2', 'List Number'):
            s = st[name]
            _set_font(s, BODY_PT)
            s.paragraph_format.space_after = Pt(0)
            s.paragraph_format.line_spacing = LINE_MULT
        self._demo_bullets()

        # Demo: figure captions 11 pt regular, centred under the figure; table captions 11 pt regular,
        # left-aligned above the table ("Table: User Registration").
        for name, align in (('Figure Caption', WD_ALIGN_PARAGRAPH.CENTER), ('Table Caption', WD_ALIGN_PARAGRAPH.LEFT)):
            s = st.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
            s.base_style = normal
            _set_font(s, 11, bold=False, italic=False)
            s.paragraph_format.alignment = align
            s.paragraph_format.space_before = Pt(6)
            s.paragraph_format.space_after = Pt(PARA_GAP)
            s.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        st['Table Caption'].paragraph_format.keep_with_next = True
        st['Table Caption'].paragraph_format.space_after = Pt(6)

        code = st.add_style('Code Block', WD_STYLE_TYPE.PARAGRAPH)
        code.base_style = normal
        code.font.name = 'Consolas'
        code.font.size = Pt(8.5)
        code.element.get_or_add_rPr()
        code.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        code.paragraph_format.space_after = Pt(0)
        code.paragraph_format.left_indent = Cm(0.3)

        cell = st.add_style('Cell', WD_STYLE_TYPE.PARAGRAPH)
        cell.base_style = normal
        _set_font(cell, 11)
        cell.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        cell.paragraph_format.space_after = Pt(2)
        cell.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

        # Demo contents and list entries: 11 pt regular; sub-levels indented by 0.25 in.
        # Word fills TOC fields with its built-in styles 'toc 1..3' and 'table of figures' (lower-case built-in
        # names). The template has the toc styles; 'table of figures' must be created under its built-in name.
        for level in (1, 2, 3):
            s = st.add_style(f'TOC{level}', WD_STYLE_TYPE.PARAGRAPH)
            s.element.name_val = f'toc {level}'
            s.element.attrib.pop(qn('w:customStyle'), None)   # mark as Word's built-in style
            s.base_style = normal
            _set_font(s, 11, bold=False)
            s.paragraph_format.left_indent = Inches(0.25 * (level - 1))
            s.paragraph_format.space_after = Pt(6)
            s.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        tof = st.add_style('TableofFigures', WD_STYLE_TYPE.PARAGRAPH)
        tof.element.name_val = 'table of figures'
        tof.element.attrib.pop(qn('w:customStyle'), None)
        tof.base_style = normal
        _set_font(tof, 11)
        tof.paragraph_format.space_after = Pt(14)   # demo list rows are about 24 pt apart
        tof.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE

    def _demo_bullets(self):
        """Make the 'List Bullet' numbering look like the demo: a solid round bullet (Arial) at 0.25 in and the
        text at 0.5 in."""
        numbering = self.doc.part.numbering_part.element
        style_num = self.doc.styles['List Bullet'].element.pPr.numPr.numId.val
        num = numbering.num_having_numId(style_num)
        abstract_id = num.abstractNumId.val
        for absn in numbering.findall(qn('w:abstractNum')):
            if absn.get(qn('w:abstractNumId')) != str(abstract_id):
                continue
            lvl = absn.find(qn('w:lvl'))
            lvl.find(qn('w:lvlText')).set(qn('w:val'), '●')
            ppr = lvl.find(qn('w:pPr'))
            ind = ppr.find(qn('w:ind'))
            ind.set(qn('w:left'), '720')
            ind.set(qn('w:hanging'), '360')
            rpr = lvl.find(qn('w:rPr'))
            fonts = rpr.find(qn('w:rFonts'))
            for attr in ('w:ascii', 'w:hAnsi', 'w:cs'):
                fonts.set(qn(attr), 'Arial')
            sz = OxmlElement('w:sz')
            sz.set(qn('w:val'), '18')    # a 9 pt dot reads like the demo's bullet next to 12 pt text
            rpr.append(sz)

    def footer(self, section, fmt, start=None):
        """Demo footer: '(c)Daffodil International University' and the page number, TNR 11 pt; the number sits
        about 3.7 in from the left margin. fmt is 'lowerRoman' or 'decimal'."""
        section.footer.is_linked_to_previous = False
        p = section.footer.paragraphs[0]
        p.text = ''
        # Clear the built-in Footer style tabs (centre 3.25 in, right 6.5 in) and use one left tab.
        p.paragraph_format.tab_stops.add_tab_stop(Inches(3.25), WD_TAB_ALIGNMENT.CLEAR)
        p.paragraph_format.tab_stops.add_tab_stop(Inches(6.5), WD_TAB_ALIGNMENT.CLEAR)
        p.paragraph_format.tab_stops.add_tab_stop(Inches(3.7), WD_TAB_ALIGNMENT.LEFT)
        p.add_run(FOOTER_TEXT + '\t')
        _field(p, 'PAGE', '1')
        for run in p.runs:
            _set_font(run, 11)
        sect_pr = section._sectPr
        pg = sect_pr.find(qn('w:pgNumType'))
        if pg is None:
            pg = OxmlElement('w:pgNumType')
            sect_pr.append(pg)
        pg.set(qn('w:fmt'), fmt)
        if start is not None:
            pg.set(qn('w:start'), str(start))

    def blank_footer(self, section):
        section.footer.is_linked_to_previous = False
        section.footer.paragraphs[0].text = ''

    def new_section(self):
        sec = self.doc.add_section(WD_SECTION.NEW_PAGE)
        self._page(sec)
        return sec

    # ---------------------------------------------------------------- text
    def page_break(self):
        """Start the next title on a new page. Uses 'page break before' on that title rather than an empty
        paragraph, which would leave a blank page whenever the previous page is exactly full."""
        self._break_next = True

    def _take_break(self, para):
        if getattr(self, '_break_next', False):
            para.paragraph_format.page_break_before = True
            self._break_next = False

    def p(self, text='', bold_lead=None, align='left', size=None, bold=False, italic=False, space_after=None,
          keep_next=False, indent=None, single=False):
        """A body paragraph (demo chapters are left-aligned). `bold_lead` puts a bold phrase before the text;
        `single` uses single line spacing (demo acknowledgements and abstract)."""
        para = self.doc.add_paragraph()
        para.alignment = {'justify': WD_ALIGN_PARAGRAPH.JUSTIFY, 'center': WD_ALIGN_PARAGRAPH.CENTER,
                          'right': WD_ALIGN_PARAGRAPH.RIGHT}.get(align, WD_ALIGN_PARAGRAPH.LEFT)
        if bold_lead:
            r = para.add_run(bold_lead)
            r.bold = True
            if size:
                r.font.size = Pt(size)
        if text:
            r = para.add_run(text)
            r.bold, r.italic = bold, italic
            if size:
                r.font.size = Pt(size)
        if space_after is not None:
            para.paragraph_format.space_after = Pt(space_after)
        if keep_next:
            para.paragraph_format.keep_with_next = True
        if indent is not None:
            para.paragraph_format.left_indent = Cm(indent)
        if single:
            para.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        return para

    def label(self, text):
        """A run-in label line such as 'Included in Scope:' (demo: Times New Roman 11 pt bold)."""
        return self.p(text, bold=True, size=11, keep_next=True, space_after=6)

    def _end_list(self, para):
        para.paragraph_format.space_after = Pt(PARA_GAP)

    def bullets(self, items, level=1):
        """Demo bullets: a round dot at 0.25 in, text at 0.5 in."""
        style = 'List Bullet' if level == 1 else 'List Bullet 2'
        para = None
        for it in items:
            para = self.doc.add_paragraph(style=style)
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            if isinstance(it, tuple):
                r = para.add_run(it[0])
                r.bold = True
                para.add_run(it[1])
            else:
                para.add_run(it)
        if para is not None:
            self._end_list(para)

    def numbered(self, items):
        """Demo numbered lists: the number at 0.75 in and the text at 1.0 in. Restarts at 1 for every call."""
        para = None
        for i, it in enumerate(items, start=1):
            para = self.doc.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            fmt = para.paragraph_format
            fmt.left_indent = Inches(1.0)
            fmt.first_line_indent = Inches(-0.25)
            fmt.space_after = Pt(0)
            fmt.tab_stops.add_tab_stop(Inches(1.0))
            if isinstance(it, tuple):
                para.add_run(f'{i}.	')
                r = para.add_run(it[0])
                r.bold = True
                para.add_run(it[1])
            else:
                para.add_run(f'{i}.	{it}')
        if para is not None:
            self._end_list(para)

    def h1(self, text, chapter=None, size=None, bold=True):
        """Chapter title (demo: 'CHAPTER 1' bold 20 pt, the title bold 17 pt, centred) or a front-matter title
        (size and boldness as in the demo page it copies)."""
        para = self.doc.add_paragraph(style='Heading 1')
        self._take_break(para)
        if chapter is not None:
            para.add_run(f'CHAPTER {chapter}')
            para.add_run().add_break(WD_BREAK.LINE)
            para.add_run().add_break(WD_BREAK.LINE)
            run = para.add_run(text.upper())
            run.font.size = Pt(17)
        else:
            run = para.add_run(text.upper())
            run.font.size = Pt(size or 20)
            run.bold = bold
        return para

    def h2(self, text):
        return self.doc.add_paragraph(text, style='Heading 2')

    def h3(self, text):
        return self.doc.add_paragraph(text, style='Heading 3')

    def summary_title(self):
        """Demo chapter 1 ends with a centred 'SUMMARY' in 16 pt regular."""
        para = self.doc.add_paragraph('SUMMARY', style='Heading 2')
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return para

    def plain_title(self, text, size=16, bold=False):
        """A centred title that is NOT listed in the table of contents (demo 'TABLE OF CONTENTS': 16 pt)."""
        para = self.p(text, align='center', bold=bold, size=size, space_after=18)
        self._take_break(para)
        return para

    def list_header(self, left, right):
        """Bold 11 pt header row above a contents list, e.g. 'CONTENTS ... PAGE' (as in the demo)."""
        para = self.p('', size=11, space_after=10, single=True)
        para.paragraph_format.tab_stops.add_tab_stop(TEXT_W, WD_TAB_ALIGNMENT.RIGHT)
        run = para.add_run(f'{left}	{right}')
        run.bold = True
        run.font.size = Pt(11)
        return para

    def code(self, lines):
        tbl = self.doc.add_table(rows=1, cols=1)
        tbl.style = 'Table Grid'
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        cell.width = TEXT_W
        _cell_shade(cell, 'F4F4F4')
        cell.paragraphs[0].style = 'Code Block'
        first = True
        for line in lines.strip('\n').split('\n'):
            para = cell.paragraphs[0] if first else cell.add_paragraph(style='Code Block')
            first = False
            para.add_run(line)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(0)

    # ---------------------------------------------------------------- tables
    def table(self, header, rows, widths, caption=None, chapter=None, font=11, header_fill='D9D9D9',
              bold_first_col=False):
        """Grid table; widths are in inches and must add up to <= 6.0."""
        if caption:
            self.table_caption(caption, chapter)
        tbl = self.doc.add_table(rows=1 if header else 0, cols=len(widths))
        tbl.style = 'Table Grid'
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        if header:
            hdr = tbl.rows[0]
            _repeat_header(hdr)
            for i, h in enumerate(header):
                c = hdr.cells[i]
                c.width = Inches(widths[i])
                _cell_shade(c, header_fill)
                para = c.paragraphs[0]
                para.style = 'Cell'
                r = para.add_run(h)
                r.bold = True
                r.font.size = Pt(font)
        for row in rows:
            cells = tbl.add_row()
            _no_split(cells)
            for i, val in enumerate(row):
                c = cells.cells[i]
                c.width = Inches(widths[i])
                parts = val if isinstance(val, list) else [val]
                for j, part in enumerate(parts):
                    para = c.paragraphs[0] if j == 0 else c.add_paragraph()
                    para.style = 'Cell'
                    r = para.add_run(str(part))
                    r.font.size = Pt(font)
                    if bold_first_col and i == 0:
                        r.bold = True
        # Keep short tables on one page so a caption and header row are never left alone at a page bottom.
        if len(rows) <= 15:
            for row in tbl.rows[:-1]:
                for cell in row.cells:
                    for para in cell.paragraphs:
                        para.paragraph_format.keep_with_next = True
        self.doc.add_paragraph().paragraph_format.space_after = Pt(2)
        return tbl

    def kv_table(self, rows, caption=None, chapter=None, widths=(1.7, 4.3)):
        """Two-column description table with a bold, shaded first column."""
        if caption:
            self.table_caption(caption, chapter)
        tbl = self.doc.add_table(rows=0, cols=2)
        tbl.style = 'Table Grid'
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        for key, val in rows:
            cells = tbl.add_row().cells
            cells[0].width, cells[1].width = Inches(widths[0]), Inches(widths[1])
            _cell_shade(cells[0], 'EFEFEF')
            k = cells[0].paragraphs[0]
            k.style = 'Cell'
            k.add_run(key).bold = True
            parts = val if isinstance(val, list) else [val]
            for j, part in enumerate(parts):
                para = cells[1].paragraphs[0] if j == 0 else cells[1].add_paragraph()
                para.style = 'Cell'
                para.add_run(part)
        # Keep the whole description table on one page (each row stays with the next one).
        for row in tbl.rows[:-1]:
            for cell in row.cells:
                for para in cell.paragraphs:
                    para.paragraph_format.keep_with_next = True
        self.doc.add_paragraph().paragraph_format.space_after = Pt(2)
        return tbl

    def table_caption(self, text, chapter):
        n = self.tab_no.get(chapter, 0) + 1
        self.tab_no[chapter] = n
        return self.doc.add_paragraph(f'Table {chapter}.{n}: {text}', style='Table Caption')

    # ---------------------------------------------------------------- figures
    def figure(self, path, caption, chapter, width_in=6.0, max_h_in=8.0, rotate=False):
        """Insert an image with a numbered caption. `rotate` turns a wide diagram 90 degrees so that it
        uses the full page height (read by turning the page clockwise)."""
        from PIL import Image
        path = Path(path)
        if rotate:
            out = ROTATED / f'{path.stem}-rotated.png'
            ROTATED.mkdir(parents=True, exist_ok=True)
            with Image.open(path) as im:
                im.rotate(90, expand=True).save(out)
            path = out
        with Image.open(path) as im:
            w, h = im.size
        width = Inches(width_in)
        if width * h / w > Inches(max_h_in):
            width = int(Inches(max_h_in) * w / h)
        para = self.doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.keep_with_next = True
        para.paragraph_format.space_after = Pt(0)
        para.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        para.add_run().add_picture(str(path), width=width)
        n = self.fig_no.get(chapter, 0) + 1
        self.fig_no[chapter] = n
        self.doc.add_paragraph(f'Figure {chapter}.{n}: {caption}', style='Figure Caption')
        return f'Figure {chapter}.{n}'

    def figure_pair(self, items, chapter, width_in=2.6):
        """Two images side by side, each with its own numbered caption. items: [(path, caption), (path, caption)]."""
        tbl = self.doc.add_table(rows=2, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        for col, (path, caption) in enumerate(items):
            img_cell, cap_cell = tbl.rows[0].cells[col], tbl.rows[1].cells[col]
            img_cell.width = cap_cell.width = Inches(3.0)
            para = img_cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para.paragraph_format.keep_with_next = True
            para.add_run().add_picture(str(path), width=Inches(width_in))
            n = self.fig_no.get(chapter, 0) + 1
            self.fig_no[chapter] = n
            cap_cell.paragraphs[0].style = 'Figure Caption'
            cap_cell.paragraphs[0].add_run(f'Figure {chapter}.{n}: {caption}')
        _no_split(tbl.rows[0])

    def next_figure(self, chapter):
        """The label the next figure() call in this chapter will get (for 'as shown in ...')."""
        return f'Figure {chapter}.{self.fig_no.get(chapter, 0) + 1}'

    # ---------------------------------------------------------------- fields
    def toc(self):
        para = self.doc.add_paragraph()
        _field(para, 'TOC \\o "1-3" \\h \\z \\u', 'Right-click and choose Update Field to build the table of contents.')

    def list_of(self, style_name):
        para = self.doc.add_paragraph()
        _field(para, f'TOC \\h \\z \\t "{style_name},1"', 'Right-click and choose Update Field.')

    def save(self, path):
        self.doc.save(path)
