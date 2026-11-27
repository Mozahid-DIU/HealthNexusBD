"""The four HealthNexus BD activity diagrams (Patient, Doctor, Lab, Admin) in plain draw.io style.

Same flows as activities.py; shorter labels, larger text, no colours or titles.
Usage: python activities_v3.py OUT_DIR   (then render each .drawio with drawio-render.mjs)
"""
import sys
from pathlib import Path

from activity_v3 import Diagram

OUT = Path(sys.argv[1])
SYSTEM = 'HealthNexus BD'
ACTOR_W = 680
MAIN, SIDE = 160, -175   # two columns inside an actor lane


def lanes(*names):
    return [(n, '', '', w) for n, w in names]


def patient():
    d = Diagram('Patient', lanes(('Patient', 1960), (SYSTEM, 460)))
    m, s = 560, 200   # main flow / side column inside the wide patient lane
    d.n('start', 'start', 0, 0, dx=m)
    d.n('reg', 'action', 0, 1, 'Fill in the\nregistration form', dx=m)
    d.n('valid', 'decision', 1, 2, 'Details\nvalid?')
    d.n('fix', 'action', 0, 2, 'Correct the details', dx=s)
    d.n('create', 'action', 1, 3.2, 'Create account\n& UHID')
    d.n('login', 'action', 0, 4.3, 'Log in', dx=m)
    d.n('cred', 'decision', 1, 5.5, 'Password\ncorrect?')
    d.n('reset', 'action', 0, 5.5, 'Reset password\nwith a code', dx=s)
    d.n('dash', 'action', 0, 6.8, 'Open dashboard', dx=m)
    d.n('fork', 'bar', 0, 7.9, '1900')
    tasks = [('t1', 'Update\nprofile'), ('t2', 'View medical\nhistory'), ('t3', 'View lab\nreports'),
             ('t4', 'Deny / revoke\naccess'), ('t5', 'Ask the\nassistant'), ('t6', 'Check the\naccess log')]
    for i, (tid, text) in enumerate(tasks):
        d.n(tid, 'action', 0, 9, text, dx=-800 + i * 320)
    d.n('join', 'bar', 0, 10.1, '1900')
    d.n('logout', 'action', 0, 11.1, 'Log out', dx=m)
    d.n('end', 'end', 0, 12.1, dx=m)

    d.e('start', 'reg')
    d.e('reg', 'valid', mode='hv')
    d.e('valid', 'fix', 'No', mode='h')
    d.e('fix', 'reg', mode='vh')
    d.e('valid', 'create', 'Yes')
    d.e('create', 'login', mode='hv')
    d.e('login', 'cred', mode='hv')
    d.e('cred', 'reset', 'No', mode='h')
    d.e('reset', 'login', mode='vh')
    d.e('cred', 'dash', 'Yes', mode='down-across')
    d.e('dash', 'fork', mode='join')
    for tid, _ in tasks:
        d.e('fork', tid, mode='drop')
        d.e(tid, 'join', mode='join')
    d.e('join', 'logout', mode='drop')
    d.e('logout', 'end')
    return d


