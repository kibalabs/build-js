import fs from 'fs';
import path from 'path';

import chalk from 'chalk';
import { glob } from 'glob';
import typescript from 'typescript';

import { buildTsConfig } from './ts.config';
import { removeUndefinedProperties } from '../util';

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
};

export const runTyping = async (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  let customConfig = {};
  if (params.configModifier) {
    customConfig = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (typeof customConfig === 'function') {
      customConfig = customConfig(params);
    }
  }
  const tsConfig = buildTsConfig(params);
  // NOTE(krishan711): I couldn't find a way to filter node_modules in the glob (filtering needed for lerna repos)
  const files = glob.sync(path.join(params.directory || './src', '**', '*.{ts,tsx}'));
  const filteredFiles = files.filter((file) => !file.includes('/node_modules/'));
  const config = typescript.parseJsonConfigFileContent({
    compilerOptions: {
      ...tsConfig.compilerOptions,
      ...customConfig.compilerOptions,
      noEmit: true,
    },
  }, typescript.sys, process.cwd());
  const program = typescript.createProgram(filteredFiles, config.options);
  // NOTE(krishan711): from https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
  const emitResult = program.emit();
  const allDiagnostics = typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
  console.log(new PrettyFormatter().format(allDiagnostics));
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
    fs.writeFileSync(params.outputFile, formatter.format(allDiagnostics));
  }

  // const exitCode = emitResult.emitSkipped ? 1 : 0;
  // console.log(`Process exiting with code '${exitCode}'.`);
  // process.exit(exitCode);
};

export class GitHubAnnotationsFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(typingDiagnostics) {
    const annotations = [];
    typingDiagnostics.forEach((diagnostic) => {
      const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const end = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
      const annotation = {
        path: path.relative(process.cwd(), diagnostic.file.fileName),
        start_line: start.line + 1,
        end_line: end.line + 1,
        message: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        annotation_level: diagnostic.category === 1 ? 'failure' : 'warning',
      };
      if (annotation.start_line === annotation.end_line) {
        annotation.start_column = start.character + 1;
        annotation.end_column = end.character + 1;
      }
      annotations.push(annotation);
    });
    return JSON.stringify(annotations);
  }
}

export class PrettyFormatter {
  // eslint-disable-next-line class-methods-use-this
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

  format(typingDiagnostics) {
    const fileMessageMap = [];
    typingDiagnostics.forEach((diagnostic) => {
      const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
      const severity = diagnostic.category === 1 ? 'error' : 'warning';
      let filePath = '(unknown)';
      let line = 0;
      let column = 0;
      if (diagnostic.file) {
        filePath = path.relative(process.cwd(), diagnostic.file.fileName);
        const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        line = start.line + 1;
        column = start.character + 1;
      }
      if (!(filePath in fileMessageMap)) {
        fileMessageMap[filePath] = [];
      }
      fileMessageMap[filePath].push({ message, severity, filePath, line, column });
    });
    let totalErrorCount = 0;
    let totalWarningCount = 0;
    let output = Object.keys(fileMessageMap).reduce((accumulatedValue, filePath) => {
      const fileMessages = fileMessageMap[filePath].reduce((innerAccumulatedValue, message) => {
        // const color = message.severity === 'error' ? chalk.red : chalk.yellow;
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
    output += (totalErrorCount || totalWarningCount) ? `\nFailed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green('Passed.');
    return output;
  }
}
