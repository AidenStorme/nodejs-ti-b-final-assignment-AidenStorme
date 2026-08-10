const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/",
      "coverage/",
      "logs/",
      "examples/",
      "docs/",
      "http/",
      "tests/manual-tests.http",
      ".opencode/",
      ".agents/",
      ".vscode/",
      ".env*",
      "!.env.example",
      "atlas-credentials.env",
    ],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
];
