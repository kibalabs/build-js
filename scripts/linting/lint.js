const fs = require('fs');
const path = require('path');

const { ESLint } = require('eslint');

const buildEslintConfig = require('./eslint.config');

const defaultParams = {
  configModifier: undefined,
  directory: undefined,
  outputFile: undefined,
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
    const jsonFormatter = await cli.loadFormatter('json');
    const resultText = jsonFormatter.format(results);
    fs.writeFileSync(params.outputFile, resultText);
  }
};
