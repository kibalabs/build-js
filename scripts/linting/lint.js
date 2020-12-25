const { ESLint } = require('eslint');

const defaultParams = {
  directory: undefined,
  outputFile: undefined,
  fix: false,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const cli = new ESLint({
    baseConfig: require('./eslint-ts.config'),
    useEslintrc: false,
    ignorePattern: [
      '**/node_modules/**',
      './build/**',
      './dist/**',
    ],
    reportUnusedDisableDirectives: true,
  });
  const results = await cli.lintFiles([
    `${params.directory || process.cwd()}/**/*.js`,
    `${params.directory || process.cwd()}/**/*.jsx`,
    `${params.directory || process.cwd()}/**/*.ts`,
    `${params.directory || process.cwd()}/**/*.tsx`,
  ]);
  if (params.outputFile) {
    const formatter = await cli.loadFormatter('json-with-metadata');
    const resultText = formatter.format(results);
    fs.writeFileSync(params.outputFile, resultText);
  } else {
    const formatter = await cli.loadFormatter('stylish');
    console.log(formatter.format(results));
  }
};
