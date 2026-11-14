import { describe, expect, it } from 'vitest'
import { EMERGENCY_REPLY, looksLikeEmergency, mentionsMedicineChange, systemPrompt } from '../../src/modules/assistant/assistant.safety.ts'
import { pdfText } from '../../src/modules/assistant/assistant.context.ts'

describe('emergency check: common phrasings', () => {
  it.each([
    'বুকের ব্যথা করছে', 'বুকের মাঝে ব্যথা', 'ছেলের খিচুনি হচ্ছে', 'রক্ত বমি হচ্ছে', 'মনে হয় হার্ট অ্যাটাক',
    'সাপে কেটেছে', 'বাচ্চা পানিতে ডুবে গেছে', 'কীটনাশক খেয়েছে', 'দম নিতে পারছি না',
    'cant breath', 'I think it is a heart attack', 'snake bite on leg', 'he took poison', 'drank pesticide',
    'she is having fits', 'sudden paralysis of arm', 'bleeding in pregnancy',
    'bukey betha', 'buke onek betha', 'shas kosto', 'shash nite parchi na', 'khichuni hocche', 'bish kheyeche', 'sape kateche',
  ])('catches "%s"', (text) => {
    expect(looksLikeEmergency(text)).toBe(true)
  })
})

describe('medicine-change wording', () => {
  it.each([
    ['Take 500 mg twice a day', true],
    ['Do not stop taking your medicine', true],
    ['আপনার ডোজ ডাক্তার ঠিক করবেন', true],
    ['Eat more vegetables and walk daily', false],
  ] as const)('"%s" → %s', (text, expected) => {
    expect(mentionsMedicineChange(text)).toBe(expected)
  })
})

describe('emergency check', () => {
  it.each([
    'I have chest pain since morning',
    'my father cannot breathe properly',
    'she fainted in the kitchen',
    'face drooping and slurred speech',
    'I want to kill myself',
    'আমার বুকে ব্যথা করছে',
    'শ্বাস নিতে কষ্ট হচ্ছে',
    'বাবা অজ্ঞান হয়ে গেছে',
    'রক্তবমি হচ্ছে',
    'buke betha hocche',
    'shash nite koshto hocche',
  ])('catches “%s”', (text) => {
    expect(looksLikeEmergency(text)).toBe(true)
  })

  it.each([
    'What should a diabetic eat for breakfast?',
    'আমার রিপোর্টে হিমোগ্লোবিন কম কেন?',
    'I hurt my knee playing football last week',
    'Where is the fitting room?',
    'Metformin kno khabo?',
  ])('lets “%s” through', (text) => {
    expect(looksLikeEmergency(text)).toBe(false)
  })

  it('points to 999 in both languages', () => {
    expect(EMERGENCY_REPLY.en).toMatch(/999/)
    expect(EMERGENCY_REPLY.bn).toMatch(/৯৯৯/)
  })
})

describe('assistant rules', () => {
  it('forbids diagnosing, prescribing and dose changes, and treats patient data as data', () => {
    const rules = systemPrompt('en')
    expect(rules).toMatch(/Never diagnose/)
    expect(rules).toMatch(/Never prescribe/)
    expect(rules).toMatch(/start, stop, skip or change a medicine or its dose/)
    expect(rules).toMatch(/never as\s+instructions/)
  })
})

describe('report text', () => {
  it('returns nothing (rather than failing) for a file that is not a readable PDF', async () => {
    expect(await pdfText(Buffer.from('not a pdf at all'))).toBe('')
  })
})
