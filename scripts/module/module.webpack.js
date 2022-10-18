import fs from 'fs';
import path from 'path';

import webpack from 'webpack';

import { getExternalModules, getNodeModules, isExternalModuleRequest } from '../common/packageUtil.js';
import { removeUndefinedProperties } from '../util.js';

const defaultParams = {
  dev: undefined,
  packageFilePath: undefined,
  name: undefined,
  entryFilePath: undefined,
  outputDirectory: undefined,
  excludeAllNodeModules: undefined,
  nodeModulesPath: undefined,
  nodeModulesPaths: undefined,
  outputFilename: 'index.js',
};

export const buildModuleWebpackConfig = (inputParams = {}) => {
  const params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  const packageData = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || packageData.name;
  const externalModules = [];
  if (params.excludeAllNodeModules) {
    const nodeModulesPaths = params.nodeModulesPaths || [params.nodeModulesPath || path.join(process.cwd(), './node_modules')];
    nodeModulesPaths.forEach((nodeModulesPath) => {
      externalModules.push(...getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...getExternalModules(packageData));
  }

  return {
    entry: [
      params.entryFilePath,
    ],
    target: 'node',
    output: {
      filename: params.outputFilename,
      umdNamedDefine: true,
      path: params.outputDirectory,
      chunkFilename: '[name].bundle.js',
      library: name,
      libraryTarget: 'umd',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_NAME': JSON.stringify(name),
        'process.env.PACKAGE_VERSION': JSON.stringify(packageData.version),
      }),
    ],
    externals: [
      ({ request }, callback) => {
        if (isExternalModuleRequest(externalModules, request)) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      },
    ],
    devtool: params.dev ? 'source-map' : false,
  };
};
