export const buildStylelintConfig = (params = {}) => {
  const config = {
    // Instead of extending stylelint-config-standard-scss, we define rules inline
    // This avoids resolution issues when the package is linked
    customSyntax: 'postcss-scss',
    rules: {
      // Standard SCSS rules
      'block-no-empty': true,
      'color-no-invalid-hex': true,
      'declaration-block-no-duplicate-properties': true,
      'declaration-block-no-shorthand-property-overrides': true,
      'font-family-no-duplicate-names': true,
      'function-calc-no-unspaced-operator': true,
      'media-feature-name-no-unknown': true,
      'no-descending-specificity': null,
      'no-duplicate-at-import-rules': true,
      'no-duplicate-selectors': true,
      'no-invalid-double-slash-comments': null,
      'property-no-unknown': true,
      'selector-pseudo-class-no-unknown': [true, {
        ignorePseudoClasses: ['global', 'local'],
      }],
      'selector-pseudo-element-no-unknown': true,
      'selector-type-no-unknown': [true, {
        ignore: ['custom-elements'],
      }],
      'string-no-newline': true,
      'unit-no-unknown': true,
      // Allow any selector class pattern (we use camelCase in some places)
      'selector-class-pattern': null,
      // Allow empty files (common for placeholder files)
      'no-empty-source': null,
      // Don't require quotes around font family names
      'font-family-name-quotes': null,
      // Allow color functions
      'color-function-notation': null,
      // Allow alpha-value as number or percentage
      'alpha-value-notation': null,
      // Allow vendor prefixes (for broader browser support)
      'property-no-vendor-prefix': null,
      'value-no-vendor-prefix': null,
      // Don't enforce specific notation for gradients
      'hue-degree-notation': null,
      // SCSS specific - allow @use, @forward, @layer
      'at-rule-no-unknown': [true, {
        ignoreAtRules: ['use', 'forward', 'layer', 'include', 'mixin', 'if', 'else', 'each', 'for', 'function', 'return', 'warn', 'error', 'at-root', 'extend'],
      }],
    },
  };
  if (params.stylelintConfigModifier) {
    return params.stylelintConfigModifier(config);
  }
  return config;
};
