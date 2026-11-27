"""Build the HealthNexus BD project report (.docx) in the DIU SWE format.

Usage:  python build_report.py            -> report/HealthNexus-BD-Project-Report.docx
Then run update_fields.ps1 (Word) to fill the table of contents, lists and page numbers and to export a PDF.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import ch1  # noqa: E402
import ch2  # noqa: E402
import ch3  # noqa: E402
import ch4  # noqa: E402
import ch5  # noqa: E402
import ch6  # noqa: E402
import front  # noqa: E402
from facts import ASSETS, F, ROOT  # noqa: E402
from kit import Report  # noqa: E402

OUT = ROOT / 'report' / 'HealthNexus-BD-Project-Report.docx'


def main():
    if 'TBD' in {str(v) for v in F.values()} and '--draft' not in sys.argv:
        missing = [k for k, v in F.items() if str(v) == 'TBD']
        raise SystemExit(f'facts.py still has TBD values: {missing}')
    r = Report()
    r.doc.core_properties.title = front.TITLE
    r.doc.core_properties.author = F['student']

    # Section 1: cover, no page number
    r.blank_footer(r.doc.sections[0])
    front.cover(r, ASSETS / 'diu-logo.png')

    # Section 2: front matter, roman numbers from i
    sec = r.new_section()
    r.footer(sec, 'lowerRoman', start=1)
    # The approval page is left out for now (user's request); front.approval() can be called here again later.
    front.declarations(r)
    front.acknowledgements(r)
    front.abstract(r)
    front.contents(r)

    # Section 3: chapters, arabic numbers from 1
    sec = r.new_section()
    r.footer(sec, 'decimal', start=1)
    ch1.build(r)
    ch2.build(r)
    ch3.build(r)
    ch4.build(r)
    ch5.build(r)
    ch6.build(r)

    r.save(OUT)
    print(f'saved {OUT}')
    print('figures:', r.fig_no, 'tables:', r.tab_no)


if __name__ == '__main__':
    main()
