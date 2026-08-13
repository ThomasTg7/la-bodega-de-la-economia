/**
 * Escribe prisma/schema.mariadb.prisma a partir de prisma/schema.prisma.
 *
 * Prisma no acepta `provider = env("...")` en el bloque datasource — tiene que
 * ser un literal — así que soportar dos motores obliga a tener dos archivos.
 * En vez de mantenerlos a mano (y que se desincronicen la primera vez que
 * alguien agregue un campo), el de MariaDB se genera: es el mismo schema con
 * una sola línea cambiada.
 *
 * Que sea una sola línea no es casualidad. Los @db.VarChar del schema base
 * están puestos para servir a los dos motores:
 *
 *   - En MySQL/MariaDB un String sin largo explícito es varchar(191), donde no
 *     entra ni el eslogan ni ninguno de los campos JSON.
 *   - Poner esos campos como TEXT tampoco sirve: MySQL no permite DEFAULT en
 *     columnas TEXT, y casi todas las nuestras tienen uno.
 *   - En Postgres varchar(n) y text se comportan igual, así que anotar el
 *     largo no le cuesta nada.
 *
 * Se corre solo antes de cualquier comando de Prisma contra MariaDB
 * (`npm run db:push:mariadb`, `npm run generate:mariadb`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const origen = path.join(raiz, "prisma", "schema.prisma");
const destino = path.join(raiz, "prisma", "schema.mariadb.prisma");

const base = readFileSync(origen, "utf8");

if (!base.includes('provider = "postgresql"')) {
  console.error(
    'prisma/schema.prisma no declara provider = "postgresql". Revisa el datasource antes de generar el de MariaDB.'
  );
  process.exit(1);
}

const aviso = `// ARCHIVO GENERADO — no lo edites a mano.
// Sale de prisma/schema.prisma con \`npm run schema:mariadb\`.
// Cualquier cambio al modelo va en ese archivo, no en este.

`;

// MariaDB habla el protocolo de MySQL: el conector de Prisma es el mismo.
const salida = aviso + base.replace('provider = "postgresql"', 'provider = "mysql"');

writeFileSync(destino, salida, "utf8");
console.log(`Escrito ${path.relative(raiz, destino)} (provider: mysql).`);
