const fs = require('fs');
const path = require('path');

const defaultParams = {
  dev: false,
  packagePath: undefined,
  name: undefined,
  entryFile: undefined,
  outputPath: undefined,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const packagePath = params.packagePath || path.join(process.cwd(), './package.json');
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
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
      path: params.outputPath || path.join(process.cwd(), './dist'),
      library: name,
    }
  };
}
