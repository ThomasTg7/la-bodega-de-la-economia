/**
 * Saca todo el contenido de la base a un JSON, para poder mudarlo de motor.
 *
 * Va en dos pasos y no en uno solo por una limitación de Prisma: el cliente
 * generado queda atado al motor con el que se generó, así que un mismo
 * proceso no puede hablarle a Postgres y a MariaDB a la vez. Entonces:
 *
 *   1. Con el cliente de Postgres todavía instalado:
 *        npx tsx --env-file=.env.production.local scripts/exportar-datos.ts
 *      Deja datos-exportados.json en la raíz.
 *
 *   2. Ya en MariaDB (cliente regenerado, base creada):
 *        npm run importar
 *
 * El JSON queda fuera de git: lleva los hashes de clave de las cuentas del
 * panel y los mensajes que mandó la gente por el formulario.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const SALIDA = path.join(process.cwd(), "datos-exportados.json");

async function main() {
  const [productos, ajustes, usuarios, correosAutorizados, mensajes] = await Promise.all([
    db.producto.findMany({ orderBy: { orden: "asc" } }),
    db.ajustes.findUnique({ where: { id: "sitio" } }),
    db.usuario.findMany(),
    db.correoAutorizado.findMany(),
    db.mensaje.findMany(),
  ]);

  const datos = {
    exportadoEn: new Date().toISOString(),
    productos,
    ajustes,
    usuarios,
    correosAutorizados,
    mensajes,
  };

  writeFileSync(SALIDA, JSON.stringify(datos, null, 2), "utf8");

  console.log(`Escrito ${path.basename(SALIDA)}:`);
  console.log(`  productos            ${productos.length}`);
  console.log(`  ajustes              ${ajustes ? 1 : 0}`);
  console.log(`  usuarios             ${usuarios.length}  (con su hash de clave)`);
  console.log(`  correos autorizados  ${correosAutorizados.length}`);
  console.log(`  mensajes             ${mensajes.length}`);
  console.log(
    "\nGuárdalo hasta confirmar que MariaDB quedó con todo: es la única copia de las cuentas del panel."
  );

  await db.$disconnect();
}

main();
