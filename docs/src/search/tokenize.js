const HANGUL_OR_ASCII = /\w+|\p{Script=Hangul}+/gu;

/**
 * Split a sentence to tokens for Korean + English local search.
 */
export function tokenize(text, language) {
  let regExpMatchWords = /[^-\s]+/g;

  if (language.includes('zh')) {
    regExpMatchWords = /\w+|\p{Unified_Ideograph}+/gu;
  } else if (language.includes('ko')) {
    regExpMatchWords = HANGUL_OR_ASCII;
  }

  return text.toLowerCase().match(regExpMatchWords) || [];
}
