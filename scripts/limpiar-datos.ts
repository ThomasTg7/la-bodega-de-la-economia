/**
 * Mantenimiento periódico de la bodega:
 *
 *   1. Borra los mensajes del formulario más viejos que N días (90 por defecto).
 *   2. Borra las imágenes de public/uploads/ que ya no usa ningún producto ni
 *      la galería del local.
 *
 * Por seguridad NO borra nada a menos que le pases --aplicar: sin esa bandera
 * solo muestra el informe de qué haría. Así, si alguien lo corre por
 * curiosidad, no se lleva datos por delante.
 *
 *   npm run limpiar                      # informe, no toca nada
 *   npm run limpiar -- --aplicar         # borra de verdad
 *   npm run limpiar -- --dias=180 --aplicar
 */

import { PrismaClient } from "@prisma/client";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const DIAS_POR_DEFECTO = 90;
/** Un archivo recién subido puede estar esperando que aprieten "Guardar". */
const GRACIA_HORAS = 24;

const db = new PrismaClient();

function leerArgumentos() {
  const args = process.argv.slice(2);
  const aplicar = args.includes("--aplicar");
  const argDias = args.find((a) => a.startsWith("--dias="));
  const dias = argDias ? Number(argDias.split("=")[1]) : DIAS_POR_DEFECTO;

  if (!Number.isFinite(dias) || dias < 1) {
    throw new Error(`--dias tiene que ser un número mayor que 0 (recibí "${argDias}")`);
  }
  return { aplicar, dias };
}

function pesoLegible(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function limpiarMensajes(dias: number, aplicar: boolean) {
  const corte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const viejos = await db.mensaje.findMany({
    where: { creadoEn: { lt: corte } },
    orderBy: { creadoEn: "asc" },
    select: { id: true, nombre: true, creadoEn: true },
  });

  console.log(`\n── Mensajes con más de ${dias} días (antes del ${corte.toLocaleDateString("es-CL")})`);

  if (viejos.length === 0) {
    console.log("   No hay ninguno. Nada que borrar.");
    return 0;
  }

  for (const m of viejos.slice(0, 10)) {
    console.log(`   · ${m.creadoEn.toLocaleDateString("es-CL")}  ${m.nombre}`);
  }
  if (viejos.length > 10) console.log(`   · … y ${viejos.length - 10} más`);

  if (aplicar) {
    const { count } = await db.mensaje.deleteMany({ where: { creadoEn: { lt: corte } } });
    console.log(`   ${count} mensajes borrados.`);
  } else {
    console.log(`   Se borrarían ${viejos.length}. (Corre con --aplicar para hacerlo)`);
  }
  return viejos.length;
}

async function limpiarImagenes(aplicar: boolean) {
  const carpeta = path.join(process.cwd(), "public", "uploads");

  let archivos: string[];
  try {
    archivos = await readdir(carpeta);
  } catch {
    console.log("\n── Imágenes\n   No existe public/uploads/ todavía. Nada que revisar.");
    return 0;
  }

  // Todo lo que la base considera "en uso": las dos fotos de cada producto
  // más las de la galería del local.
  const [productos, ajustes] = await Promise.all([
    db.producto.findMany({ select: { imagenTextura: true, imagenRecorte: true } }),
    db.ajustes.findUnique({ where: { id: "sitio" }, select: { galeria: true } }),
  ]);

  const enUso = new Set<string>();
  for (const p of productos) {
    if (p.imagenTextura) enUso.add(path.basename(p.imagenTextura));
    if (p.imagenRecorte) enUso.add(path.basename(p.imagenRecorte));
  }
  try {
    const galeria = JSON.parse(ajustes?.galeria ?? "[]");
    if (Array.isArray(galeria)) {
      for (const foto of galeria) {
        if (typeof foto === "string" && foto) enUso.add(path.basename(foto));
      }
    }
  } catch {
    // Galería ilegible: mejor no borrar nada por si acaso.
    console.log("\n── Imágenes\n   La galería del local tiene un JSON roto. Me detengo sin borrar.");
    return 0;
  }

  const limiteGracia = Date.now() - GRACIA_HORAS * 60 * 60 * 1000;
  const huerfanas: { nombre: string; peso: number }[] = [];

  for (const nombre of archivos) {
    if (enUso.has(nombre)) continue;
    const info = await stat(path.join(carpeta, nombre));
    if (!info.isFile()) continue;
    // Recién subida: puede estar en un formulario todavía sin guardar.
    if (info.mtimeMs > limiteGracia) continue;
    huerfanas.push({ nombre, peso: info.size });
  }

  const total = huerfanas.reduce((suma, h) => suma + h.peso, 0);
  console.log(`\n── Imágenes sueltas en public/uploads (${archivos.length} archivos en total)`);

  if (huerfanas.length === 0) {
    console.log("   Ninguna sobra. Todas están en uso.");
    return 0;
  }

  for (const h of huerfanas.slice(0, 10)) {
    console.log(`   · ${h.nombre}  (${pesoLegible(h.peso)})`);
  }
  if (huerfanas.length > 10) console.log(`   · … y ${huerfanas.length - 10} más`);

  if (aplicar) {
    for (const h of huerfanas) {
      await unlink(path.join(carpeta, h.nombre));
    }
    console.log(`   ${huerfanas.length} archivos borrados, ${pesoLegible(total)} liberados.`);
  } else {
    console.log(
      `   Se borrarían ${huerfanas.length} archivos (${pesoLegible(total)}). (Corre con --aplicar para hacerlo)`
    );
  }
  return huerfanas.length;
}

async function main() {
  const { aplicar, dias } = leerArgumentos();

  console.log(
    aplicar
      ? "Limpieza · MODO REAL: esto borra datos."
      : "Limpieza · modo informe: no se borra nada todavía."
  );

  await limpiarMensajes(dias, aplicar);
  await limpiarImagenes(aplicar);

  console.log(
    aplicar ? "\nListo.\n" : "\nInforme terminado. Agrega --aplicar para ejecutarlo de verdad.\n"
  );
}

main()
  .catch((error) => {
    console.error("\nLa limpieza falló:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
