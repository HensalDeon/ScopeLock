import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Architecture rules (see docs/CONVENTIONS.md). ESLint's no-restricted-imports
 * blocks don't merge: a later block replaces an earlier one for matching
 * files, so each scope repeats the rules it still needs.
 */
const moduleEntryOnly = {
  group: ["@/modules/*/*", "!@/modules/*/server"],
  message:
    "Import another module through its public entry: @/modules/<name> (client-safe) or @/modules/<name>/server.",
};

const noRawCollections = {
  name: "@/shared/db/collections",
  message:
    "Module code uses scopedCollection() from @/shared/db/scoped so every query is pinned to a workspace.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
      "no-restricted-imports": ["error", { patterns: [moduleEntryOnly] }],
    },
  },

  // Feature modules: no raw collections, no reaching into other modules.
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [noRawCollections],
          patterns: [
            moduleEntryOnly,
            {
              group: ["../../*"],
              message:
                "Don't reach across modules with relative imports; use the module's public entry.",
            },
          ],
        },
      ],
    },
  },

  // Domain code is pure: no framework, no database, no auth.
  {
    files: ["src/modules/*/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/*",
                "react",
                "react-dom",
                "mongodb",
                "server-only",
                "@/shared/db/*",
                "@/shared/auth/*",
                "!@/shared/auth/policy",
                "@/shared/email/*",
                "@/modules/*",
              ],
              message:
                "domain/ holds pure business rules: no framework, database or auth imports.",
            },
          ],
        },
      ],
    },
  },

  // Shared code never depends on a feature module.
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/modules/**"],
              message: "src/shared must not import from feature modules.",
            },
          ],
        },
      ],
    },
  },

  // Tests may assert on values they just checked, and integration tests may
  // set up state through raw collections (e.g. simulate a later phase).
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-restricted-imports": "off",
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
