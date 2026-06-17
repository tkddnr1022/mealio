import path from 'node:path';
import type { Plugin } from '@docusaurus/types';

const buildIndexTarget =
  require.resolve('@easyops-cn/docusaurus-search-local/dist/server/server/utils/buildIndex.js');
const tokenizeTarget =
  require.resolve('@easyops-cn/docusaurus-search-local/dist/client/client/utils/tokenize.js');

const searchDir = path.join(__dirname, '..', 'src', 'search');

export default function searchKoWebpackPlugin(): Plugin {
  return {
    name: 'docusaurus-search-ko-webpack',
    configureWebpack(_config, isServer) {
      if (isServer) {
        return {
          resolve: {
            alias: {
              [buildIndexTarget]: path.join(searchDir, 'buildIndex.js'),
            },
          },
        };
      }

      return {
        resolve: {
          alias: {
            [tokenizeTarget]: path.join(searchDir, 'tokenize.js'),
          },
        },
      };
    },
  };
}
