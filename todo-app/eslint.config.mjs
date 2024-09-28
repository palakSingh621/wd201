import globals from "globals";
import pluginJs from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.browser } },
  {
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...jestPlugin.environments.globals.globals, // Include Jest globals
      },
    },
  },
  {
    // other ESLint configuration options
    ignores: [
      "migrations",
      "models",
      // Add any other paths you want to ignore
    ],
  },
  pluginJs.configs.recommended,
];
