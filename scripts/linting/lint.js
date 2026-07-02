import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import chalk from 'chalk';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

import { buildEslintConfig } from './eslint.config.js';
import { buildOxfmtConfig } from './oxfmt.config.js';
import { buildOxlintConfig } from './oxlint.config.js';
import { buildStylelintConfig } from './stylelint.config.js';
import { buildParams } from '../util.js';

const execFileAsync = promisify(execFile);

export const runLinting = async (inputParams = {}) => {
  const defaultParams = {
    engine: 'eslint',
    configModifier: undefined,
    eslintConfigOverride: undefined,
    oxlintConfigModifier: undefined,
    oxfmtConfigModifier: undefined,
    stylelintConfigModifier: undefined,
    directory: undefined,
    outputFile: undefined,
    outputFileFormat: undefined,
    fix: false,
    skipStylelint: false,
  };
  const params = await buildParams(defaultParams, inputParams);
  const workingDirectory = params.directory || process.cwd();

  let jsDiagnosticGroups;
  if (params.engine === 'eslint') {
    jsDiagnosticGroups = await runEslint(params, workingDirectory);
  } else if (params.engine === 'oxlint') {
    jsDiagnosticGroups = await runOxlint(params, workingDirectory);
  } else {
    throw new Error(`Unknown lint engine '${params.engine}'. Must be one of ['eslint', 'oxlint']`);
  }

  // Run Stylelint (CSS/SCSS isn't covered by either JS engine)
  let stylelintDiagnosticGroup = null;
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
    stylelintDiagnosticGroup = { label: 'Stylelint', diagnostics: stylelintResultsToDiagnostics(stylelintResult.results) };
  }

  const diagnosticGroups = [...jsDiagnosticGroups, ...(stylelintDiagnosticGroup ? [stylelintDiagnosticGroup] : [])];

  const formatter = new PrettyFormatter();
  diagnosticGroups.forEach((diagnosticGroup) => {
    console.log(formatter.format(diagnosticGroup));
  });

  if (params.outputFile) {
    const fileFormat = params.outputFileFormat || 'json';
    let resultText;
    if (fileFormat === 'annotations') {
      const annotationFormatter = new GitHubAnnotationsFormatter();
      resultText = annotationFormatter.format(diagnosticGroups);
    } else {
      resultText = JSON.stringify(diagnosticGroups);
    }
    console.log(`Saving lint results to ${params.outputFile}`);
    fs.writeFileSync(params.outputFile, resultText);
  }
};

const runEslint = async (params, workingDirectory) => {
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
  const fixableErrorCount = eslintResults.reduce((total, result) => total + result.fixableErrorCount, 0);
  const fixableWarningCount = eslintResults.reduce((total, result) => total + result.fixableWarningCount, 0);
  return [{
    label: 'ESLint', diagnostics: eslintResultsToDiagnostics(eslintResults), fixableErrorCount, fixableWarningCount,
  }];
};

