import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { glob } from 'glob';

import { buildTsConfig } from './ts.config.js';
import { runTsc } from './tsc.js';
import { buildParams } from '../util.js';

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
};

export const runTyping = async (inputParams = {}) => {
  const params = await buildParams(defaultParams, inputParams);
  const tsConfig = buildTsConfig(params);
  // NOTE(krishan711): I couldn't find a way to filter node_modules in the glob (filtering needed for lerna repos)
  const files = glob.sync(path.join(params.directory || './src', '**', '*.{ts,tsx}'));
  const filteredFiles = files.filter((file) => !file.includes('/node_modules/'));
  const allDiagnostics = runTsc(filteredFiles, {
    ...tsConfig.compilerOptions,
    noEmit: true,
  });
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
  format(typingDiagnostics) {
    const annotations = [];
    typingDiagnostics.forEach((diagnostic) => {
      if (!diagnostic.filePath) {
        return;
      }
      annotations.push({
        path: diagnostic.filePath,
        start_line: diagnostic.line,
        end_line: diagnostic.line,
        start_column: diagnostic.column,
        end_column: diagnostic.column,
        message: diagnostic.messageLines.join('\n'),
        annotation_level: diagnostic.category === 'error' ? 'failure' : 'warning',
      });
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

  format(typingDiagnostics) {
    const fileMessageMap = [];
    typingDiagnostics.forEach((diagnostic) => {
      const message = diagnostic.messageLines.join(' ');
      const severity = diagnostic.category === 'error' ? 'error' : 'warning';
      const filePath = diagnostic.filePath || '(unknown)';
      const { line, column } = diagnostic;
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
