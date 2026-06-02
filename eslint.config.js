import { base, json, yaml, react } from '@etchteam/eslint-config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  ...base,
  ...json,
  ...yaml,
  ...react,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        pragma: 'h',
        version: '18',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];
