V=en-US-AvaNeural; R="+6%"
gen(){ edge-tts --voice $V --rate=$R --text "$2" --write-media "$1.mp3" >/dev/null 2>&1 || echo "FAIL $1"; }
gen s1 "In Bangladesh, your medical history lives in paper files. Prescriptions and lab reports are written in English medical terms that most patients cannot read. Doctors have only a few minutes per patient, with no history in front of them. So allergies get missed, medicines clash, and patients go home confused. This is true for millions here, and across the developing world." &
gen s2 "HealthNexus B D is a unified health record with a personal A I assistant built in. Patients ask about their own records and lab reports, and get answers in plain Bangla or English. Doctors get an A I briefing before every consultation. Unlike a general chatbot, it knows your real history, it speaks Bangla, and it never sends your identity to the model." &
gen d1 "Here is the working system. A doctor finds a patient and requests access." &
gen d2 "A one-time code goes to the patient's phone. No code, no access. The patient stays in control." &
gen d3 "The doctor's chart opens with an A I briefing of the full history, and alerts for allergies and drug interactions." &
gen d4 "Now the patient's side. They attach a lab report and ask, in Bangla, what it means. The assistant answers in simple Bangla, using their own allergies and medicines." &
gen d5 "If a message sounds like an emergency, a nine nine nine call-out appears at once, even if the A I is offline." &
gen d6 "And every access to the record, including the A I's, is logged for the patient to see." &
gen s4 "Under the hood: the question and the patient's own records are combined on our server. Names, phone numbers and national I Ds are stripped, in English and Bangla, before anything reaches Google Gemini. The answer is grounded in real records, not guesses. Rule-based checks for allergies and drug interactions run every time, and if the model fails, the system falls back safely." &
gen s5 "Our goal: every patient understands their own report, and no doctor misses a known allergy. We will measure report comprehension, alerts caught, and time saved per consultation. Next, we add voice questions in Bangla, reading of scanned reports, and a pilot with a local clinic. HealthNexus B D. Your health record, explained." &
wait
for f in s1 s2 d1 d2 d3 d4 d5 d6 s4 s5; do echo -n "$f "; ffprobe -v error -show_entries format=duration -of csv=p=0 $f.mp3; done
