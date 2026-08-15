/**
 * Deja el carrusel del local con las fotos de fábrica que están en
 * public/fotos-local/, las que genera `python scripts/preparar-galeria.py`.
 *
 * Los @default del schema solo aplican a una base nueva: la fila "sitio" ya
 * existe, así que el campo `galeria` hay que escribirlo. Es idempotente
 * —correrlo dos veces deja lo mismo— e imprime el valor anterior antes de
 * pisarlo, por si había fotos subidas desde el panel que se quieran devolver.
 *
 *   npx tsx --env-file=.env scripts/galeria-carrusel.ts
 *
 * Apunta a la base que diga DATABASE_URL. Para producción:
 * `npx tsx --env-file=.env.production.local scripts/galeria-carrusel.ts`.
 */
import { PrismaClient } from "@prisma/client";
import { GALERIA_DEFECTO } from "../src/lib/galeria";

const db = new PrismaClient();

async function main() {
  const antes = await db.ajustes.findUnique({ where: { id: "sitio" } });
  if (!antes) {
    console.error('No existe la fila de ajustes ("sitio"). Corre primero `npm run db:seed`.');
    process.exitCode = 1;
    return;
  }

  console.log("Galería anterior:", antes.galeria || "(vacía)");

  const nueva = JSON.stringify([...GALERIA_DEFECTO]);
  if (antes.galeria === nueva) {
    console.log("Ya estaba con estas fotos, no se tocó nada.");
    return;
  }

  await db.ajustes.update({ where: { id: "sitio" }, data: { galeria: nueva } });
  console.log("Galería nueva:   ", nueva);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
