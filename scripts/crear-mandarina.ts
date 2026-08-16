/**
 * Crea (o pone al día) el producto Mandarina. Las dos imágenes las genera
 * antes `python scripts/preparar-mandarina.py`.
 *
 * Es idempotente: si el slug ya existe, actualiza en vez de duplicar. Los
 * precios que no se saben quedan en null a propósito — se cargan desde
 * /admin/productos, que es donde el dueño los mira.
 *
 *   npx tsx --env-file=.env scripts/crear-mandarina.ts
 *
 * Apunta a la base que diga DATABASE_URL. Para producción:
 * `npx tsx --env-file=.env.production.local scripts/crear-mandarina.ts`.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const MANDARINA = {
  nombre: "Mandarina",
  slug: "mandarina",
  descripcion: "Mandarina dulce y fácil de pelar, de calibre parejo. Sale rápido en mostrador.",
  unidad: "kg",
  precioBase: 1000,
  // Sin kilosDescuento ni precioDescuento: la mandarina no tiene escalon por
  // volumen, y el umbral suelto solo haria que el panel pida el precio que falta.
  imagenTextura: "/texturas/mandarinas.webp",
  imagenRecorte: "/recortes/mandarina.png",
  // Sacado del propio recorte: el promedio de sus píxeles saturados.
  colorAcento: "#F57412",
  activo: true,
  destacado: false,
  orden: 3,
};

async function main() {
  const existe = await db.producto.findUnique({ where: { slug: MANDARINA.slug } });

  const producto = existe
    ? await db.producto.update({ where: { slug: MANDARINA.slug }, data: MANDARINA })
    : await db.producto.create({ data: MANDARINA });

  console.log(existe ? "Actualizada:" : "Creada:", JSON.stringify(producto, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
