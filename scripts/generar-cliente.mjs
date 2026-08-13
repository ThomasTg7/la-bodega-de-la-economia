/**
 * `prisma generate` apuntando al schema que corresponde al motor de turno.
 *
 * Corre en el postinstall, que es el único momento en que el hosting genera el
 * cliente por su cuenta. El cliente de Prisma queda atado al provider con el
 * que se generó, así que en un hosting con MariaDB hay que generar desde el
 * otro schema o la app arranca hablándole a Postgres.
 *
 * Se elige con DB_PROVIDER: `mariadb` o `mysql` para MariaDB, cualquier otra
 * cosa (o nada) para Postgres, que es lo que corre hoy en Vercel.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const proveedor = (process.env.DB_PROVIDER ?? "postgresql").toLowerCase();
const esMariaDB = proveedor === "mariadb" || proveedor === "mysql";

if (esMariaDB) {
  // fileURLToPath y no url.pathname: en Windows el pathname viene como
  // "/C:/..." y node no lo encuentra.
  const generador = fileURLToPath(new URL("./generar-schema-mariadb.mjs", import.meta.url));
  execFileSync(process.execPath, [generador], { stdio: "inherit" });
}

// Se invoca el CLI de Prisma por su archivo y no por `npx`: `npx` en Windows
// necesita shell, y pasar argumentos a través de un shell es justo lo que
// node marca como riesgo (DEP0190).
const cli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const args = [cli, "generate"];
if (esMariaDB) args.push("--schema", "prisma/schema.mariadb.prisma");

console.log(`Generando cliente Prisma para ${esMariaDB ? "MariaDB/MySQL" : "PostgreSQL"}…`);
execFileSync(process.execPath, args, { stdio: "inherit" });
