module.exports = {
  defaultSeverity: 'warning',
  rules: {
    'color-hex-case': 'lower',
    'color-hex-length': 'long',
    'color-named': 'never',
    'font-weight-notation': 'numeric',

    'block-no-empty': null,
    'block-closing-brace-newline-after': 'always',
    'block-closing-brace-newline-before': 'always',
    'block-opening-brace-newline-after': 'always',
    'block-opening-brace-space-before': 'always',

    'color-no-invalid-hex': true,
    'declaration-colon-space-after': 'always',
    'declaration-block-semicolon-newline-after': 'always',
    indentation: [4, {
      except: ['value']
    }],
    'max-empty-lines': 2,
    'unit-whitelist': ['rem', 'em', '%', 'px', 's', 'deg', 'dpi', 'vh', 'fr'],
    'max-nesting-depth': 6,
    'no-extra-semicolons': true,
    'selector-attribute-brackets-space-inside': 'never',
    'selector-attribute-operator-space-after': 'never',
    'declaration-block-no-duplicate-properties': [true, {
      ignore: ['consecutive-duplicates']
    }]
  }
};
