import * as fs from 'fs'
import * as path from 'path'

import chalk from 'chalk'
import { ESLint } from 'eslint'

import { removeUndefinedProperties } from '../util.js';
import { buildEslintConfig } from './eslint.config.js';

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
  fix: false,
};

export const runLinting = async (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  let customConfig = null;
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    customConfig = import(path.join(process.cwd(), params.configModifier));
    if (typeof customConfig === 'function') {
      customConfig = customConfig(params);
    }
  }
  const eslintConfig = buildEslintConfig(params);
  const eslint = new ESLint({
    baseConfig: eslintConfig,
    overrideConfig: customConfig,
    useEslintrc: false,
    reportUnusedDisableDirectives: 'warn',
    errorOnUnmatchedPattern: false,
    fix: !!params.fix,
  });
  const results = await eslint.lintFiles([
    `${params.directory || process.cwd()}/**/*.js`,
    `${params.directory || process.cwd()}/**/*.jsx`,
    `${params.directory || process.cwd()}/**/*.ts`,
    `${params.directory || process.cwd()}/**/*.tsx`,
  ]);

  if (params.fix) {
    await ESLint.outputFixes(results);
  }

  console.log(new PrettyFormatter().format(results));
  if (params.outputFile) {
    const fileFormat = params.outputFileFormat || 'json';
    const formatter = fileFormat === 'annotations' ? new GitHubAnnotationsFormatter() : await eslint.loadFormatter(fileFormat);
    const resultText = formatter.format(results);
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, resultText);
  }
};

class GitHubAnnotationsFormatter {
  // eslint-disable-next-line class-methods-use-this
  format(eslintResults) {
    const annotations = [];
    eslintResults.filter((result) => result.errorCount > 0 || result.warningCount > 0).forEach((result) => {
      result.messages.filter((message) => message.severity > 0).forEach((message) => {
        const annotation = {
          path: path.relative(process.cwd(), result.filePath),
          start_line: message.line,
          end_line: message.endLine || message.line,
          message: `[${message.ruleId || 'general'}] ${message.message}`,
          annotation_level: message.severity === 2 ? 'failure' : 'warning',
        };
        if (annotation.start_line === annotation.end_line) {
          annotation.start_column = message.column;
          annotation.end_column = message.endColumn || message.column;
        }
        annotations.push(annotation);
      });
    });
    return JSON.stringify(annotations);
  }
}

class PrettyFormatter {
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

  format(eslintResults) {
    const fileMessageMap = {};
    let totalFixableErrorCount = 0;
    let totalFixableWarningCount = 0;
    eslintResults.filter((result) => result.errorCount > 0 || result.warningCount > 0).forEach((result) => {
      const messages = [];
      const filePath = path.relative(process.cwd(), result.filePath);
      result.messages.filter((message) => message.severity > 0).forEach((message) => {
        messages.push({
          filePath,
          line: message.line || 0,
          column: message.column || 0,
          rule: message.ruleId || 'general',
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning',
        });
      });
      fileMessageMap[filePath] = messages;
      totalFixableErrorCount += result.fixableErrorCount;
      totalFixableWarningCount += result.fixableWarningCount;
    });
    let totalErrorCount = 0;
    let totalWarningCount = 0;
    let output = Object.keys(fileMessageMap).reduce((accumulatedValue, filePath) => {
      const fileMessages = fileMessageMap[filePath].reduce((innerAccumulatedValue, message) => {
        const color = message.severity === 'error' ? chalk.red : chalk.yellow;
        const location = chalk.grey(`${message.filePath}:${message.line}:${message.column}`);
        innerAccumulatedValue.push(`${location} [${color(message.rule)}] ${message.message}`);
        return innerAccumulatedValue;
      }, []);
      const errorCount = fileMessageMap[filePath].filter((message) => message.severity === 'error').length;
      totalErrorCount += errorCount;
      const warningCount = fileMessageMap[filePath].filter((message) => message.severity !== 'error').length;
      totalWarningCount += warningCount;
      return `${accumulatedValue}\n${this.getSummary(errorCount, warningCount)} in ${filePath}\n${fileMessages.join('\n')}\n`;
    }, '');
    output += (totalErrorCount || totalWarningCount) ? `\nFailed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green('Passed.');
    const fixableSummary = this.getSummary(totalFixableErrorCount, totalFixableWarningCount);
    if (fixableSummary) {
      output += `\n\n${fixableSummary} are fixable with --fix (${chalk.bold('npm run lint-fix')} if in a @kibalabs formatted repo).`;
    }
    return output;
  }
}
