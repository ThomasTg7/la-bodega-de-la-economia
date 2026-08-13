/**
 * Deja la fila de Ajustes con los textos acordados. Los @default del schema
 * solo aplican a una base nueva: la fila "sitio" ya existe, así que cambiar
 * el default no la toca. Esto es lo que la pone al día.
 *
 * Es idempotente — correrlo dos veces deja lo mismo — y solo escribe los
 * campos de texto que se listan acá abajo.
 *
 *   npx tsx --env-file=.env scripts/actualizar-textos.ts
 *
 * Apunta a la base que diga DATABASE_URL. Para producción:
 * `npx tsx --env-file=.env.production.local scripts/actualizar-textos.ts`.
 */
import { PrismaClient } from "@prisma/client";
import { CATALOGO_DEFECTO } from "../src/lib/portada";

const TEXTOS = {
  direccion: "Malleco #04, Cooperativa La Cruz",
  ciudad: "Rancagua",
  eslogan:
    "Un emprendimiento local para locales, donde el precio está al alcance de su bolsillo. Visítenos y consulte por nuestros productos cuando quiera.",
  catalogoBajada: CATALOGO_DEFECTO.bajada,
  // Frase de una linea para el pie y la ficha del local. El detalle dia por
  // dia vive en la seccion Horarios de la portada.
  horario: "Lunes a viernes de 9:00 a 20:00, sábado de 9:00 a 15:00",
  // "descripcion" (el párrafo de Quiénes somos) NO va acá: es texto propio
  // escrito desde el panel, no el default del schema, y no habla de detalle
  // ni de por mayor. Se edita en /admin/ajustes.
  descripcion:
    "Acá no hay catálogo de mil productos. Hay pocas líneas, bien elegidas y con rotación diaria, para que lo que llega a tu local esté en el punto justo. Si necesitas algo que no tenemos en vitrina, lo conseguimos y te lo cotizamos.",
};

const db = new PrismaClient();

async function main() {
  const antes = await db.ajustes.findUnique({ where: { id: "sitio" } });
  if (!antes) {
    console.error('No existe la fila de ajustes ("sitio"). Corre primero `npm run db:seed`.');
    process.exitCode = 1;
    return;
  }

  for (const campo of Object.keys(TEXTOS) as (keyof typeof TEXTOS)[]) {
    const viejo = antes[campo];
    const nuevo = TEXTOS[campo];
    console.log(
      viejo === nuevo
        ? `= ${campo} (ya estaba)`
        : `~ ${campo}\n    antes: ${viejo}\n    ahora: ${nuevo}`
    );
  }

  await db.ajustes.update({ where: { id: "sitio" }, data: TEXTOS });
  console.log("\nListo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
