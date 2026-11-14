/**
 * Patient-friendly side-effect notes for common medicines in Bangladesh, in English and
 * Bangla. This reviewed list always wins; Gemini's text is used only for medicines that
 * are not in it, is screened first, and is marked as AI-written in the UI. Advisory
 * only: the wording follows standard patient leaflets and never gives a dose or tells
 * the patient to stop a medicine.
 */

export interface SideEffectText {
  common: string[]
  serious: string[]
  advice: string
}

export interface SideEffect {
  /** The medicine as the doctor wrote it. */
  drug: string
  /** `reviewed`: the built-in list; `ai`: written by Gemini (shown with an AI label). */
  source: 'reviewed' | 'ai'
  en: SideEffectText
  bn: SideEffectText
}

interface Entry {
  /** Lower-case names (generic first) that identify the medicine inside a prescription line. */
  match: string[]
  en: SideEffectText
  bn: SideEffectText
}

const TABLE: Entry[] = [
  {
    match: ['metformin'],
    en: {
      common: ['Nausea or upset stomach', 'Diarrhoea', 'Metallic taste', 'Less appetite'],
      serious: ['Severe weakness or unusual muscle pain', 'Fast or difficult breathing', 'Unusual drowsiness'],
      advice: 'Take with meals. Stomach upset usually settles within a few weeks.',
    },
    bn: {
      common: ['বমিভাব বা পেট খারাপ', 'পাতলা পায়খানা', 'মুখে ধাতব স্বাদ', 'ক্ষুধা কমে যাওয়া'],
      serious: ['খুব দুর্বল লাগা বা অস্বাভাবিক পেশি ব্যথা', 'দ্রুত বা কষ্ট করে শ্বাস নেওয়া', 'অস্বাভাবিক ঘুম ঘুম ভাব'],
      advice: 'খাবারের সাথে খান। পেটের সমস্যা সাধারণত কয়েক সপ্তাহে কমে যায়।',
    },
  },
  {
    match: ['gliclazide'],
    en: {
      common: ['Low blood sugar: shaking, sweating, hunger', 'Upset stomach'],
      serious: ['Confusion, fainting or fits (very low sugar)', 'Yellow skin or eyes', 'Skin rash'],
      advice: 'Take with breakfast and do not skip meals. Keep something sugary with you.',
    },
    bn: {
      common: ['সুগার কমে যাওয়া: কাঁপুনি, ঘাম, খিদে', 'পেট খারাপ'],
      serious: ['বিভ্রান্তি, অজ্ঞান হওয়া বা খিঁচুনি (সুগার খুব কমে গেলে)', 'চামড়া বা চোখ হলুদ হওয়া', 'চামড়ায় র‍্যাশ'],
      advice: 'সকালের নাস্তার সাথে খান, খাবার বাদ দেবেন না। সাথে মিষ্টি কিছু রাখুন।',
    },
  },
  {
    match: ['insulin'],
    en: {
      common: ['Low blood sugar: shaking, sweating, hunger', 'Redness or lumps where you inject', 'Weight gain'],
      serious: ['Confusion or fainting (very low sugar)', 'Swelling of face or trouble breathing'],
      advice: 'Change the injection spot each time and check your sugar as advised.',
    },
    bn: {
      common: ['সুগার কমে যাওয়া: কাঁপুনি, ঘাম, খিদে', 'ইনজেকশনের জায়গায় লাল হওয়া বা চাকা', 'ওজন বেড়ে যাওয়া'],
      serious: ['বিভ্রান্তি বা অজ্ঞান হওয়া (সুগার খুব কমে গেলে)', 'মুখ ফুলে যাওয়া বা শ্বাসকষ্ট'],
      advice: 'প্রতিবার ইনজেকশনের জায়গা বদলান আর পরামর্শমতো সুগার মাপুন।',
    },
  },
  {
    match: ['amlodipine'],
    en: {
      common: ['Swollen ankles', 'Headache', 'Flushing', 'Dizziness or tiredness'],
      serious: ['Chest pain that is new or worse', 'Fainting', 'Very fast or uneven heartbeat'],
      advice: 'Take at the same time each day and stand up slowly.',
    },
    bn: {
      common: ['গোড়ালি ফুলে যাওয়া', 'মাথাব্যথা', 'মুখ লাল হয়ে গরম লাগা', 'মাথা ঘোরা বা ক্লান্তি'],
      serious: ['নতুন বা বেড়ে যাওয়া বুকে ব্যথা', 'অজ্ঞান হওয়া', 'খুব দ্রুত বা অনিয়মিত হৃদস্পন্দন'],
      advice: 'প্রতিদিন একই সময়ে খান এবং ধীরে ধীরে উঠে দাঁড়ান।',
    },
  },
  {
    match: ['losartan'],
    en: {
      common: ['Dizziness', 'Tiredness', 'Higher potassium (seen on a blood test)'],
      serious: ['Swelling of face, lips or tongue', 'Fainting', 'Passing much less urine'],
      advice: 'Have kidney and potassium tests as advised. If you are or may become pregnant, tell your doctor straight away.',
    },
    bn: {
      common: ['মাথা ঘোরা', 'ক্লান্তি', 'রক্তে পটাশিয়াম বেড়ে যাওয়া (রক্ত পরীক্ষায় ধরা পড়ে)'],
      serious: ['মুখ, ঠোঁট বা জিহ্বা ফুলে যাওয়া', 'অজ্ঞান হওয়া', 'প্রস্রাব অনেক কমে যাওয়া'],
      advice: 'পরামর্শমতো কিডনি ও পটাশিয়াম পরীক্ষা করান। গর্ভবতী হলে বা হওয়ার সম্ভাবনা থাকলে সাথে সাথে ডাক্তারকে জানান।',
    },
  },
  {
    match: ['atorvastatin', 'rosuvastatin', 'simvastatin'],
    en: {
      common: ['Muscle aches', 'Headache', 'Upset stomach or diarrhoea'],
      serious: ['Unexplained muscle pain or weakness with dark urine', 'Yellow skin or eyes'],
      advice: 'Tell your doctor about any unexplained muscle pain.',
    },
    bn: {
      common: ['পেশিতে ব্যথা', 'মাথাব্যথা', 'পেট খারাপ বা পাতলা পায়খানা'],
      serious: ['কারণ ছাড়া পেশি ব্যথা বা দুর্বলতা, সাথে গাঢ় রঙের প্রস্রাব', 'চামড়া বা চোখ হলুদ হওয়া'],
      advice: 'কারণ ছাড়া পেশি ব্যথা হলে ডাক্তারকে জানান।',
    },
  },
  {
    match: ['levothyroxine', 'thyroxine'],
    en: {
      common: ['If the dose is too high: palpitations, sweating, shakiness, poor sleep'],
      serious: ['Chest pain', 'Very fast or irregular heartbeat'],
      advice: 'Take on an empty stomach, 30–60 minutes before breakfast, apart from iron or calcium.',
    },
    bn: {
      common: ['ডোজ বেশি হলে: বুক ধড়ফড়, ঘাম, কাঁপুনি, ঘুম কম হওয়া'],
      serious: ['বুকে ব্যথা', 'খুব দ্রুত বা অনিয়মিত হৃদস্পন্দন'],
      advice: 'খালি পেটে, নাস্তার ৩০–৬০ মিনিট আগে খান; আয়রন বা ক্যালসিয়াম থেকে আলাদা সময়ে।',
    },
  },
  {
    match: ['salbutamol', 'albuterol'],
    en: {
      common: ['Shakiness', 'Fast heartbeat', 'Headache'],
      serious: ['Breathing gets worse right after using it', 'Chest pain'],
      advice: 'If you need it more often than usual, see your doctor.',
    },
    bn: {
      common: ['হাত কাঁপা', 'দ্রুত হৃদস্পন্দন', 'মাথাব্যথা'],
      serious: ['ব্যবহারের সাথে সাথে শ্বাসকষ্ট বেড়ে যাওয়া', 'বুকে ব্যথা'],
      advice: 'স্বাভাবিকের চেয়ে বেশি বার লাগলে ডাক্তারের সাথে দেখা করুন।',
    },
  },
  {
    match: ['ferrous', 'iron'],
    en: {
      common: ['Darker stools than usual', 'Constipation', 'Upset stomach or nausea'],
      serious: ['Black, sticky stools with stomach pain or dizziness', 'Severe stomach pain', 'Vomiting blood'],
      advice: 'Take with water or orange juice, not with tea or milk. Keep away from children.',
    },
    bn: {
      common: ['পায়খানার রং স্বাভাবিকের চেয়ে গাঢ় হওয়া', 'কোষ্ঠকাঠিন্য', 'পেট খারাপ বা বমিভাব'],
      serious: ['পেট ব্যথা বা মাথা ঘোরার সাথে কালো, আঠালো পায়খানা', 'তীব্র পেট ব্যথা', 'রক্তবমি'],
      advice: 'পানি বা কমলার রসের সাথে খান, চা বা দুধের সাথে নয়। শিশুদের নাগালের বাইরে রাখুন।',
    },
  },
  {
    match: ['cholecalciferol', 'vitamin d'],
    en: {
      common: ['Usually none at the prescribed dose'],
      serious: ['Too much: nausea, vomiting, strong thirst, confusion'],
      advice: 'Do not take more than prescribed.',
    },
    bn: {
      common: ['নির্ধারিত ডোজে সাধারণত কিছু হয় না'],
      serious: ['বেশি খেলে: বমিভাব, বমি, খুব পিপাসা, বিভ্রান্তি'],
      advice: 'নির্ধারিত ডোজের বেশি খাবেন না।',
    },
  },
  {
    match: ['amoxicillin', 'co-amoxiclav', 'ampicillin', 'flucloxacillin'],
    en: {
      common: ['Diarrhoea', 'Nausea', 'Mild rash'],
      serious: ['Swelling of face or lips, or trouble breathing', 'Severe rash or blisters', 'Severe watery or bloody diarrhoea'],
      advice: 'Finish the full course. Make sure your doctor knows about any penicillin allergy.',
    },
    bn: {
      common: ['পাতলা পায়খানা', 'বমিভাব', 'হালকা র‍্যাশ'],
      serious: ['মুখ বা ঠোঁট ফুলে যাওয়া, বা শ্বাসকষ্ট', 'তীব্র র‍্যাশ বা ফোসকা', 'তীব্র পানির মতো বা রক্তমিশ্রিত পায়খানা'],
      advice: 'পুরো কোর্স শেষ করুন। পেনিসিলিনে অ্যালার্জি থাকলে ডাক্তারকে অবশ্যই জানান।',
    },
  },
  {
    match: ['azithromycin'],
    en: {
      common: ['Diarrhoea', 'Nausea', 'Stomach pain'],
      serious: ['Fast or uneven heartbeat or fainting', 'Swelling of face or trouble breathing', 'Severe diarrhoea'],
      advice: 'Finish the full course as prescribed.',
    },
    bn: {
      common: ['পাতলা পায়খানা', 'বমিভাব', 'পেট ব্যথা'],
      serious: ['দ্রুত বা অনিয়মিত হৃদস্পন্দন বা অজ্ঞান হওয়া', 'মুখ ফুলে যাওয়া বা শ্বাসকষ্ট', 'তীব্র পাতলা পায়খানা'],
      advice: 'নির্দেশমতো পুরো কোর্স শেষ করুন।',
    },
  },
  {
    match: ['paracetamol', 'acetaminophen'],
    en: {
      common: ['Rarely any at the right dose'],
      serious: ['Yellow skin or eyes, or dark urine', 'Taking too much can badly damage the liver'],
      advice: 'Do not take more than your doctor prescribed. Many cold and flu medicines also contain paracetamol.',
    },
    bn: {
      common: ['সঠিক ডোজে সাধারণত কিছু হয় না'],
      serious: ['চামড়া বা চোখ হলুদ হওয়া, বা গাঢ় প্রস্রাব', 'বেশি খেলে লিভারের মারাত্মক ক্ষতি হতে পারে'],
      advice: 'ডাক্তার যতটা দিয়েছেন তার বেশি খাবেন না। সর্দি-জ্বরের অনেক ওষুধেও প্যারাসিটামল থাকে।',
    },
  },
  {
    match: ['omeprazole', 'esomeprazole', 'pantoprazole'],
    en: {
      common: ['Headache', 'Stomach pain or wind', 'Diarrhoea or constipation'],
      serious: ['Severe or long-lasting diarrhoea', 'Swelling of face or trouble breathing'],
      advice: 'Take before breakfast. Ask your doctor before using it for a long time.',
    },
    bn: {
      common: ['মাথাব্যথা', 'পেট ব্যথা বা গ্যাস', 'পাতলা পায়খানা বা কোষ্ঠকাঠিন্য'],
      serious: ['তীব্র বা দীর্ঘদিন পাতলা পায়খানা', 'মুখ ফুলে যাওয়া বা শ্বাসকষ্ট'],
      advice: 'নাস্তার আগে খান। দীর্ঘদিন খাওয়ার আগে ডাক্তারকে জিজ্ঞেস করুন।',
    },
  },
  {
    match: ['aspirin'],
    en: {
      common: ['Indigestion', 'Bruising more easily'],
      serious: ['Black stools or vomiting blood', 'Wheezing or trouble breathing'],
      advice: 'Take after food.',
    },
    bn: {
      common: ['বদহজম', 'সহজে কালশিটে পড়া'],
      serious: ['কালো পায়খানা বা রক্তবমি', 'শ্বাসে শাঁ শাঁ শব্দ বা শ্বাসকষ্ট'],
      advice: 'খাবারের পরে খান।',
    },
  },
]