const runOxlint = async (params, workingDirectory) => {
  const oxlintConfig = buildOxlintConfig(params);
  const oxfmtConfig = buildOxfmtConfig(params);
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kibalabs-build-oxlint-'));
  const oxlintConfigFile = path.join(tempDirectory, '.oxlintrc.json');
  const oxfmtConfigFile = path.join(tempDirectory, '.oxfmtrc.json');
  fs.writeFileSync(oxlintConfigFile, JSON.stringify(oxlintConfig));
  fs.writeFileSync(oxfmtConfigFile, JSON.stringify(oxfmtConfig));
  try {
    const oxlintArgs = [
      '-c', oxlintConfigFile,
      '--format', 'json',
      ...(params.fix ? ['--fix'] : []),
      workingDirectory,
    ];
    const oxlintOutput = await runNodeBin('oxlint', oxlintArgs);
    const oxlintDiagnostics = oxlintJsonToDiagnostics(JSON.parse(oxlintOutput || '{}'));

    const oxfmtArgs = [
      '-c', oxfmtConfigFile,
      ...(params.fix ? [] : ['--list-different']),
      workingDirectory,
    ];
    const oxfmtOutput = await runNodeBin('oxfmt', oxfmtArgs);
    const oxfmtDiagnostics = params.fix ? [] : oxfmtListDifferentToDiagnostics(oxfmtOutput);

    return [
      { label: 'Oxlint', diagnostics: oxlintDiagnostics },
      { label: 'Oxfmt', diagnostics: oxfmtDiagnostics },
    ];
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
};

const runNodeBin = async (packageName, args) => {
  // NOTE: packages like oxlint/oxfmt restrict their `exports` field to the main entrypoint, so the `bin`
  // script path isn't resolvable directly - resolve `package.json` (which is always exported) instead
  const packageJsonPath = fileURLToPath(import.meta.resolve(`${packageName}/package.json`));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const binPath = path.join(path.dirname(packageJsonPath), packageJson.bin[packageName]);
  try {
    const { stdout } = await execFileAsync(process.execPath, [binPath, ...args], { maxBuffer: 1024 * 1024 * 100 });
    return stdout;
  } catch (error) {
    // Both oxlint and oxfmt exit with a non-zero code when they find issues, which is expected here
    if (error.stdout !== undefined) {
      return error.stdout;
    }
    throw error;
  }
};

const eslintResultsToDiagnostics = (eslintResults) => {
  const diagnostics = [];
  eslintResults.filter((result) => result.errorCount > 0 || result.warningCount > 0).forEach((result) => {
    const filePath = path.relative(process.cwd(), result.filePath);
    result.messages.filter((message) => message.severity > 0).forEach((message) => {
      diagnostics.push({
        filePath,
        line: message.line || 0,
        column: message.column || 0,
        endLine: message.endLine || message.line || 0,
        endColumn: message.endColumn || message.column || 0,
        rule: message.ruleId || 'general',
        message: message.message,
        severity: message.severity === 2 ? 'error' : 'warning',
      });
    });
  });
  return diagnostics;
};

const stylelintResultsToDiagnostics = (stylelintResults) => {
  const diagnostics = [];
  stylelintResults.filter((result) => result.warnings.length > 0).forEach((result) => {
    const filePath = path.relative(process.cwd(), result.source);
    result.warnings.forEach((warning) => {
      diagnostics.push({
        filePath,
        line: warning.line || 0,
        column: warning.column || 0,
        endLine: warning.endLine || warning.line || 0,
        endColumn: warning.endColumn || warning.column || 0,
        rule: warning.rule || 'general',
        message: warning.text,
        severity: warning.severity === 'error' ? 'error' : 'warning',
      });
    });
  });
  return diagnostics;
};

const oxlintJsonToDiagnostics = (oxlintOutput) => {
  const diagnostics = [];
  (oxlintOutput.diagnostics || []).forEach((diagnostic) => {
    const label = diagnostic.labels && diagnostic.labels[0];
    const span = label ? label.span : undefined;
    const line = span ? span.line : 0;
    const column = span ? span.column : 0;
    diagnostics.push({
      filePath: path.relative(process.cwd(), diagnostic.filename),
      line,
      column,
      // NOTE: oxlint's JSON output only gives the start of the span, so multi-line spans will report an
      // approximate end position (same line, column shifted by the span length)
      endLine: line,
      endColumn: span ? span.column + span.length : column,
      rule: diagnostic.code || 'general',
      message: diagnostic.message,
      severity: diagnostic.severity === 'error' ? 'error' : 'warning',
    });
  });
  return diagnostics;
};

const oxfmtListDifferentToDiagnostics = (oxfmtOutput) => {
  return oxfmtOutput.split('\n').map((line) => line.trim()).filter((line) => line.length > 0).map((filePath) => ({
    filePath: path.relative(process.cwd(), path.resolve(filePath)),
    line: 1,
    column: 1,
    endLine: 1,
    endColumn: 1,
    rule: 'format',
    message: 'File is not formatted correctly. Run with --fix to format it.',
    severity: 'error',
  }));
};

class GitHubAnnotationsFormatter {
  format(diagnosticGroups) {
    const annotations = [];
    diagnosticGroups.forEach((diagnosticGroup) => {
      diagnosticGroup.diagnostics.forEach((diagnostic) => {
        const annotation = {
          path: diagnostic.filePath,
          start_line: diagnostic.line,
          end_line: diagnostic.endLine || diagnostic.line,
          message: `[${diagnostic.rule}] ${diagnostic.message}`,
          annotation_level: diagnostic.severity === 'error' ? 'failure' : 'warning',
        };
        if (annotation.start_line === annotation.end_line) {
          annotation.start_column = diagnostic.column;
          annotation.end_column = diagnostic.endColumn || diagnostic.column;
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

  format(diagnosticGroup) {
    const { label, diagnostics, fixableErrorCount, fixableWarningCount } = diagnosticGroup;
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
        const color = message.severity === 'error' ? chalk.red : chalk.yellow;
        const location = chalk.grey(`${filePath}:${message.line}:${message.column}`);
        innerAccumulatedValue.push(`${location} [${color(message.rule)}] ${message.message}`);
        return innerAccumulatedValue;
      }, []);
      const errorCount = fileMessageMap[filePath].filter((message) => message.severity === 'error').length;
      totalErrorCount += errorCount;
      const warningCount = fileMessageMap[filePath].filter((message) => message.severity !== 'error').length;
      totalWarningCount += warningCount;
      return `${accumulatedValue}\n${this.getSummary(errorCount, warningCount)} in ${filePath}\n${fileMessages.join('\n')}\n`;
    }, '');
    output += (totalErrorCount || totalWarningCount) ? `\n${chalk.blue(`[${label}]`)} Failed due to ${this.getSummary(totalErrorCount, totalWarningCount)}.` : chalk.green(`[${label}] Passed.`);
    const fixableSummary = this.getSummary(fixableErrorCount || 0, fixableWarningCount || 0);
    if (fixableSummary) {
      output += `\n\n${fixableSummary} are fixable with --fix (${chalk.bold('make lint-fix')} if in a @kibalabs formatted repo).`;
    }
    return output;
  }
}
