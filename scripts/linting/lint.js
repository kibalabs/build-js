import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

import { buildEslintConfig } from './eslint.config.js';
import { buildStylelintConfig } from './stylelint.config.js';
import { buildParams } from '../util.js';


export const runLinting = async (inputParams = {}) => {
  const defaultParams = {
    configModifier: undefined,
    eslintConfigOverride: undefined,
    stylelintConfigModifier: undefined,
    directory: undefined,
    outputFile: undefined,
    outputFileFormat: undefined,
    fix: false,
    skipStylelint: false,
  };
  const params = await buildParams(defaultParams, inputParams);
  const workingDirectory = params.directory || process.cwd();

  // Run ESLint
  const eslintConfig = buildEslintConfig(params);
  const eslint = new ESLint({
    baseConfig: eslintConfig,
    overrideConfig: params.eslintConfigOverride,
    overrideConfigFile: true,
    fix: !!params.fix,
    errorOnUnmatchedPattern: false,
  });
  const eslintResults = await eslint.lintFiles([
    `${workingDirectory}/**/*.js`,
    `${workingDirectory}/**/*.jsx`,
    `${workingDirectory}/**/*.ts`,
    `${workingDirectory}/**/*.tsx`,
  ]);
  if (params.fix) {
    await ESLint.outputFixes(eslintResults);
  }

  // Run Stylelint
  let stylelintResults = [];
  if (!params.skipStylelint) {
    const stylelintConfig = buildStylelintConfig(params);
    const stylelintResult = await stylelint.lint({
      files: [
        `${workingDirectory}/src/**/*.css`,
        `${workingDirectory}/src/**/*.scss`,
      ],
      config: stylelintConfig,
      fix: !!params.fix,
      allowEmptyInput: true,
    });
    stylelintResults = stylelintResult.results;
  }

  // Format and output results
  const formatter = new PrettyFormatter();
  console.log(formatter.formatEslint(eslintResults));
  if (stylelintResults.length > 0) {
    console.log(formatter.formatStylelint(stylelintResults));
  }

  if (params.outputFile) {
    const fileFormat = params.outputFileFormat || 'json';
    const annotationFormatter = new GitHubAnnotationsFormatter();
    let resultText;
    if (fileFormat === 'annotations') {
      const eslintAnnotations = JSON.parse(annotationFormatter.formatEslint(eslintResults));
      const stylelintAnnotations = JSON.parse(annotationFormatter.formatStylelint(stylelintResults));
      resultText = JSON.stringify([...eslintAnnotations, ...stylelintAnnotations]);
    } else {
      const eslintFormatter = await eslint.loadFormatter(fileFormat);
      resultText = eslintFormatter.format(eslintResults);
    }
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, resultText);
  }
};

class GitHubAnnotationsFormatter {
  formatEslint(eslintResults) {
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

  formatStylelint(stylelintResults) {
    const annotations = [];
    stylelintResults.filter((result) => result.warnings.length > 0).forEach((result) => {
      result.warnings.forEach((warning) => {
        const annotation = {
          path: path.relative(process.cwd(), result.source),
          start_line: warning.line,
          end_line: warning.endLine || warning.line,
          message: `[${warning.rule || 'general'}] ${warning.text}`,
          annotation_level: warning.severity === 'error' ? 'failure' : 'warning',
        };
        if (annotation.start_line === annotation.end_line) {
          annotation.start_column = warning.column;
          annotation.end_column = warning.endColumn || warning.column;
        }
        annotations.push(annotation);
      });
    });
    return JSON.stringify(annotations);
  }
}

class PrettyFormatter {
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

  formatEslint(eslintResults) {
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
    output += (totalErrorCount || totalWarningCount) ? `\n${chalk.blue('[ESLint]')} Failed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green('[ESLint] Passed.');
    const fixableSummary = this.getSummary(totalFixableErrorCount, totalFixableWarningCount);
    if (fixableSummary) {
      output += `\n\n${fixableSummary} are fixable with --fix (${chalk.bold('make lint-fix')} if in a @kibalabs formatted repo).`;
    }
    return output;
  }

  formatStylelint(stylelintResults) {
    const fileMessageMap = {};
    stylelintResults.filter((result) => result.warnings.length > 0).forEach((result) => {
      const messages = [];
      const filePath = path.relative(process.cwd(), result.source);
      result.warnings.forEach((warning) => {
        messages.push({
          filePath,
          line: warning.line || 0,
          column: warning.column || 0,
          rule: warning.rule || 'general',
          message: warning.text,
          severity: warning.severity === 'error' ? 'error' : 'warning',
        });
      });
      fileMessageMap[filePath] = messages;
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
    output += (totalErrorCount || totalWarningCount) ? `\n${chalk.blue('[Stylelint]')} Failed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green('[Stylelint] Passed.');
    return output;
  }
}
