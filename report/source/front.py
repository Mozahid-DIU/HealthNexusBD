"""Cover page and front matter (approval, declarations, acknowledgements, abstract, contents)."""
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.shared import Inches, Pt

from facts import F

TITLE = 'HealthNexus BD: An AI-Powered Web-Based Unified Patient Health Record System for Bangladesh'


def cover(r, logo):
    """Demo cover: logo about 2.3 in wide, title bold 21 pt, the two blocks bold 14 pt, statement 12 pt,
    rights line bold 11 pt, all centred."""
    d = r.doc
    para = d.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.space_before = Pt(18)
    para.add_run().add_picture(str(logo), width=Inches(2.34))
    r.p('', space_after=24)
    t = r.p(TITLE, align='center', bold=True, size=21, space_after=48, single=True)
    for label, lines in [('Submitted By', [F['student'].upper(), F['student_id']]),
                         ('Supervised By', [F['supervisor'], F['supervisor_role']])]:
        for ln in [label] + lines:
            r.p(ln, align='center', bold=True, size=14, space_after=4, single=True)
        r.p('', space_after=18, single=True)
    r.p('The present project report has been submitted in partial fulfillment of the requirements for the '
        'degree of Bachelor of Science in Software Engineering.', align='center', size=12, space_after=120)
    r.p('@All right Reserved by Daffodil International University', align='center', bold=True, size=11)


def approval(r):
    r.h1('Approval', size=14, bold=True)
    r.p(f'This project titled “{TITLE}”, submitted by {F["student"]} (ID: {F["student_id"]}) to the '
        'Department of Software Engineering, Daffodil International University, has been accepted as satisfactory '
        'for the partial fulfillment of the requirements for the degree of Bachelor of Science in Software '
        'Engineering and approved as to its style and contents.', align='justify', single=True)
    r.p('BOARD OF EXAMINERS', align='center', bold=True, space_after=6)
    for role in ['Chairman', 'Internal Examiner 1', 'Internal Examiner 2', 'Internal Examiner 3', 'External Examiner']:
        para = r.p('', space_after=0, single=True)
        para.paragraph_format.space_before = Pt(20)
        para.add_run('______________________________')
        para.paragraph_format.tab_stops.add_tab_stop(Inches(4.5))
        run = para.add_run('	' + role)
        run.bold = True
        for line in ('Name:', 'Designation:', 'Department / Institution:'):
            r.p(line, space_after=0, size=11, single=True)


def declarations(r):
    """Demo declaration pages: bold title, 1.5-spaced justified text, signature line and plain labels."""
    r.page_break()
    r.h1("Supervisor's Declaration", size=18, bold=True)
    _declaration_text(r, 'I hereby declare that I have examined this project report. In my opinion, the work '
                         'submitted in this report is sufficient in academic standard, scope, depth and quality for '
                         'the award of the degree of Bachelor of Science in Software Engineering.')
    _signature(r, "(Supervisor's Signature)", [('Full Name', F['supervisor']), ('Role', F['supervisor_role']),
                                              ('Date', '')])
    r.page_break()
    r.h1("Student's Declaration", size=18, bold=True)
    _declaration_text(r, 'I hereby declare that the work presented in this project report is my own, except where '
                         'quotations and citations are acknowledged. I also declare that this report has not been '
                         'submitted previously, in whole or in part, for any other degree at Daffodil International '
                         'University or any other institution.')
    _signature(r, "(Student's Signature)", [('Full Name', F['student'].upper()), ('ID Number', F['student_id']),
                                           ('Date', '')])


def _declaration_text(r, text):
    para = r.p(text, align='justify')
    para.paragraph_format.line_spacing = 1.5


def _signature(r, caption, rows):
    para = r.p('', space_after=0)
    para.paragraph_format.space_before = Pt(150)
    para.add_run('______________________________')
    r.p(caption, space_after=18)
    for k, v in rows:
        r.p(f'{k}: {v if v else "____________________"}', space_after=6)


def acknowledgements(r):
    r.page_break()
    r.h1('Acknowledgements', size=20, bold=False)
    _fm(r, 'First of all, I express my deepest gratitude to the Almighty Allah, who gave me the strength, patience and '
        'guidance to complete this project.')
    _fm(r, f'I am sincerely grateful to my supervisor, {F["supervisor"]}, {F["supervisor_role"]}, Department of '
        'Software Engineering, Daffodil International University. His guidance, honest feedback and constant '
        'encouragement shaped this work from the first proposal to the final system. His comments at the '
        'mid-defense helped me focus on what matters most for patients: consent, security and simplicity.')
    _fm(r, 'I also thank all the faculty members of the Department of Software Engineering, whose teaching over the '
        'last four years gave me the knowledge in requirements engineering, software design, databases, security '
        'and testing that this project is built on. My thanks also go to the members of the defense board for '
        'their valuable observations.')
    _fm(r, 'Finally, I am thankful to my parents and family for their unconditional love, patience and support. '
        'Their belief in me kept me going through the long nights of development and writing.')


def abstract(r):
    r.page_break()
    r.h1('Abstract', size=20, bold=False)
    _fm(r, 'In Bangladesh medical documents of patients are spread over the paper report, hospitals, clinics and '
           'diagnostic centres. Past diagnoses, allergies and medications often are unknown by a new doctor, '
           'resulting in re-testing and receiving incorrect medication.')
    _fm(r, 'HealthNexus BD is a platform for a patient-centric Unified Patient Health Record (UPHR) that will give each '
           'patient a single patient ID called a Unified Health ID (UHID) assigned for his whole life. The doctors are '
           'enrolled in a BMDC register while the laboratories in a DGHS register, both with the approval of the '
           'admin. After an SMS OTP has been sent by a doctor, the doctor can only view the patient health record upon '
           'sharing of the SMS OTP by the patient and only for a 30 minute session or less if desired by the patient. '
           'AES-256-GCM is used to encrypt lab files and clinical notes, while all accesses are logged to an '
           'append-only log. Doctors are given an overview of past health records and Google Gemini warns doctors of '
           'potential allergy sensitivities, and a health assistant is bilingual. Where Gemini is not available, '
           'summaries/alerts are done on a rule basis. Technologies used: Frontend (React), Backend (Node.js, '
           'Express, Prisma, PostgreSQL), Deployed on Vercel and Render, 744 automated tests passed and 96.66% of the '
           'Backend was covered.')
    para = _fm(r, '')
    para.add_run('Keywords: ').bold = True
    para.add_run('Gemini AI, OTP consent, audit log, Bangladesh, electronic health record, unified health ID, '
                 'AES-256 encryption.')


def _fm(r, text):
    """Demo acknowledgements and abstract: justified, single-spaced paragraphs."""
    return r.p(text, align='justify', single=True, space_after=12)


def contents(r):
    """Demo: 'TABLE OF CONTENTS' 16 pt regular with a bold 'CONTENTS ... PAGE' header; 'LIST OF FIGURES' bold
    14 pt with a bold 'FIGURES ... Pages' header; entries 11 pt."""
    r.page_break()
    r.plain_title('TABLE OF CONTENTS', size=16, bold=False)
    r.list_header('CONTENTS', 'PAGE')
    r.toc()
    r.page_break()
    r.h1('List of Figures', size=14, bold=True)
    r.list_header('FIGURES', 'Pages')
    r.list_of('Figure Caption')
    r.page_break()
    r.h1('List of Tables', size=14, bold=True)
    r.list_header('TABLES', 'Pages')
    r.list_of('Table Caption')
