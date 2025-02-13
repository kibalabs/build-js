import fs from 'node:fs';
import path from 'node:path';

export const removeUndefinedProperties = (obj) => {
  return Object.keys(obj).reduce((current, key) => {
    if (obj[key] !== undefined) {
      // eslint-disable-next-line no-param-reassign
      current[key] = obj[key];
    }
    return current;
  }, {});
};

export const runParamsConfigModifier = async (params) => {
  let newParams = params;
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      newParams = await configModifier(params);
    } else {
      newParams = configModifier(params);
    }
  }
  return newParams;
};

export const getNodeModuleName = (importPath) => {
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

export const getNodeModuleSize = (moduleName, projectRoot) => {
  const modulePath = findModulePath(moduleName, projectRoot);
  if (!modulePath) {
    return 0;
  }
  return calculateFolderSize(modulePath);
};

export const findModulePath = (moduleName, projectRoot) => {
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

export const calculateFolderSize = (folderPath) => {
  let size = 0;
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += calculateFolderSize(filePath);
    } else {
      size += stats.size;
    }
  });
  return size;
};

export const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.size;
};

export const getFileSizes = (filePaths) => {
  return filePaths.reduce((accumulator, filePath) => {
    accumulator[filePath] = getFileSize(filePath);
    return accumulator;
  }, {});
};
