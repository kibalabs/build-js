const fs = require('fs');
const path = require('path');

const removeUndefinedProperties = (obj) => {
  return Object.keys(obj).reduce((current, key) => {
    if (obj[key] !== undefined) {
      // eslint-disable-next-line no-param-reassign
      current[key] = obj[key];
    }
    return current;
  }, {});
};

const runParamsConfigModifier = async (params) => {
  let newParams = params;
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      newParams = await configModifier(params);
    } else {
      newParams = configModifier(params);
    }
  }
  process.env.NODE_ENV = newParams.dev ? 'development' : 'production';
  return newParams;
};

const getNodeModuleName = (importPath) => {
  const nodeModulesIndex = importPath.indexOf('node_modules/');
  if (nodeModulesIndex === -1) {
    return null;
  }
  const startIndex = nodeModulesIndex + 'node_modules/'.length;
  let endIndex = importPath.indexOf('/', startIndex);
  if (endIndex === -1) {
    endIndex = importPath.length; // Handle cases where there are no more slashes after node_modules
  }
  let moduleName = importPath.substring(startIndex, endIndex);
  if (moduleName.startsWith('@')) {
    const nextSlashIndex = importPath.indexOf('/', endIndex + 1);
    if (nextSlashIndex !== -1) {
      moduleName = importPath.substring(startIndex, nextSlashIndex);
    } else {
      moduleName = importPath.substring(startIndex); // handles cases where the package is directly in node_modules
    }
  }
  const queryParamIndex = moduleName.indexOf('?');
  return queryParamIndex === -1 ? moduleName : moduleName.substring(0, queryParamIndex);
};

const getNodeModuleSize = (moduleName, projectRoot) => {
  const modulePath = findModulePath(moduleName, projectRoot);
  if (!modulePath) {
    return null;
  }
  return calculateFolderSize(modulePath);
};

const findModulePath = (moduleName, projectRoot) => {
  const potentialPaths = [
    path.join(projectRoot, 'node_modules', moduleName),
    path.join(projectRoot, 'node_modules', '@types', moduleName),
  ];
  for (let index = 0; index < potentialPaths.length; index += 1) {
    const potentialPath = potentialPaths[index];
    if (fs.existsSync(potentialPath)) {
      return potentialPath;
    }
  }
  return null;
};

const calculateFolderSize = (folderPath) => {
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(folderPath);
    entries.forEach((entry) => {
      const fullPath = path.join(folderPath, entry);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        totalSize += calculateFolderSize(fullPath);
      } else if (stats.isFile()) {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    console.error(`Error reading or calculating size for ${folderPath}:`, error);
    return 0;
  }
  return totalSize;
};

const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.size;
};

const getFileSizes = (filePaths) => {
  return filePaths.reduce((current, filePath) => {
    // eslint-disable-next-line no-param-reassign
    current += getFileSize(filePath);
    return current;
  }, 0);
};

module.exports = {
  removeUndefinedProperties,
  runParamsConfigModifier,
  getNodeModuleName,
  getNodeModuleSize,
  getFileSize,
  getFileSizes,
};
