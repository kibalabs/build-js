const fs = require('fs');
const path = require('path');

const defaultParams = {
  entryFile: undefined,
  outputPath: undefined,
};

module.exports = (inputParams = {}) => {
  const params = {...defaultParams, ...inputParams};
  const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8'));
  return {
    name: package.name,
    entry: [
      params.entryFile || path.join(process.cwd(), './src/index.ts'),
    ],
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },
    output: {
      filename: '[name].js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: params.outputPath || path.join(process.cwd(), './dist'),
      library: package.name,
      pathinfo: false,
    }
  };
}
