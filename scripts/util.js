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

export const buildParams = async (defaultParams, inputParams, allowDev = true) => {
  let params = { ...defaultParams, ...removeUndefinedProperties(inputParams) };
  if (params.configModifier) {
    const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
    if (configModifier.constructor.name === 'AsyncFunction') {
      params = await configModifier(params);
    } else {
      params = configModifier(params);
    }
  }
  params.dev = process.env.NODE_ENV !== 'production';
  if (params.dev && !allowDev) {
    throw new Error('Dev mode not supported yet - please set NODE_ENV=production');
  }
  return params;
};

export const getNodeModuleName = (importPath) => {
  const nodeModulesIndex = importPath.lastIndexOf('node_modules/');
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
