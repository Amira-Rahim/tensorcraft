import baseConfig from "@tensorcraft/config/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: [".next/"],
  },
];
