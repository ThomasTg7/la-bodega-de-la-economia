/**
 * Mantenimiento periódico de la bodega:
 *
 *   1. Borra los mensajes del formulario más viejos que N días (90 por defecto).
 *   2. Borra las imágenes de Vercel Blob que ya no usa ningún producto ni la
 *      galería del local.
 *
 * Por seguridad NO borra nada a menos que le pases --aplicar: sin esa bandera
 * solo muestra el informe de qué haría. Así, si alguien lo corre por
 * curiosidad, no se lleva datos por delante.
 *
 *   npm run limpiar                      # informe, no toca nada
 *   npm run limpiar -- --aplicar         # borra de verdad
 *   npm run limpiar -- --dias=180 --aplicar
 *
 * Apunta a la base y al Blob que digan DATABASE_URL y BLOB_READ_WRITE_TOKEN.
 * Para correrlo contra producción: `npx vercel env pull .env.production.local`
 * y después `npx tsx --env-file=.env.production.local scripts/limpiar-datos.ts`.
 */

import { PrismaClient } from "@prisma/client";
import { list, del } from "@vercel/blob";

const DIAS_POR_DEFECTO = 90;
/** Un archivo recién subido puede estar esperando que aprieten "Guardar". */
const GRACIA_HORAS = 24;
/** Carpeta del Blob donde deja las fotos /api/upload. */
const PREFIJO_BLOB = "productos/";

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log(
      "\n── Imágenes\n   Falta BLOB_READ_WRITE_TOKEN, así que no puedo mirar el Blob. Me salto esta parte."
    );
    return 0;
  }

  // El Blob se pagina; sin recorrer el cursor hasta el final se dejarían
  // archivos fuera del inventario y parecerían "en uso" para siempre.
  const archivos: { pathname: string; url: string; size: number; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const pagina = await list({ prefix: PREFIJO_BLOB, cursor, limit: 1000 });
    archivos.push(...pagina.blobs);
    cursor = pagina.hasMore ? pagina.cursor : undefined;
  } while (cursor);

  if (archivos.length === 0) {
    console.log("\n── Imágenes\n   El Blob está vacío. Nada que revisar.");
    return 0;
  }

  // Todo lo que la base considera "en uso": las dos fotos de cada producto
  // más las de la galería del local.
  const [productos, ajustes] = await Promise.all([
    db.producto.findMany({ select: { imagenTextura: true, imagenRecorte: true } }),
    db.ajustes.findUnique({ where: { id: "sitio" }, select: { galeria: true } }),
  ]);

  // Se comparan URLs completas, no nombres de archivo: el Blob le agrega un
  // sufijo aleatorio a cada subida, así que el nombre por sí solo ya no
  // identifica nada. Las rutas que empiezan con "/" son archivos estáticos de
  // public/ y no viven en el Blob, así que se ignoran.
  const enUso = new Set<string>();
  for (const p of productos) {
    if (p.imagenTextura.startsWith("http")) enUso.add(p.imagenTextura);
    if (p.imagenRecorte.startsWith("http")) enUso.add(p.imagenRecorte);
  }
  try {
    const galeria = JSON.parse(ajustes?.galeria ?? "[]");
    if (Array.isArray(galeria)) {
      for (const foto of galeria) {
        if (typeof foto === "string" && foto.startsWith("http")) enUso.add(foto);
      }
    }
  } catch {
    // Galería ilegible: mejor no borrar nada por si acaso.
    console.log("\n── Imágenes\n   La galería del local tiene un JSON roto. Me detengo sin borrar.");
    return 0;
  }

  const limiteGracia = Date.now() - GRACIA_HORAS * 60 * 60 * 1000;
  const huerfanas: { nombre: string; url: string; peso: number }[] = [];

  for (const archivo of archivos) {
    if (enUso.has(archivo.url)) continue;
    // Recién subida: puede estar en un formulario todavía sin guardar.
    if (archivo.uploadedAt.getTime() > limiteGracia) continue;
    huerfanas.push({ nombre: archivo.pathname, url: archivo.url, peso: archivo.size });
  }

  const total = huerfanas.reduce((suma, h) => suma + h.peso, 0);
  console.log(`\n── Imágenes sueltas en el Blob (${archivos.length} archivos en total)`);

  if (huerfanas.length === 0) {
    console.log("   Ninguna sobra. Todas están en uso.");
    return 0;
  }

  for (const h of huerfanas.slice(0, 10)) {
    console.log(`   · ${h.nombre}  (${pesoLegible(h.peso)})`);
  }
  if (huerfanas.length > 10) console.log(`   · … y ${huerfanas.length - 10} más`);

  if (aplicar) {
    // `del` acepta el lote completo, pero se manda de a poco para no armar una
    // petición gigante si algún día hay miles de archivos sueltos.
    for (let i = 0; i < huerfanas.length; i += 100) {
      await del(huerfanas.slice(i, i + 100).map((h) => h.url));
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
