const fs = require('fs');
const path = require('path');


module.exports = (inputParams = {}) => {
  const defaultParams = {
    dev: false,
    packageFilePath: path.join(process.cwd(), './package.json'),
    name: undefined,
    entryFilePath: path.join(process.cwd(), './src/index.ts'),
    outputDirectory: path.join(process.cwd(), './dist'),
  };
  const params = { ...defaultParams, ...inputParams };
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;
  return {
    entry: [
      params.entryFilePath,
    ],
    target: 'node',
    output: {
      filename: 'index.js',
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: params.outputDirectory,
      library: name,
    },
  };
};