def doctor():
    d = Diagram('Doctor', lanes(('Doctor', ACTOR_W), (SYSTEM, 460), ('Patient', ACTOR_W)))
    pm, ps = -160, 175   # patient lane: main column near the system lane, side column outside
    d.n('start', 'start', 0, 0, dx=MAIN)
    d.n('reg', 'action', 0, 1, 'Register with\nBMDC number', dx=MAIN)
    d.n('bmdc', 'decision', 1, 2, 'BMDC number\nvalid?')
    d.n('refused', 'action', 0, 2, 'Registration\nrefused', dx=SIDE)
    d.n('end1', 'end', 0, 3, dx=SIDE)
    d.n('pending', 'action', 1, 3.2, 'Keep account\npending')
    d.n('login', 'action', 0, 4.3, 'Log in after\napproval', dx=MAIN)
    d.n('search', 'action', 0, 5.3, 'Search patient', dx=MAIN)
    d.n('found', 'decision', 1, 6.4, 'Patient\nfound?')
    d.n('recheck', 'action', 0, 6.4, 'Check UHID /\nmobile number', dx=SIDE)
    d.n('active', 'decision', 1, 7.7, 'Access\nalready?')
    d.n('request', 'action', 0, 8.9, 'Request access\nwith a reason', dx=MAIN)
    d.n('otp', 'action', 1, 9.9, 'Send OTP by SMS\n(valid 5 min)')
    d.n('receive', 'action', 2, 10.9, 'Get the OTP\nby SMS', dx=pm)
    d.n('agree', 'decision', 2, 12.1, 'Share\nrecords?', dx=pm)
    d.n('deny', 'action', 2, 12.1, 'Deny the request', dx=ps)
    d.n('end2', 'end', 2, 13.1, dx=ps)
    d.n('tell', 'action', 2, 13.3, 'Tell the doctor\nthe OTP', dx=pm)
    d.n('enter', 'action', 0, 14.3, 'Enter the OTP', dx=MAIN)
    d.n('valid', 'decision', 1, 15.4, 'OTP\ncorrect?')
    d.n('retry', 'action', 0, 15.4, 'Try again\n(max 5 tries)', dx=SIDE)
    d.n('session', 'action', 1, 16.6, 'Open a 30 min\nsession')
    d.n('chart', 'action', 0, 17.7, 'View history &\nlab reports', dx=MAIN)
    d.n('visit', 'action', 0, 18.7, 'Record visit &\nprescription', dx=MAIN)
    d.n('save', 'action', 1, 19.7, 'Encrypt & save,\nnotify patient')
    d.n('ai', 'action', 0, 20.7, 'Generate\nAI summary', dx=MAIN)
    d.n('alert', 'decision', 1, 21.9, 'Allergy\nalert?')
    d.n('revise', 'action', 0, 21.9, 'Review alert &\ncorrect the visit', dx=SIDE)
    d.n('ends', 'action', 1, 23.1, 'Session ends')
    d.n('end3', 'end', 1, 24.1)

    d.e('start', 'reg')
    d.e('reg', 'bmdc', mode='hv')
    d.e('bmdc', 'refused', 'No', mode='h')
    d.e('refused', 'end1')
    d.e('bmdc', 'pending', 'Yes')
    d.e('pending', 'login', mode='hv')
    d.e('login', 'search')
    d.e('search', 'found', mode='hv')
    d.e('found', 'recheck', 'No', mode='h')
    d.e('recheck', 'search', mode='vh')
    d.e('found', 'active', 'Yes')
    d.e('active', 'request', 'No', mode='down-across')
    d.e('active', 'chart', 'Yes', mode='loop', side='right', off=26)
    d.e('request', 'otp', mode='down-across')
    d.e('otp', 'receive', mode='hv')
    d.e('receive', 'agree')
    d.e('agree', 'deny', 'No', mode='h')
    d.e('deny', 'end2')
    d.e('agree', 'tell', 'Yes')
    d.e('tell', 'enter', mode='hv')
    d.e('enter', 'valid', mode='hv')
    d.e('valid', 'retry', 'No', mode='h')
    d.e('retry', 'enter', mode='vh')
    d.e('valid', 'session', 'Yes')
    d.e('session', 'chart', mode='hv')
    d.e('chart', 'visit')
    d.e('visit', 'save', mode='hv')
    d.e('save', 'ai', mode='hv')
    d.e('ai', 'alert', mode='hv')
    d.e('alert', 'revise', 'Yes', mode='h')
    d.e('revise', 'visit', mode='vh')
    d.e('alert', 'ends', 'No')
    d.e('ends', 'end3')
    return d


