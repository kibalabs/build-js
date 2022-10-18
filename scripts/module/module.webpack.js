import fs from 'fs';
import path from 'path';

import webpack from 'webpack';

import { getExternalModules, getNodeModules, isExternalModuleRequest } from '../common/packageUtil.js';
import { removeUndefinedProperties } from '../util';

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
  const package = JSON.parse(fs.readFileSync(params.packageFilePath, 'utf8'));
  const name = params.name || package.name;
  const externalModules = [];
  if (params.excludeAllNodeModules) {
    const nodeModulesPaths = params.nodeModulesPaths || [params.nodeModulesPath || path.join(process.cwd(), './node_modules')];
    nodeModulesPaths.forEach((nodeModulesPath) => {
      externalModules.push(...getNodeModules(nodeModulesPath));
    });
  } else {
    externalModules.push(...getExternalModules(package));
  }

  return {
    entry: [
      params.entryFilePath,
    ],
    target: 'node',
    output: {
      filename: params.outputFilename,
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: params.outputDirectory,
      library: name,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_NAME': JSON.stringify(name),
        'process.env.PACKAGE_VERSION': JSON.stringify(package.version),
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
