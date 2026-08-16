/**
 * Carga en MariaDB el JSON que dejó scripts/exportar-datos.ts.
 *
 * Es la segunda mitad de la mudanza de motor. Va aparte del export por una
 * limitación de Prisma: el cliente queda atado al motor con el que se generó,
 * así que un mismo proceso no puede leer de Postgres y escribir en MariaDB.
 *
 *   npm run importar                 # informe, no escribe nada
 *   npm run importar -- --aplicar    # carga de verdad
 *
 * Es idempotente: cada fila va por upsert contra su id, así que correrlo dos
 * veces no duplica. Lo que ya exista con el mismo id se sobrescribe con lo
 * que traiga el JSON.
 *
 * El orden de las tablas no es casual: Ajustes y Producto no dependen de
 * nadie, pero conviene dejar Usuario para el final porque es el que importa
 * si algo falla a mitad de camino — así se nota.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const ENTRADA = path.join(process.cwd(), "datos-exportados.json");

type Volcado = {
  exportadoEn: string;
  productos: Record<string, unknown>[];
  ajustes: Record<string, unknown> | null;
  usuarios: Record<string, unknown>[];
  // Los volcados viejos traen la lista de correos autorizados, que ya no
  // existe: se acepta el campo para poder leerlos, y no se carga.
  correosAutorizados?: Record<string, unknown>[];
  mensajes: Record<string, unknown>[];
};

/**
 * Las fechas viajan como texto ISO en el JSON y Prisma las quiere como Date.
 * Se convierten por nombre de campo y no por forma del valor: una cadena que
 * parece fecha en un campo de texto no tiene por qué serlo.
 */
const CAMPOS_FECHA = [
  "creadoEn",
  "actualizadoEn",
  "ultimoAcceso",
  "usadoEn",
  "respondidoEn",
];

function revivirFechas<T extends Record<string, unknown>>(fila: T): T {
  const copia: Record<string, unknown> = { ...fila };
  for (const campo of CAMPOS_FECHA) {
    const valor = copia[campo];
    if (typeof valor === "string") copia[campo] = new Date(valor);
  }
  return copia as T;
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");

  if (!existsSync(ENTRADA)) {
    console.error(
      `No encuentro ${path.basename(ENTRADA)}.\n` +
        "Córrelo primero con la base vieja: npm run exportar"
    );
    process.exitCode = 1;
    return;
  }

  const datos: Volcado = JSON.parse(readFileSync(ENTRADA, "utf8"));

  console.log(
    aplicar
      ? "Importación · MODO REAL: esto escribe en la base."
      : "Importación · modo informe: no se escribe nada todavía."
  );
  console.log(`Volcado del ${new Date(datos.exportadoEn).toLocaleString("es-CL")}\n`);
  console.log(`  productos            ${datos.productos.length}`);
  console.log(`  ajustes              ${datos.ajustes ? 1 : 0}`);
  console.log(`  usuarios             ${datos.usuarios.length}`);
  console.log(`  mensajes             ${datos.mensajes.length}`);

  if (!aplicar) {
    console.log("\nAgrega --aplicar para cargarlo de verdad.\n");
    return;
  }

  if (datos.ajustes) {
    const fila = revivirFechas(datos.ajustes) as { id: string };
    await db.ajustes.upsert({
      where: { id: fila.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: fila as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: fila as any,
    });
    console.log("\n  ajustes cargados.");
  }

  for (const producto of datos.productos) {
    const fila = revivirFechas(producto) as { id: string };
    await db.producto.upsert({
      where: { id: fila.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: fila as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: fila as any,
    });
  }
  console.log(`  ${datos.productos.length} productos cargados.`);

  for (const mensaje of datos.mensajes) {
    const fila = revivirFechas(mensaje) as { id: string };
    await db.mensaje.upsert({
      where: { id: fila.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: fila as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: fila as any,
    });
  }
  console.log(`  ${datos.mensajes.length} mensajes cargados.`);

  // Al final y contadas aparte: son las cuentas del panel, con su hash de
  // clave. Si esto no sale, nadie puede entrar a administrar el sitio.
  for (const usuario of datos.usuarios) {
    const fila = revivirFechas(usuario) as { id: string };
    await db.usuario.upsert({
      where: { id: fila.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: fila as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: fila as any,
    });
  }
  console.log(`  ${datos.usuarios.length} cuentas del panel cargadas (con su clave de siempre).`);

  console.log("\nListo. Entra al panel y confirma que puedes iniciar sesión.\n");
}

main()
  .catch((error) => {
    console.error("\nLa importación falló:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
