import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

// NOTE(krishan711): typescript 7 has no stable js compiler api so we run its tsc with a generated tsconfig.
// It is installed as typescript-7 because typescript-eslint still needs typescript 6 for parsing.
const getTscPath = () => path.join(path.dirname(require.resolve('typescript-7/package.json')), 'bin', 'tsc');

const PATH_COMPILER_OPTIONS = ['outDir', 'rootDir', 'declarationDir', 'baseUrl', 'tsBuildInfoFile'];

const resolveCompilerOptionPaths = (compilerOptions) => {
  const resolvedCompilerOptions = { ...compilerOptions };
  PATH_COMPILER_OPTIONS.forEach((optionName) => {
    if (resolvedCompilerOptions[optionName]) {
      resolvedCompilerOptions[optionName] = path.resolve(resolvedCompilerOptions[optionName]);
    }
  });
  if (resolvedCompilerOptions.typeRoots) {
    resolvedCompilerOptions.typeRoots = resolvedCompilerOptions.typeRoots.map((typeRoot) => path.resolve(typeRoot));
  }
  return resolvedCompilerOptions;
};

// NOTE(krishan711): parses the output of tsc --pretty false, e.g. "src/index.ts(1,7): error TS2322: Type ..."
// followed by indented lines for chained messages
const parseTscOutput = (output) => {
  const diagnostics = [];
  output.split(/\r?\n/).forEach((outputLine) => {
    const fileMatch = outputLine.match(/^(.+)\((\d+),(\d+)\): (error|warning|message) TS(\d+): (.*)$/);
    const globalMatch = outputLine.match(/^(error|warning|message) TS(\d+): (.*)$/);
    if (fileMatch) {
      diagnostics.push({
        filePath: path.relative(process.cwd(), path.resolve(fileMatch[1])),
        line: Number(fileMatch[2]),
        column: Number(fileMatch[3]),
        category: fileMatch[4],
        code: Number(fileMatch[5]),
        messageLines: [fileMatch[6]],
      });
    } else if (globalMatch) {
      diagnostics.push({
        filePath: null,
        line: 0,
        column: 0,
        category: globalMatch[1],
        code: Number(globalMatch[2]),
        messageLines: [globalMatch[3]],
      });
    } else if (diagnostics.length > 0 && /^\s+\S/.test(outputLine)) {
      diagnostics[diagnostics.length - 1].messageLines.push(outputLine.trim());
    }
  });
  return diagnostics;
};

export const runTsc = (filePaths, compilerOptions) => {
  // NOTE(krishan711): the config lives inside the project so tsc finds node_modules/@types from there
  const configDirectory = path.join(process.cwd(), 'node_modules', '.cache', 'kibalabs-build');
  fs.mkdirSync(configDirectory, { recursive: true });
  const configPath = path.join(configDirectory, `tsconfig.${process.pid}.json`);
  fs.writeFileSync(configPath, JSON.stringify({
    // NOTE(krishan711): since typescript 6 rootDir defaults to the tsconfig directory, so default it to the project instead
    compilerOptions: resolveCompilerOptionPaths({ rootDir: process.cwd(), ...compilerOptions }),
    files: filePaths.map((filePath) => path.resolve(filePath)),
  }));
  try {
    const result = spawnSync(process.execPath, [getTscPath(), '--project', configPath, '--pretty', 'false'], { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 });
    if (result.error) {
      throw result.error;
    }
    const output = `${result.stdout}${result.stderr}`;
    const diagnostics = parseTscOutput(output);
    if (result.status !== 0 && diagnostics.length === 0) {
      throw new Error(`tsc failed with exit code ${result.status}: ${output}`);
    }
    return diagnostics;
  } finally {
    fs.rmSync(configPath, { force: true });
  }
};
