import type { Prisma, PrismaClient } from '@prisma/client'
import { encrypt } from '../src/utils/crypto.ts'

export interface SeededDoctor {
  userId: string
  doctorId: string
  name: string
}
export interface SeededPatient {
  id: string
  uhid: string
  name: string
}

/** A public, always-available dummy PDF used as the demo lab-report file. */
const DEMO_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

interface RecordDef {
  patient: number
  doctor: number
  diagnosis: string
  content: string
  symptoms: string[]
  meds: Array<{ name: string; dose: string; frequency: string; duration?: string }>
  tests?: string[]
  summary?: { text: string; interaction: string[]; allergy: string[] }
  labTest?: string // which recommended test gets a report uploaded
  lab?: number
}

// patient/doctor/lab indexes reference the seeded arrays (see seed.ts order).
const RECORDS: RecordDef[] = [
  {
    patient: 0, doctor: 2,
    diagnosis: 'Type 2 Diabetes Mellitus',
    content: 'Poorly controlled T2DM. HbA1c 8.4%. Advised diet control and daily glucose monitoring. Continue Metformin, add Gliclazide.',
    symptoms: ['polyuria', 'fatigue', 'blurred vision'],
    meds: [
      { name: 'Metformin', dose: '500mg', frequency: 'BD', duration: '90 days' },
      { name: 'Gliclazide', dose: '80mg', frequency: 'OD', duration: '90 days' },
    ],
    tests: ['HbA1c', 'Fasting Blood Sugar'],
    summary: {
      text: 'Chronic diabetic with suboptimal control. On dual oral hypoglycemics. Penicillin allergy on file.',
      interaction: ['Monitor renal function with Metformin'],
      allergy: ['Penicillin — avoid beta-lactam antibiotics'],
    },
    labTest: 'HbA1c', lab: 0,
  },
  {
    patient: 0, doctor: 0,
    diagnosis: 'Essential Hypertension',
    content: 'BP 150/95 on two readings. Started on Amlodipine. Reduce salt intake, review in 2 weeks.',
    symptoms: ['headache'],
    meds: [{ name: 'Amlodipine', dose: '5mg', frequency: 'OD', duration: '30 days' }],
    tests: ['Lipid Profile', 'Serum Creatinine'],
    labTest: 'Lipid Profile', lab: 1,
  },
  {
    patient: 1, doctor: 5,
    diagnosis: 'Acute Bronchial Asthma',
    content: 'Wheeze and breathlessness for 3 days. Good response to nebulisation. Prescribed inhaler with spacer.',
    symptoms: ['wheeze', 'cough', 'shortness of breath'],
    meds: [{ name: 'Salbutamol Inhaler', dose: '2 puffs', frequency: 'QID', duration: '30 days' }],
    tests: ['Chest X-Ray'],
    summary: {
      text: 'Known asthmatic with an acute exacerbation, responded to bronchodilators.',
      interaction: [],
      allergy: [],
    },
  },
  {
    patient: 2, doctor: 2,
    diagnosis: 'Hypothyroidism',
    content: 'TSH elevated at 8.9. Started Levothyroxine 50mcg. Recheck TSH in 6 weeks.',
    symptoms: ['weight gain', 'cold intolerance', 'fatigue'],
    meds: [{ name: 'Levothyroxine', dose: '50mcg', frequency: 'OD', duration: '45 days' }],
    tests: ['TSH', 'Free T4'],
    labTest: 'TSH', lab: 2,
  },
  {
    patient: 3, doctor: 3,
    diagnosis: 'Chronic Kidney Disease Stage 2',
    content: 'eGFR 72. Proteinuria present. Advised BP control, low-protein diet, nephrology follow-up.',
    symptoms: ['ankle swelling'],
    meds: [{ name: 'Losartan', dose: '50mg', frequency: 'OD', duration: '90 days' }],
    tests: ['Serum Creatinine', 'Urine ACR'],
    summary: {
      text: 'Early CKD with proteinuria; renoprotection with ARB started.',
      interaction: ['Monitor potassium on ARB'],
      allergy: [],
    },
    labTest: 'Serum Creatinine', lab: 3,
  },
  {
    patient: 4, doctor: 0,
    diagnosis: 'Iron Deficiency Anaemia',
    content: 'Hb 9.8. Started oral iron. Investigate for source of blood loss.',
    symptoms: ['fatigue', 'pallor'],
    meds: [{ name: 'Ferrous Sulphate', dose: '200mg', frequency: 'BD', duration: '60 days' }],
    tests: ['Complete Blood Count', 'Serum Ferritin'],
  },
  {
    patient: 5, doctor: 1,
    diagnosis: 'Essential Hypertension',
    content: 'BP 160/100. Dual therapy started. Counselled on lifestyle modification.',
    symptoms: ['dizziness'],
    meds: [
      { name: 'Amlodipine', dose: '5mg', frequency: 'OD', duration: '30 days' },
      { name: 'Losartan', dose: '50mg', frequency: 'OD', duration: '30 days' },
    ],
    tests: ['ECG', 'Lipid Profile'],
    labTest: 'ECG', lab: 0,
  },
  {
    patient: 6, doctor: 2,
    diagnosis: 'Type 1 Diabetes Mellitus',
    content: 'Young T1DM on basal-bolus insulin. Good compliance. Adjusted evening insulin dose.',
    symptoms: ['polydipsia'],
    meds: [{ name: 'Insulin Glargine', dose: '18 units', frequency: 'Nocte', duration: '30 days' }],
    tests: ['HbA1c'],
    summary: {
      text: 'Type 1 diabetic on insulin, stable glycaemic trend.',
      interaction: [],
      allergy: [],
    },
    labTest: 'HbA1c', lab: 1,
  },
  {
    patient: 7, doctor: 0,
    diagnosis: 'Dyslipidaemia',
    content: 'LDL elevated. Started statin. Repeat lipids in 12 weeks.',
    symptoms: [],
    meds: [{ name: 'Atorvastatin', dose: '20mg', frequency: 'Nocte', duration: '90 days' }],
    tests: ['Lipid Profile', 'LFT'],
  },
  {
    patient: 1, doctor: 5,
    diagnosis: 'Follow-up: Asthma review',
    content: 'Symptoms well controlled on inhaler. Continue current regimen. Reinforced inhaler technique.',
    symptoms: [],
    meds: [{ name: 'Salbutamol Inhaler', dose: '2 puffs', frequency: 'PRN' }],
  },
  {
    patient: 2, doctor: 4,
    diagnosis: 'Vitamin D Deficiency',
    content: 'Low vitamin D on screening. Started supplementation.',
    symptoms: ['body ache'],
    meds: [{ name: 'Cholecalciferol', dose: '40000 IU', frequency: 'Weekly', duration: '8 weeks' }],
    tests: ['Serum Vitamin D'],
  },
  {
    patient: 3, doctor: 3,
    diagnosis: 'Follow-up: CKD review',
    content: 'Stable renal function. Potassium normal. Continue ARB.',
    symptoms: [],
    meds: [{ name: 'Losartan', dose: '50mg', frequency: 'OD', duration: '90 days' }],
  },
]