/** Built-in notes for one prescribed medicine, or null when it isn't in the list. */
export function lookupSideEffect(drug: string): SideEffect | null {
  const name = drug.toLowerCase()
  // Match at the start of a word, so "iron" never matches inside "spironolactone".
  const entry = TABLE.find((e) => e.match.some((m) => new RegExp(`\\b${m}`).test(name)))
  return entry ? { drug, source: 'reviewed', en: entry.en, bn: entry.bn } : null
}

const MAX_ITEMS = 6
const MAX_TEXT = 240
const BANGLA = /[ঀ-৿]/
/** Patient text must never tell them to stop a medicine or change its dose. */
const UNSAFE = /\b(stop|stopping|discontinue|dose|dosage|double|skip)\b|বন্ধ|ডোজ|মাত্রা/i

function cleanList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const items = value
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim().slice(0, MAX_TEXT))
    .slice(0, MAX_ITEMS)
  return items.length ? items : null
}

function cleanText(value: unknown, bangla: boolean): SideEffectText | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const common = cleanList(v.common)
  const serious = cleanList(v.serious)
  const advice = typeof v.advice === 'string' ? v.advice.trim().slice(0, MAX_TEXT) : ''
  if (!common || !serious) return null
  const all = [...common, ...serious, advice]
  if (all.some((t) => UNSAFE.test(t))) return null
  // A Bangla reader must actually get Bangla, not English under a Bangla label.
  if (bangla && ![...common, ...serious].every((t) => BANGLA.test(t))) return null
  return { common, serious, advice }
}

