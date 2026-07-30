import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import chalk from 'chalk';
import { glob } from 'glob';
import typescript from 'typescript';

import { buildParams } from '../util.js';
import { buildTsConfig } from './ts.config.js';

const execFileAsync = promisify(execFile);

const defaultParams = {
  engine: 'tsc',
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
};

export const runTyping = async (inputParams = {}) => {
  const params = await buildParams(defaultParams, inputParams);

  let diagnostics;
  if (params.engine === 'tsc') {
    diagnostics = runTsc(params);
  } else if (params.engine === 'tsgo') {
    diagnostics = await runTsgo(params);
  } else {
    throw new Error(`Unknown type-check engine '${params.engine}'. Must be one of ['tsc', 'tsgo']`);
  }

  console.log(new PrettyFormatter().format(diagnostics));
  if (params.outputFile) {
    let formatter = null;
    const fileFormat = params.outputFileFormat || 'pretty';
    if (fileFormat === 'annotations') {
      formatter = new GitHubAnnotationsFormatter();
    } else if (fileFormat === 'pretty') {
      formatter = new PrettyFormatter();
    } else {
      throw Error(`Unknown typescript output format option: ${fileFormat}. Must be one of ${['annotations', 'pretty']}`);
    }
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, formatter.format(diagnostics));
  }
};

// NOTE: uses the classic TypeScript Compiler API directly, giving rich ts.Diagnostic objects
const runTsc = (params) => {
  const tsConfig = buildTsConfig(params);
  // NOTE(krishan711): I couldn't find a way to filter node_modules in the glob (filtering needed for lerna repos)
  const files = glob.sync(path.join(params.directory || './src', '**', '*.{ts,tsx}'));
  const filteredFiles = files.filter((file) => !file.includes('/node_modules/'));
  const config = typescript.parseJsonConfigFileContent(
    {
      compilerOptions: {
        ...tsConfig.compilerOptions,
        noEmit: true,
      },
    },
    typescript.sys,
    process.cwd(),
  );
  const program = typescript.createProgram(filteredFiles, config.options);
  // NOTE(krishan711): from https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
  const emitResult = program.emit();
  const allDiagnostics = typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  return tsDiagnosticsToDiagnostics(allDiagnostics);
};

// NOTE: typescript-native-preview (tsgo, TypeScript 7's Go-native compiler) doesn't expose the classic
// Compiler API, only a CLI - so this shells out and parses its plain-text diagnostic output instead
const runTsgo = async (params) => {
  const tsConfig = buildTsConfig(params);
  const resolvedDirectory = path.resolve(params.directory || './src');
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kibalabs-build-tsgo-'));
  const tsconfigFile = path.join(tempDirectory, 'tsconfig.json');
  fs.writeFileSync(
    tsconfigFile,
    JSON.stringify({
      compilerOptions: {
        ...tsConfig.compilerOptions,
        noEmit: true,
        // NOTE: without an explicit rootDir, TypeScript infers it from the tsconfig file's own location
        // (our temp directory), which doesn't contain the source files and causes a TS6059 error
        rootDir: resolvedDirectory,
      },
      include: [resolvedDirectory],
    }),
  );
  try {
    const tscArgs = ['-p', tsconfigFile, '--pretty', 'false'];
    const output = await runNodeBin('typescript-native-preview', 'tsc', tscArgs);
    return tsgoOutputToDiagnostics(output);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
};

const runNodeBin = async (packageName, binName, args) => {
  // NOTE: typescript-native-preview restricts its `exports` field to a few subpaths, so the `bin`
  // script path isn't resolvable directly - resolve `package.json` (which is always exported) instead
  const packageJsonPath = fileURLToPath(import.meta.resolve(`${packageName}/package.json`));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const binPath = path.join(path.dirname(packageJsonPath), packageJson.bin[binName]);
  try {
    const { stdout } = await execFileAsync(process.execPath, [binPath, ...args], { maxBuffer: 1024 * 1024 * 100 });
    return stdout;
  } catch (error) {
    // tsc/tsgo exit with a non-zero code when they find issues, which is expected here
    if (error.stdout !== undefined) {
      return error.stdout;
    }
    throw error;
  }
};

const tsDiagnosticsToDiagnostics = (tsDiagnostics) => {
  return tsDiagnostics.map((diagnostic) => {
    let filePath = '(unknown)';
    let line = 0;
    let column = 0;
    let endLine = 0;
    let endColumn = 0;
    if (diagnostic.file) {
      filePath = path.relative(process.cwd(), diagnostic.file.fileName);
      const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const end = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
      line = start.line + 1;
      column = start.character + 1;
      endLine = end.line + 1;
      endColumn = end.character + 1;
    }
    return {
      filePath,
      line,
      column,
      endLine,
      endColumn,
      message: typescript.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      severity: diagnostic.category === 1 ? 'error' : 'warning',
    };
  });
};

const TSGO_DIAGNOSTIC_LINE_REGEXP = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.*)$/;

