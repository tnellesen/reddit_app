module.exports = {
  env: {
    browser: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    'babel',
    '@typescript-eslint',
  ],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    'max-len': [2, 120, 4, { ignoreUrls: true }],
    'comma-dangle': [1, 'always-multiline'],
    'no-plusplus': 0,
    'jsx-a11y/label-has-associated-control': [1, {
      required: {
        some: ['nesting', 'id'],
      },
    }],
    'jsx-a11y/label-has-for': [1, {
      required: {
        some: ['nesting', 'id'],
      },
    }],
    'import/prefer-default-export': 'off',
    'import/extensions': [1, 'never'],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'no-unused-vars': 'off',
    'no-return-assign': 1,
    'implicit-arrow-linebreak': 'off',
    'react/require-default-props': 'off',
    'react/no-array-index-key': 1,
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-unused-expressions': 1,
    'no-unused-expressions': 0,
    'no-nested-ternary': 0,
    'babel/no-unused-expressions': 1,
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
  },
};