export async function seedClinical(
  prisma: PrismaClient,
  doctors: SeededDoctor[],
  patients: SeededPatient[],
) {
  const patientIds = patients.map((p) => p.id)

  // --- Idempotent refresh: wipe demo clinical data, then rebuild ---
  await prisma.auditLog.deleteMany({ where: { patientId: { in: patientIds } } })
  await prisma.labReport.deleteMany({ where: { patientId: { in: patientIds } } })
  await prisma.otpToken.deleteMany({ where: { patientId: { in: patientIds } } })
  await prisma.accessSession.deleteMany({ where: { patientId: { in: patientIds } } })
  await prisma.medicalRecord.deleteMany({ where: { patientId: { in: patientIds } } }) // cascades prescriptions + AI summaries

  let records = 0
  let prescriptions = 0
  let labReports = 0
  let summaries = 0

  for (const def of RECORDS) {
    const patient = patients[def.patient]
    const doctor = doctors[def.doctor]

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.doctorId,
        contentEncrypted: encrypt(def.content),
        diagnosis: def.diagnosis,
        symptoms: def.symptoms as Prisma.InputJsonValue,
        prescriptions: {
          create: {
            medications: def.meds as Prisma.InputJsonValue,
            recommendedTests: (def.tests ?? []) as Prisma.InputJsonValue,
          },
        },
        ...(def.summary
          ? {
              aiSummaries: {
                create: {
                  summary: def.summary.text,
                  interactionAlerts: def.summary.interaction as Prisma.InputJsonValue,
                  allergyAlerts: def.summary.allergy as Prisma.InputJsonValue,
                },
              },
            }
          : {}),
      },
    })
    records++
    prescriptions++
    if (def.summary) summaries++

    // A lab report for one prescribed test on some records.
    if (def.labTest && def.lab !== undefined) {
      const lid = await labId(prisma, def.lab)
      if (lid) {
        await prisma.labReport.create({
          data: {
            patientId: patient.id,
            labId: lid,
            recordId: record.id,
            testName: def.labTest,
            fileRefEncrypted: encrypt(DEMO_PDF_URL),
          },
        })
        labReports++
      }
    }
  }

  // --- One active consent session for an instant "open records" demo ---
  await prisma.accessSession.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctors[2].doctorId,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  // --- A handful of audit entries so the audit screens aren't empty ---
  await prisma.auditLog.createMany({
    data: [
      { actorUserId: doctors[2].userId, patientId: patients[0].id, action: 'grant', resource: 'session:demo' },
      { actorUserId: doctors[2].userId, patientId: patients[0].id, action: 'view', resource: 'patient_records:2' },
      { actorUserId: doctors[2].userId, patientId: patients[0].id, action: 'create', resource: 'medical_record:demo' },
      { actorUserId: doctors[0].userId, patientId: patients[1].id, action: 'view', resource: 'patient_records:1' },
      { actorUserId: doctors[3].userId, patientId: patients[3].id, action: 'create', resource: 'medical_record:demo' },
      { actorUserId: doctors[2].userId, patientId: patients[0].id, action: 'revoke', resource: 'session:demo' },
    ],
  })

  return { records, prescriptions, labReports, summaries }
}

/** Resolve a lab's DiagnosticLab id by its position in the seeded lab list. */
const labIdCache: Record<number, string> = {}
async function labId(prisma: PrismaClient, index: number): Promise<string | null> {
  if (labIdCache[index]) return labIdCache[index]
  const licenses = ['DGHS-LAB-0099', 'DGHS-LAB-0142', 'DGHS-LAB-0210', 'DGHS-LAB-0301']
  const lab = await prisma.diagnosticLab.findUnique({ where: { licenseNumber: licenses[index] } })
  if (lab) labIdCache[index] = lab.id
  return lab?.id ?? null
}
