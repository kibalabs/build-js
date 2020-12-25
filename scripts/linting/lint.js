const fs = require('fs');
const { ESLint } = require('eslint');

const buildEslintConfig = require('./eslint.config')

const defaultParams = {
  directory: undefined,
  outputFile: undefined,
  fix: false,
};

module.exports = async (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  // TODO(krishan711): allow use a local config if available
  const eslintConfig = buildEslintConfig(params);
  const cli = new ESLint({
    baseConfig: eslintConfig,
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
    const jsonFormatter = await cli.loadFormatter('json-with-metadata');
    const resultText = jsonFormatter.format(results);
    fs.writeFileSync(params.outputFile, resultText);
  }
};
