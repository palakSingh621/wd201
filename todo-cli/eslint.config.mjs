import globals from "globals";
import pluginJs from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.browser, // Combine the browser globals with your files configuration
    },
  },
  pluginJs.configs.recommended,
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
      "node_modules",
      "build",
      "dist",
      // Add any other paths you want to ignore
    ],
  }
];
