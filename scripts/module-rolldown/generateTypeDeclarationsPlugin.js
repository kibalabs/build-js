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
        outDir: outputDirectory,
        // NOTE(krishan711): below works to output one file but it
        // incorrectly puts declare module "index" instead of
        // declare module "<package_name>"
        // outFile: path.join(outputDirectory, 'index.d.ts'),
      });
    },
  };
};
