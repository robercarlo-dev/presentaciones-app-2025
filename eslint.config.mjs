import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.css"],
    languageOptions: {
      parser: require.resolve("postcss-eslint-parser"),
    },
    rules: {
      "css/unknownAtRules": ["warn", {
        ignoreAtRules: ["theme"]
      }]
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;