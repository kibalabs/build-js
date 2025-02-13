import path from 'node:path';

import { generateTypescriptDeclarations } from '../typing/generateDeclarations.js';
import { buildTsConfig } from '../typing/ts.config.js';

export const generateTypeDeclarationsPlugin = ({
  inputDirectories,
  outputDirectory,
}) => {
  const tsConfig = buildTsConfig({});
  return {
    name: 'generate-type-declarations',
    buildStart() {
      generateTypescriptDeclarations(inputDirectories, {
        ...tsConfig.compilerOptions,
        outFile: path.join(outputDirectory, 'index.d.ts'),
      });
    },
  };
};
