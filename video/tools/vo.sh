#!/usr/bin/env bash
# Narration (edge-tts, en-US-AvaNeural) -> public/vo/*.mp3. Run from the video/ folder.
V=en-US-AvaNeural; R="+15%"
cd public/vo
gen(){ edge-tts --voice $V --rate=$R --text "$2" --write-media "$1.mp3" >/dev/null 2>&1 || echo "FAIL $1"; }
gen s0 "Can you read your own lab report? Most patients in Bangladesh can't." &
gen s1 "Our medical history lives in paper files, written in English medical terms. Doctors get a few minutes per patient, with no history in front of them. So allergies get missed, medicines clash, and patients go home confused. It is a problem for millions here, and across the developing world." &
gen s2 "HealthNexus B D is a unified health record with a personal A I assistant built in. Patients ask about their own records and lab reports, and get answers in plain Bangla or English. Doctors get an A I briefing before every consultation. Unlike a general chatbot, it knows your real history, it speaks Bangla, and it never sends your identity to the model." &
gen d1 "Here is the working system, live. A doctor searches for a patient by health I D, and asks for access to the record." &
gen d2 "A one-time code goes to the patient's phone. No code, no access. The patient stays in control." &
gen d3 "The chart opens with an A I briefing of the full history, and a warning about the patient's sulfa allergy." &
gen d4 "Labs are part of it too. A diagnostic lab uploads the report straight into the patient's record, so no result gets lost on paper." &
gen d5 "Now the patient. She attaches a visit record and asks, in Bangla, what it means. The assistant explains that her thyroid level is high, why the medicine was given, and reminds her of her allergy." &
gen d6 "If a message sounds like an emergency, a nine nine nine call-out appears at once, even if the A I is offline." &
gen d7 "And every access to the record, including the A I's, is logged for the patient to see." &
gen s4 "Under the hood: the question and the patient's own records are combined on our server. Names, phone numbers and national I Ds are stripped, in English and Bangla, before anything reaches Google Gemini. The answer is grounded in real records, not guesses. Rule-based checks for allergies and drug interactions run every time, and if the model fails, the system falls back safely." &
gen s5 "Our goal: every patient understands their own report, and no doctor misses a known allergy. We will measure report comprehension, alerts caught, and time saved per consultation. Next, we add voice questions in Bangla, reading of scanned reports, and a pilot with a local clinic. HealthNexus B D. Your health record, explained." &
wait
