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
  if (!params.configModifier) {
    return params;
  }
  const configModifier = (await import(path.join(process.cwd(), params.configModifier))).default;
  let newParams = params;
  if (configModifier.constructor.name === 'AsyncFunction') {
    newParams = await configModifier(params);
  } else {
    newParams = configModifier(params);
  }
  return newParams;
};

module.exports = {
  removeUndefinedProperties,
  runParamsConfigModifier,
};
