import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // server.js es el archivo que carga Phusion Passenger en el hosting, y lo
    // carga como CommonJS: el proyecto no declara "type": "module", así que un
    // .js suelto es CJS. El require() de ahí no es un descuido, es la única
    // forma que Passenger sabe leer.
    files: ["server.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
