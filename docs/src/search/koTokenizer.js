const lunr = require('lunr');
const {
  cutWordByUnderscore,
} = require('@easyops-cn/docusaurus-search-local/dist/server/server/utils/cutWordByUnderscore');

const HANGUL_OR_ASCII = /\w+|\p{Script=Hangul}+/u;

function pushToken(tokens, value, metadata, position) {
  tokens.push(
    new lunr.Token(value, {
      ...lunr.utils.clone(metadata),
      position: [position, value.length],
      index: tokens.length,
    }),
  );
}

function tokenizeAsciiWord(word, start, metadata, tokens) {
  const lower = word.toLowerCase();
  pushToken(tokens, lower, metadata, start);

  const subWords = cutWordByUnderscore(lower);
  if (subWords.length > 1) {
    let offset = 0;
    for (const subWord of subWords) {
      if (subWord[0] !== '_') {
        pushToken(tokens, subWord, metadata, start + offset);
      }
      offset += subWord.length;
    }
  }
}

function tokenizeHangulWord(word, start, metadata, tokens) {
  const lower = word.toLowerCase();
  pushToken(tokens, lower, metadata, start);

  for (let i = 0; i < lower.length; i += 1) {
    pushToken(tokens, lower[i], metadata, start + i);
  }

  for (let i = 0; i < lower.length - 1; i += 1) {
    pushToken(tokens, lower.slice(i, i + 2), metadata, start + i);
  }
}

function koTokenizer(input, metadata) {
  if (input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((token) =>
      new lunr.Token(
        lunr.utils.asString(token).toLowerCase(),
        lunr.utils.clone(metadata),
      ),
    );
  }

  const content = input.toString();
  const tokens = [];
  let start = 0;
  let text = content;

  while (text.length > 0) {
    const match = text.match(HANGUL_OR_ASCII);
    if (!match) {
      break;
    }

    const word = match[0];
    start += match.index;

    if (/\w/.test(word[0])) {
      tokenizeAsciiWord(word, start, metadata, tokens);
    } else {
      tokenizeHangulWord(word, start, metadata, tokens);
    }

    start += word.length;
    text = content.substring(start);
  }

  return tokens;
}

module.exports = { koTokenizer };
