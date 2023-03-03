const fs = require('fs');
const path = require('path');

const getExternalModules = (packageData) => {
  return Object.keys(packageData.dependencies || {})
    .concat(Object.keys(packageData.peerDependencies || {}))
    .concat(Object.keys(packageData.optionalDependencies || {}));
};

const isExternalPackageRequest = (packageData, request) => {
  const externalModules = getExternalModules(packageData);
  return isExternalModuleRequest(externalModules, request);
};

const isExternalModuleRequest = (externalModules, request) => {
  if (request.endsWith('.css')) {
    return false;
  }
  return externalModules.includes(request) || externalModules.some((packageName) => request.indexOf(`${packageName}/`) === 0);
};

const getNodeModules = (nodeModulesDirectory) => {
  const moduleNames = fs.readdirSync(nodeModulesDirectory);
  const resolvedModules = moduleNames.map((moduleName) => {
    if (moduleName.startsWith('@')) {
      return fs.readdirSync(path.join(nodeModulesDirectory, moduleName)).map((innerModuleName) => {
        return path.join(moduleName, innerModuleName);
      });
    }
    return moduleName;
  });
  const allModules = resolvedModules.reduce((previousValue, currentValue) => {
    return previousValue.concat(currentValue);
  }, []);
  return allModules;
};

module.exports = {
  getExternalModules,
  isExternalModuleRequest,
  isExternalPackageRequest,
  getNodeModules,
};
