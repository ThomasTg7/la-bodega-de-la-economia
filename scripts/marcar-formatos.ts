/**
 * Prende las casillas "Mostrar en el detalle" de caja y bin en los productos
 * que ya tenían ese precio cargado.
 *
 * Las columnas `mostrarCaja` y `mostrarBin` nacieron apagadas (default false),
 * así que sin esto los productos de antes perderían sus formatos en la página
 * hasta que alguien los marque a mano uno por uno. Se corre una sola vez por
 * base, después del `prisma db push` que agrega las columnas.
 *
 *   npm run formatos              -> informe, no escribe nada
 *   npm run formatos -- --aplicar -> lo aplica
 *
 * Solo prende: nunca apaga una casilla que alguien ya haya decidido apagar
 * desde el panel.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const aplicar = process.argv.slice(2).includes("--aplicar");

async function main() {
  const productos = await db.producto.findMany({
    select: {
      id: true,
      nombre: true,
      precioCaja: true,
      precioBin: true,
      mostrarCaja: true,
      mostrarBin: true,
    },
    orderBy: { orden: "asc" },
  });

  const pendientes = productos.filter(
    (p) =>
      (p.precioCaja != null && !p.mostrarCaja) || (p.precioBin != null && !p.mostrarBin)
  );

  console.log(
    aplicar
      ? "Formatos · MODO REAL: esto escribe en la base."
      : "Formatos · modo informe: no se escribe nada todavía."
  );

  if (pendientes.length === 0) {
    console.log("\nNo hay nada que marcar: todos los formatos con precio ya están visibles.\n");
    return;
  }

  for (const p of pendientes) {
    const marcas = [
      p.precioCaja != null && !p.mostrarCaja ? "caja" : null,
      p.precioBin != null && !p.mostrarBin ? "bin" : null,
    ].filter(Boolean);
    console.log(`  ${p.nombre}: marcar ${marcas.join(" y ")}`);
  }

  if (!aplicar) {
    console.log("\nAgrega --aplicar para que se guarde.\n");
    return;
  }

  await db.$transaction(
    pendientes.map((p) =>
      db.producto.update({
        where: { id: p.id },
        data: {
          mostrarCaja: p.precioCaja != null ? true : p.mostrarCaja,
          mostrarBin: p.precioBin != null ? true : p.mostrarBin,
        },
      })
    )
  );

  console.log(`\nListo. ${pendientes.length} producto(s) actualizado(s).\n`);
}

main()
  .catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
