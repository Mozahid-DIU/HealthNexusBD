import type { TFunction } from 'i18next'

/**
 * Translate a string that is *usually* a translation key (e.g. a Zod message like
 * 'validation.email') but may be plain text. Unknown keys fall back to the text itself.
 */
export function translateDynamic(t: TFunction, keyOrText: string): string {
  return t(keyOrText as never, { defaultValue: keyOrText }) as string
}
