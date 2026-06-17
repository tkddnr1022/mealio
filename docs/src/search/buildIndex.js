'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.buildIndex = void 0;
const tslib_1 = require('tslib');
/* eslint @typescript-eslint/no-var-requires: 0 */
const lunr_1 = tslib_1.__importDefault(require('lunr'));
const constants_1 = require('@easyops-cn/docusaurus-search-local/dist/server/shared/constants');
const { koTokenizer } = require('./koTokenizer');

let pluginInitialized = false;
let plugin;

function registerKoreanTokenizer(lunr) {
  const originalKo = lunr.ko;
  lunr.ko = function koWithTokenizer() {
    originalKo.call(this);
    this.tokenizer = koTokenizer;
  };
  lunr.ko.tokenizer = koTokenizer;
}

function buildIndex(
  allDocuments,
  {
    language,
    removeDefaultStopWordFilter,
    removeDefaultStemmer,
    zhUserDict,
    zhUserDictPath,
  },
) {
  if (!pluginInitialized) {
    pluginInitialized = true;
    if (language.length > 1 || language.some((item) => item !== 'en')) {
      require('lunr-languages/lunr.stemmer.support')(lunr_1.default);
    }
    if (language.includes('ja') || language.includes('jp')) {
      require('lunr-languages/tinyseg')(lunr_1.default);
    }
    if (
      constants_1.LANGUAGES_NEED_WORDCUT.some((item) => language.includes(item))
    ) {
      lunr_1.default.wordcut = require('lunr-languages/wordcut');
    }
    for (const lang of language.filter(
      (item) => item !== 'en' && item !== 'zh',
    )) {
      require(`lunr-languages/lunr.${lang}`)(lunr_1.default);
    }
    if (language.includes('ko')) {
      registerKoreanTokenizer(lunr_1.default);
    }
    if (language.includes('zh')) {
      const {
        tokenizer,
        loadUserDict,
      } = require('@easyops-cn/docusaurus-search-local/dist/server/server/utils/tokenizer');
      loadUserDict(zhUserDict, zhUserDictPath);
      require('@easyops-cn/docusaurus-search-local/dist/server/shared/lunrLanguageZh').lunrLanguageZh(
        lunr_1.default,
        tokenizer,
      );
    }
    if (language.length > 1) {
      require('lunr-languages/lunr.multi')(lunr_1.default);
    }
    if (language.length > 1) {
      plugin = lunr_1.default.multiLanguage(...language);
    } else if (language[0] !== 'en') {
      plugin = lunr_1.default[language[0]];
    }
  }

  return new Array(allDocuments.length)
    .fill(null)
    .map((_doc, index) => allDocuments[index] ?? [])
    .map((documents) => ({
      documents,
      index: lunr_1.default(function () {
        if (plugin) {
          this.use(plugin);
        }
        for (const lang of language) {
          if (removeDefaultStopWordFilter.includes(lang)) {
            if (lang === 'en') {
              this.pipeline.remove(lunr_1.default.stopWordFilter);
            } else {
              const stopWordFilter = lunr_1.default[lang]?.stopWordFilter;
              if (stopWordFilter) {
                this.pipeline.remove(stopWordFilter);
              }
            }
          }
        }
        if (removeDefaultStemmer) {
          this.pipeline.remove(lunr_1.default.stemmer);
        }
        if (language.includes('zh')) {
          this.tokenizer = lunr_1.default.zh.tokenizer;
        }
        this.ref('i');
        this.field('t');
        this.metadataWhitelist = ['position'];
        documents.forEach((doc) => {
          this.add({
            ...doc,
            i: doc.i.toString(),
          });
        });
      }),
    }));
}

exports.buildIndex = buildIndex;
