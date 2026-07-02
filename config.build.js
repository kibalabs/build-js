
export default (config) => {
  const newConfig = config;
  newConfig.eslintConfigOverride = {
    rules: {
      'no-console': 'off',
      'class-methods-use-this': 'off',
    },
  };
  newConfig.oxlintConfigModifier = (oxlintConfig) => {
    const newOxlintConfig = oxlintConfig;
    newOxlintConfig.rules['no-console'] = 'off';
    newOxlintConfig.rules['class-methods-use-this'] = 'off';
    return newOxlintConfig;
  };
  return newConfig;
};
