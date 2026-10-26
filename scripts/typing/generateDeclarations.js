import path from 'node:path';

import { runTsc } from './tsc.js';

const getCommonDirectory = (filePaths) => {
  const directoriesParts = filePaths.map((filePath) => path.dirname(path.resolve(filePath)).split(path.sep));
  const commonParts = directoriesParts.reduce((accumulatedParts, directoryParts) => {
    let index = 0;
    while (index < accumulatedParts.length && accumulatedParts[index] === directoryParts[index]) {
      index += 1;
    }
    return accumulatedParts.slice(0, index);
  });
  return commonParts.join(path.sep) || path.sep;
};

export const generateTypescriptDeclarations = (filenames, options) => {
  console.log(`Generating ts declarations for ${filenames}`);
  // NOTE(krishan711): output the declarations relative to the entry files' directory (e.g. src/index.ts -> dist/index.d.ts)
  runTsc(filenames, {
    rootDir: getCommonDirectory(filenames),
    ...options,
    emitDeclarationOnly: true,
  });
  return true;
};