const tsgoOutputToDiagnostics = (output) => {
  const diagnostics = [];
  output.split('\n').forEach((line) => {
    const match = line.match(TSGO_DIAGNOSTIC_LINE_REGEXP);
    if (!match) {
      return;
    }
    const [, filePath, lineNumber, columnNumber, severity, code, message] = match;
    diagnostics.push({
      filePath: path.relative(process.cwd(), path.resolve(filePath)),
      line: Number(lineNumber),
      column: Number(columnNumber),
      endLine: Number(lineNumber),
      endColumn: Number(columnNumber),
      message: `${code}: ${message}`,
      severity,
    });
  });
  return diagnostics;
};

export class GitHubAnnotationsFormatter {
  format(diagnostics) {
    const annotations = diagnostics.map((diagnostic) => {
      const annotation = {
        path: diagnostic.filePath,
        start_line: diagnostic.line,
        end_line: diagnostic.endLine || diagnostic.line,
        message: diagnostic.message,
        annotation_level: diagnostic.severity === 'error' ? 'failure' : 'warning',
      };
      if (annotation.start_line === annotation.end_line) {
        annotation.start_column = diagnostic.column;
        annotation.end_column = diagnostic.endColumn || diagnostic.column;
      }
      return annotation;
    });
    return JSON.stringify(annotations);
  }
}

export class PrettyFormatter {
  getSummary(errorCount, warningCount) {
    let summary = '';
    if (errorCount) {
      summary += chalk.red(`${errorCount} errors`);
    }
    if (warningCount) {
      summary = summary ? `${summary} and ` : '';
      summary += chalk.yellow(`${warningCount} warnings`);
    }
    return summary;
  }

  format(diagnostics) {
    const fileMessageMap = {};
    diagnostics.forEach((diagnostic) => {
      if (!(diagnostic.filePath in fileMessageMap)) {
        fileMessageMap[diagnostic.filePath] = [];
      }
      fileMessageMap[diagnostic.filePath].push(diagnostic);
    });
    let totalErrorCount = 0;
    let totalWarningCount = 0;
    let output = Object.keys(fileMessageMap).reduce((accumulatedValue, filePath) => {
      const fileMessages = fileMessageMap[filePath].reduce((innerAccumulatedValue, message) => {
        const location = chalk.grey(`${message.filePath}:${message.line}:${message.column}`);
        innerAccumulatedValue.push(`${location} ${message.message}`);
        return innerAccumulatedValue;
      }, []);
      const errorCount = fileMessageMap[filePath].filter((message) => message.severity === 'error').length;
      totalErrorCount += errorCount;
      const warningCount = fileMessageMap[filePath].filter((message) => message.severity !== 'error').length;
      totalWarningCount += warningCount;
      return `${accumulatedValue}\n${this.getSummary(errorCount, warningCount)} in ${filePath}\n${fileMessages.join('\n')}\n`;
    }, '');
    output += totalErrorCount || totalWarningCount ? `\nFailed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green('Passed.');
    return output;
  }
}
