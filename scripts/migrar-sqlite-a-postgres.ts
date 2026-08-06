/**
 * Copia los datos del SQLite de desarrollo (prisma/dev.db) al Postgres que
 * apunte DATABASE_URL. Es la alternativa al seed: el seed deja el sitio con
 * los productos y textos de fábrica, esto deja lo que ya tenías, incluidas
 * las cuentas del panel con su clave actual.
 *
 * Se corre una sola vez, después del primer deploy:
 *
 *   npx vercel env pull .env.production.local
 *   npm run migrar                      # informe, no escribe nada
 *   npm run migrar -- --aplicar         # copia de verdad
 *
 * Por defecto usa .env; para apuntar a producción:
 *
 *   npx tsx --env-file=.env.production.local scripts/migrar-sqlite-a-postgres.ts --aplicar
 *
 * Es idempotente: cada fila se hace upsert por su id, así que correrlo dos
 * veces no duplica nada. Lo que ya esté en Postgres con el mismo id se
 * sobrescribe con lo que traiga el SQLite.
 */

import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { existsSync } from "node:fs";

const RUTA_SQLITE = path.join(process.cwd(), "prisma", "dev.db");

const db = new PrismaClient();

/**
 * SQLite no tiene tipos fecha ni booleano: Prisma guarda las fechas como
 * milisegundos desde 1970 y los booleanos como 0/1. Al pasar a Postgres hay
 * que devolverlos a Date y boolean o el insert falla.
 */
type Conversion = { fechas: string[]; booleanos: string[] };

const TABLAS: { nombre: string; modelo: string; conversion: Conversion }[] = [
  {
    nombre: "Producto",
    modelo: "producto",
    conversion: {
      fechas: ["creadoEn", "actualizadoEn"],
      booleanos: ["activo", "destacado"],
    },
  },
  {
    nombre: "Usuario",
    modelo: "usuario",
    conversion: { fechas: ["creadoEn", "ultimoAcceso"], booleanos: [] },
  },
  {
    nombre: "CorreoAutorizado",
    modelo: "correoAutorizado",
    conversion: { fechas: ["creadoEn", "usadoEn"], booleanos: ["usado"] },
  },
  {
    nombre: "Mensaje",
    modelo: "mensaje",
    conversion: {
      fechas: ["creadoEn", "respondidoEn"],
      booleanos: ["leido", "respondido"],
    },
  },
  {
    nombre: "Ajustes",
    modelo: "ajustes",
    conversion: { fechas: ["actualizadoEn"], booleanos: [] },
  },
];

function plural(n: number) {
  return n === 1 ? "fila" : "filas";
}

function convertirFila(fila: Record<string, unknown>, conversion: Conversion) {
  const salida: Record<string, unknown> = { ...fila };

  for (const campo of conversion.fechas) {
    const valor = salida[campo];
    // Las columnas opcionales (ultimoAcceso, usadoEn, respondidoEn) vienen
    // null cuando nunca se llenaron; hay que dejarlas null, no Date(null).
    if (valor === null || valor === undefined) {
      salida[campo] = null;
      continue;
    }
    salida[campo] = new Date(Number(valor));
  }

  for (const campo of conversion.booleanos) {
    const valor = salida[campo];
    if (valor === null || valor === undefined) continue;
    salida[campo] = Boolean(Number(valor));
  }

  return salida;
}

async function migrarTabla(
  sqlite: DatabaseSync,
  tabla: (typeof TABLAS)[number],
  aplicar: boolean
) {
  const filas = sqlite
    .prepare(`SELECT * FROM "${tabla.nombre}"`)
    .all() as Record<string, unknown>[];

  console.log(`\n── ${tabla.nombre}: ${filas.length} ${plural(filas.length)} en SQLite`);

  if (filas.length === 0) {
    console.log("   Vacía, nada que copiar.");
    return 0;
  }

  if (!aplicar) {
    for (const fila of filas.slice(0, 5)) {
      // El identificador legible cambia por tabla; el id siempre sirve.
      const etiqueta = fila.slug ?? fila.email ?? fila.nombre ?? fila.id;
      console.log(`   · ${etiqueta}`);
    }
    if (filas.length > 5) console.log(`   · … y ${filas.length - 5} más`);
    console.log(`   Se copiarían ${filas.length}. (Corre con --aplicar para hacerlo)`);
    return filas.length;
  }

  // `as never` porque el modelo se elige por string en tiempo de ejecución y
  // TypeScript no puede casar el tipo del dato con el del delegado concreto.
  const delegado = db[tabla.modelo as keyof PrismaClient] as {
    upsert: (args: unknown) => Promise<unknown>;
  };

  for (const fila of filas) {
    const datos = convertirFila(fila, tabla.conversion);
    await delegado.upsert({
      where: { id: datos.id },
      create: datos,
      update: datos,
    } as never);
  }

  console.log(`   ${filas.length} filas copiadas a Postgres.`);
  return filas.length;
}

async function main() {
  const aplicar = process.argv.slice(2).includes("--aplicar");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Falta DATABASE_URL. Corre con --env-file=.env.production.local para apuntar a producción."
    );
  }
  if (process.env.DATABASE_URL.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL sigue apuntando a un archivo SQLite. Este script copia DESDE el SQLite HACIA un Postgres, así que el destino tiene que ser una URL postgresql://."
    );
  }
  if (!existsSync(RUTA_SQLITE)) {
    throw new Error(`No encuentro ${RUTA_SQLITE}. Sin el SQLite no hay nada que copiar.`);
  }

  // El destino se imprime sin credenciales: la connection string de Neon trae
  // usuario y clave, y este script se corre copiando y pegando la salida.
  const destino = new URL(process.env.DATABASE_URL);
  console.log(
    aplicar
      ? `Migración · MODO REAL: se escribe en ${destino.host}${destino.pathname}`
      : `Migración · modo informe: no se escribe nada en ${destino.host}${destino.pathname}`
  );

  const sqlite = new DatabaseSync(RUTA_SQLITE, { readOnly: true });

  let total = 0;
  try {
    for (const tabla of TABLAS) {
      total += await migrarTabla(sqlite, tabla, aplicar);
    }
  } finally {
    sqlite.close();
  }

  console.log(
    aplicar
      ? `\nListo: ${total} filas en Postgres. Ya puedes entrar al panel con tu clave de siempre.\n`
      : `\nInforme terminado: ${total} filas se copiarían. Agrega --aplicar para hacerlo.\n`
  );
}

main()
  .catch((error) => {
    console.error("\nLa migración falló:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
