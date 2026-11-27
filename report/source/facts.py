"""Facts used across the report. Versions come from backend/ and frontend/ package.json; test numbers come
from real runs of `npx vitest run --coverage` (backend) and `npx vitest run` (frontend)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIAGRAMS = ROOT / 'diagrams'
SHOTS = ROOT / 'report' / 'screenshots'
ASSETS = ROOT / 'report' / 'assets'

F = {
    'student': 'Khorshed Alam Mozahid',
    'student_id': '0242310005341228',
    'supervisor': 'Md. Rajib Mia',
    'supervisor_role': 'Lecturer (Senior Scale)',
    'submit_month': 'November 2026',
    # versions
    'v_node': '22.x', 'v_react': '19', 'v_vite': '6', 'v_ts': '5.7', 'v_tailwind': '4',
    'v_express': '4.21', 'v_prisma': '6.2', 'v_zod': '3.24', 'v_vitest': '3.2',
    # behaviour
    'session_min': 30, 'otp_min': 5, 'otp_tries': 5, 'pdf_mb': 10,
    # tests (filled in from real runs)
    'tests_backend': 408, 'tests_frontend': 336, 'tests_total': 744,
    'files_backend': 23, 'files_frontend': 31,
    'cov_lines': '96.66%', 'cov_statements': '96.66%', 'cov_functions': '95.27%', 'cov_branches': '83.05%',
    'api_url': 'https://healthnexus-bd-api.onrender.com',
}
