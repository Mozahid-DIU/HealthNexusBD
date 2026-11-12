/** GET /lab/search: only what a lab needs, never the patient's clinical history. */
export interface PrescribedTest {
  name: string
  /** `uploaded` once a report arrived after the latest prescription of this test. */
  status: 'pending' | 'uploaded'
  prescribedAt: string
}

export interface LabSearchResult {
  patientId: string
  uhid: string
  fullName: string
  gender: string | null
  phone: string // masked, e.g. ********007
  prescribedTests: PrescribedTest[]
}

/** GET /lab/uploads */
export interface LabUpload {
  id: string
  testName: string
  patient: { uhid: string; fullName: string }
  fileUrl: string
  isVerified: boolean
  uploadedAt: string
}

/** POST /lab/reports */
export interface UploadedReport {
  id: string
  testName: string
  uploadedAt: string
}
