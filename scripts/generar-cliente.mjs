/**
 * `prisma generate` en el postinstall.
 *
 * Existe porque el hosting corre `npm install` por su cuenta y ese es el único
 * momento en que puede generar el cliente de Prisma. Sin esto, la app arranca
 * sin cliente y falla en la primera consulta.
 *
 * Antes elegía entre dos schemas según una variable de entorno, cuando el
 * proyecto soportaba dos motores a la vez. Ahora la única base es MariaDB,
 * así que no hay nada que elegir y queda solo el `generate`.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Se invoca el CLI de Prisma por su archivo y no por `npx`: `npx` en Windows
// necesita shell, y pasar argumentos a través de un shell es justo lo que
// node marca como riesgo (DEP0190).
const cli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

console.log("Generando cliente Prisma para MariaDB…");
execFileSync(process.execPath, [cli, "generate"], { stdio: "inherit" });
