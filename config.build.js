
export default (config) => {
  const newConfig = config;
  newConfig.eslintConfigOverride = {
    rules: {
      'no-console': 'off',
      'class-methods-use-this': 'off',
    },
  };
  return newConfig;
};