/** The generic name a prescription line starts with: "Amoxicillin 500mg" → "amoxicillin". */
function genericName(drug: string): string {
  return drug.toLowerCase().match(/[a-z][a-z-]*/)?.[0] ?? ''
}

/**
 * One entry per prescribed medicine, in prescription order: the reviewed list first;
 * for a medicine it doesn't cover, Gemini's entry for exactly that medicine if it passes
 * screening; medicines neither knows are left out.
 */
export function resolveSideEffects(medications: string[], fromAi: unknown = []): SideEffect[] {
  const aiByName = new Map<string, { en: SideEffectText; bn: SideEffectText }>()
  if (Array.isArray(fromAi)) {
    for (const item of fromAi) {
      if (!item || typeof item !== 'object') continue
      const { drug, en, bn } = item as Record<string, unknown>
      const key = typeof drug === 'string' ? genericName(drug) : ''
      const cleanEn = cleanText(en, false)
      const cleanBn = cleanText(bn, true)
      if (key && cleanEn && cleanBn && !aiByName.has(key)) aiByName.set(key, { en: cleanEn, bn: cleanBn })
    }
  }

  const result: SideEffect[] = []
  for (const drug of medications) {
    const reviewed = lookupSideEffect(drug)
    if (reviewed) {
      result.push(reviewed)
      continue
    }
    // Same generic name only: "Iron" never lands on "Spironolactone".
    const ai = aiByName.get(genericName(drug))
    if (ai) result.push({ drug, source: 'ai', ...ai })
  }
  return result
}
