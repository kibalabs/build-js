const fs = require('fs');
const path = require('path');

const getExternalModules = (package) => {
  return Object.keys(package.dependencies || {})
    .concat(Object.keys(package.peerDependencies || {}))
    .concat(Object.keys(package.optionalDependencies || {}));
}

const isExternalPackageRequest = (package, request) => {
  const externalModules = getExternalModules(package);
  return isExternalModuleRequest(externalModules, request);
}

const isExternalModuleRequest = (externalModules, request) => {
  return externalModules.includes(request) || externalModules.some(packageName => request.indexOf(`${packageName}/`) === 0);
}

const getNodeModules = (nodeModulesDirectory) => {
  const moduleNames = fs.readdirSync(nodeModulesDirectory);
  const resolvedModules = moduleNames.map((moduleName) => {
    if (moduleName.startsWith('@')) {
      return fs.readdirSync(path.join(nodeModulesDirectory, moduleName)).map((innerModuleName) => {
        return path.join(moduleName, innerModuleName);
      });
    } else {
      return moduleName;
    }
  });
  const allModules = resolvedModules.reduce((previousValue, currentValue) => {
    return previousValue.concat(currentValue);
  }, []);
  return allModules;
}

module.exports = {
  getExternalModules: getExternalModules,
  getExternalPackages: getExternalModules,
  isExternalModuleRequest: isExternalModuleRequest,
  isExternalPackageRequest: isExternalPackageRequest,
  getNodeModules: getNodeModules,
};