def lab():
    d = Diagram('Lab', lanes(('Lab', ACTOR_W), (SYSTEM, 460)))
    d.n('start', 'start', 0, 0, dx=MAIN)
    d.n('reg', 'action', 0, 1, 'Register with\nDGHS licence', dx=MAIN)
    d.n('lic', 'decision', 1, 2, 'Licence\nvalid?')
    d.n('refused', 'action', 0, 2, 'Registration\nrefused', dx=SIDE)
    d.n('end1', 'end', 0, 3, dx=SIDE)
    d.n('pending', 'action', 1, 3.2, 'Keep account\npending')
    d.n('login', 'action', 0, 4.3, 'Log in after\napproval', dx=MAIN)
    d.n('search', 'action', 0, 5.3, 'Search patient', dx=MAIN)
    d.n('found', 'decision', 1, 6.4, 'Patient\nfound?')
    d.n('recheck', 'action', 0, 6.4, 'Check UHID /\nmobile number', dx=SIDE)
    d.n('tests', 'action', 1, 7.6, 'Show prescribed\ntests')
    d.n('choose', 'action', 0, 8.7, 'Pick a test &\nattach the PDF', dx=MAIN)
    d.n('presc', 'decision', 1, 9.8, 'Test\nprescribed?')
    d.n('refusedUp', 'action', 0, 9.8, 'Upload refused', dx=SIDE)
    d.n('pdf', 'decision', 1, 11.2, 'PDF under\n10 MB?')
    d.n('store', 'action', 1, 12.5, 'Encrypt & store\nthe report')
    d.n('notify', 'action', 1, 13.5, 'Notify the\npatient')
    d.n('history', 'action', 0, 14.5, 'View upload\nhistory', dx=MAIN)
    d.n('end', 'end', 0, 15.5, dx=MAIN)

    d.e('start', 'reg')
    d.e('reg', 'lic', mode='hv')
    d.e('lic', 'refused', 'No', mode='h')
    d.e('refused', 'end1')
    d.e('lic', 'pending', 'Yes')
    d.e('pending', 'login', mode='hv')
    d.e('login', 'search')
    d.e('search', 'found', mode='hv')
    d.e('found', 'recheck', 'No', mode='h')
    d.e('recheck', 'search', mode='vh')
    d.e('found', 'tests', 'Yes')
    d.e('tests', 'choose', mode='hv')
    d.e('choose', 'presc', mode='hv')
    d.e('presc', 'refusedUp', 'No', mode='h')
    d.e('refusedUp', 'choose', mode='vh')
    d.e('presc', 'pdf', 'Yes')
    d.e('pdf', 'refusedUp', 'No', mode='hv')
    d.e('pdf', 'store', 'Yes')
    d.e('store', 'notify')
    d.e('notify', 'history', mode='hv')
    d.e('history', 'end')
    return d


def admin():
    d = Diagram('Admin', lanes(('Admin', ACTOR_W), (SYSTEM, 460)))
    d.n('start', 'start', 0, 0, dx=MAIN)
    d.n('login', 'action', 0, 1, 'Log in to the\nadmin panel', dx=MAIN)
    d.n('isAdmin', 'decision', 1, 2, 'Admin\naccount?')
    d.n('refused', 'action', 0, 2, 'Access refused', dx=SIDE)
    d.n('end1', 'end', 0, 3, dx=SIDE)
    d.n('dash', 'action', 1, 3.2, 'Show stats &\npending list')
    d.n('review', 'action', 0, 4.3, 'Review doctor /\nlab application', dx=MAIN)
    d.n('approve', 'decision', 0, 5.5, 'Approve?', dx=MAIN)
    d.n('reason', 'action', 0, 6.9, 'Write the\nreason', dx=SIDE)
    d.n('activate', 'action', 1, 5.5, 'Activate the\naccount')
    d.n('reject', 'action', 1, 6.9, 'Reject the\napplication')
    d.n('manage', 'action', 0, 8.1, 'Suspend or\nreactivate users', dx=MAIN)
    d.n('signout', 'action', 1, 9.1, 'Sign out the\nsuspended user')
    d.n('audit', 'action', 0, 10.1, 'Check the\naudit log', dx=MAIN)
    d.n('logout', 'action', 0, 11.1, 'Log out', dx=MAIN)
    d.n('end', 'end', 0, 12.1, dx=MAIN)

    d.e('start', 'login')
    d.e('login', 'isAdmin', mode='hv')
    d.e('isAdmin', 'refused', 'No', mode='h')
    d.e('refused', 'end1')
    d.e('isAdmin', 'dash', 'Yes')
    d.e('dash', 'review', mode='hv')
    d.e('review', 'approve')
    d.e('approve', 'activate', 'Yes', mode='h')
    d.e('approve', 'reason', 'No', mode='side-down', side='left')
    d.e('reason', 'reject', mode='h')
    d.e('activate', 'manage', mode='loop', side='right', off=0)
    rx, mx, y = d.cx(d.nodes['reject']), d.cx(d.nodes['manage']), d.cy(d.nodes['reject']) + 66
    d.e('reject', 'manage', mode='via', side='bottom>top', via=[(rx, y), (mx, y)])
    d.e('manage', 'signout', mode='down-across')
    d.e('signout', 'audit', mode='down-across')
    d.e('audit', 'logout')
    d.e('logout', 'end')
    return d


OUT.mkdir(parents=True, exist_ok=True)
for name, build in [('patient', patient), ('doctor', doctor), ('lab', lab), ('admin', admin)]:
    dg = build()
    (OUT / f'Activity-{name.capitalize()}.drawio').write_text(dg.drawio(f'activity-{name}'), encoding='utf-8')
    hits = dg.collisions() + dg.overlaps()
    print(f'{name}: {dg.width()}x{dg.height()}, {len(dg.nodes)} nodes, {len(dg.edges)} edges, {len(hits)} problems',
          *[f'\n   {h}' for h in hits])
