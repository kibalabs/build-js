const fs = require('fs');
const path = require('path');

const { ESLint } = require('eslint');

const buildEslintConfig = require('./eslint.config');

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
  outputFileFormat: undefined,
  fix: false,
};

module.exports = async (inputParams = {}) => {
  const params = { ...defaultParams, ...inputParams };
  let customConfig = null;
  if (params.configModifier) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    customConfig = require(path.join(process.cwd(), params.configModifier));
    if (typeof customConfig === 'function') {
      customConfig = customConfig(params);
    }
  }
  const eslintConfig = buildEslintConfig(params);
  const cli = new ESLint({
    baseConfig: eslintConfig,
    overrideConfig: customConfig,
    useEslintrc: false,
    reportUnusedDisableDirectives: 'warn',
    errorOnUnmatchedPattern: false,
    fix: !!params.fix,
  });
  const results = await cli.lintFiles([
    `${params.directory || process.cwd()}/**/*.js`,
    `${params.directory || process.cwd()}/**/*.jsx`,
    `${params.directory || process.cwd()}/**/*.ts`,
    `${params.directory || process.cwd()}/**/*.tsx`,
  ]);

  if (params.fix) {
    await ESLint.outputFixes(results);
  }

  const stylishFormatter = await cli.loadFormatter('stylish');
  console.log(stylishFormatter.format(results));
  if (params.outputFile) {
    const fileFormat = params.outputFileFormat || 'json';
    const formatter = fileFormat === 'annotations' ? new AnnotationsFormatter() : await cli.loadFormatter(fileFormat);
    const resultText = formatter.format(results);
    fs.writeFileSync(params.outputFile, resultText);
  }
};

class AnnotationsFormatter {
  format(eslintResults) {
    const annotations = []
    eslintResults.filter(result => result.errorCount > 0 || result.warningCount > 0).forEach((result) => {
      console.log(result);
      result.messages.filter(message => message.severity > 0).forEach((message) => {
        annotations.push({
          file: result.filePath,
          start_line: message.line,
          end_line: message.endLine,
          start_column: message.line === message.endLine ? message.column : undefined,
          end_column: message.line === message.endLine ? message.endColumn : undefined,
          message: `[${message.ruleId}] ${message.message}`,
          annotation_level: message.severity === 1 ? 'warning' : 'failure',
        });
      });
    });
    return JSON.stringify(annotations);
  }
}
