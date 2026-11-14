/**
 * The same emergency check the server runs (backend/src/modules/assistant/assistant.safety.ts):
 * used here so the 999 call-out still appears when a question could not be sent at all
 * (offline, rate limited, server down). Change both lists together.
 */
const GAP = String.raw`(?:\s+\S+){0,2}\s*`

const EMERGENCY_PATTERNS: RegExp[] = [
  // English
  new RegExp(String.raw`chest${GAP}pain|pain in (my|the) chest|heart attack`, 'i'),
  /can'?t breath|cannot breath|unable to breath|difficulty breathing|trouble breathing|short(ness)? of breath|struggling to breath/i,
  /unconscious|not responding|passed out|fainted|faint(ing)? spell/i,
  /seizure|convulsion|(having|had) (a )?fits?\b/i,
  /stroke|face (is )?drooping|slurred speech|can'?t move (my )?(arm|leg|one side)|paraly[sz]/i,
  /bleeding (a lot|heavily|badly|won'?t stop)|heavy bleeding|severe bleeding|vomiting blood|coughing (up )?blood/i,
  /pregnan\w*.{0,40}bleed|bleed\w*.{0,40}pregnan|eclampsia/i,
  /suicid|kill myself|end my life|self[- ]?harm|want to die/i,
  /overdose|took too many (pills|tablets)|(swallowed|drank|took|ate) (some )?poison|pesticide|insecticide|rat poison/i,
  /snake ?bite|bitten by a snake|drown/i,
  // Bangla
  new RegExp(`বুক(?:ে|ের)?${GAP}(?:ব্যথা|ব্যাথা)|হার্ট (?:অ্যাটাক|এটাক)`),
  new RegExp(`শ্বাস${GAP}(?:কষ্ট|নিতে পারছি না|নিতে পারছে না)|দম${GAP}(?:বন্ধ|নিতে পারছি না|নিতে পারছে না)`),
  /অজ্ঞান|জ্ঞান হারা|সাড়া দিচ্ছে না/,
  /খিঁচুনি|খিচুনি/,
  /মুখ বেঁকে|কথা জড়িয়ে|এক পাশ অবশ|স্ট্রোক|প্যারালাইসিস/,
  /রক্ত ?বমি|প্রচুর রক্ত|রক্ত (থামছে|বন্ধ হচ্ছে) না|কাশির সাথে রক্ত/,
  /গর্ভ.{0,30}রক্ত/,
  /আত্মহত্যা|মরে যেতে চাই|নিজেকে শেষ|বাঁচতে চাই না|নিজের ক্ষতি/,
  /বিষ খে|বিষ পান|কীটনাশক|অনেক (ওষুধ|ট্যাবলেট) খেয়ে/,
  /সাপে (?:কা|কে)|সাপের কামড়|পানিতে ডুব/,
  // Banglish
  new RegExp(String.raw`buk(?:e|ey|er)?${GAP}(?:betha|byatha|bytha|batha|beta)`, 'i'),
  /(shash|shas|sash|swash)\s*(nite\s*)?(koshto|kosto|kostho|parchi na|parci na)|dom (bondho|nite parchi na)/i,
  /ojnan|ogyan|gyan hara/i,
  /khichuni|khicuni/i,
  /attohotta|attohatya|more jete chai|bachte chai na/i,
  /bish kh|bish khey|sap(e|er)? (kat|kam)|pani(te)? dub/i,
]

export function looksLikeEmergency(text: string): boolean {
  const clean = text.normalize('NFC')
  return EMERGENCY_PATTERNS.some((p) => p.test(clean))
}
