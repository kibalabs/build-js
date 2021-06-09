const fs = require('fs');
const path = require('path');

const defaultParams = {
  dev: false,
  packageFilePath: undefined,
  name: undefined,
  entryFile: undefined,
  outputDirectory: undefined,
};

module.exports = (inputParams = {}) => {
  const params = { ...defaultParams, ...inputParams };
  const packageFilePath = params.packageFilePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
  const outputDirectory = params.outputDirectory || path.join(process.cwd(), './dist');
  const name = params.name || package.name;
  return {
    entry: params.entryFile || path.join(process.cwd(), './src/index.ts'),
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      filename: 'index.js',
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: outputDirectory,
      library: name,
    },
  };
};
