import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { leerSesion } from "@/lib/sesion";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

/**
 * Las fotos de iPhone salen en HEIC y el navegador es poco de fiar con ese
 * formato: Safari manda "image/heic", pero Chrome y Firefox en Windows suelen
 * mandar "" o "application/octet-stream" porque el sistema no tiene el tipo
 * registrado. Por eso la extensión también vale como prueba.
 */
function pareceHeic(archivo: File) {
  return (
    archivo.type === "image/heic" ||
    archivo.type === "image/heif" ||
    /\.hei[cf]$/i.test(archivo.name)
  );
}

/**
 * Devuelve un buffer que sharp sepa leer.
 *
 * Los binarios precompilados de sharp traen libheif solo con AV1, no con
 * HEVC, que es lo que usa el iPhone: un .heic de teléfono no lo abre. Cuando
 * pasa eso se decodifica con heic-convert, que es JavaScript puro y no
 * depende de códecs del sistema. Va en import dinámico para que una subida
 * normal —que es casi siempre— no cargue esa librería.
 */
async function aBufferLegible(buffer: Buffer, heic: boolean): Promise<Buffer> {
  try {
    await sharp(buffer).metadata();
    return buffer;
  } catch (error) {
    if (!heic) throw error;
  }

  const convertir = (await import("heic-convert")).default;
  const jpeg = await convertir({ buffer, format: "JPEG", quality: 0.94 });
  return Buffer.from(jpeg);
}

/** La foto de catálogo llega a usarse a ancho completo en la portada. */
const ANCHO_CATALOGO = 1600;
/** El recorte se dibuja a ~260px de alto como máximo. */
const ANCHO_RECORTE = 900;
/** El carrusel del local no pasa de ~330px de ancho: 1200 cubre DPR 3. */
const ANCHO_GALERIA = 1200;

/**
 * Cada destino tiene su tamaño y su calidad. La galería es la más exigente
 * de las tres: son fotos del local y de la fruta, se miran de cerca y no
 * llevan transparencia, así que se achican poco y se comprimen menos.
 */
const PERFILES = {
  catalogo: { ancho: ANCHO_CATALOGO, calidad: 78 },
  recorte: { ancho: ANCHO_RECORTE, calidad: 86 },
  galeria: { ancho: ANCHO_GALERIA, calidad: 82 },
} as const;

type Destino = keyof typeof PERFILES;

function destinoDe(tipo: string | null): Destino {
  if (tipo === "recorte" || tipo === "galeria") return tipo;
  return "catalogo";
}

function slugificar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes tras la normalizacion NFD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "imagen";
}

export async function POST(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("archivo");
  if (!archivo || !(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }

  const heic = pareceHeic(archivo);
  if (!heic && !TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json(
      { error: "Formato no admitido. Sube una imagen JPG, PNG, HEIC, WebP o AVIF." },
      { status: 400 }
    );
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json(
      { error: "La imagen pesa demasiado. El máximo son 8 MB." },
      { status: 400 }
    );
  }

  const destino = destinoDe(request.nextUrl.searchParams.get("tipo"));
  const perfil = PERFILES[destino];
  const buffer = Buffer.from(await archivo.arrayBuffer());
  const base = slugificar(archivo.name.replace(/\.[^.]+$/, ""));
  // Todo sale en WebP, incluidos los recortes: soporta transparencia igual
  // que PNG y pesa una fracción. Un PNG de una fruta recortada a 1600px se
  // va fácil sobre 1 MB; el mismo WebP queda en decenas de KB.

  let procesada: Buffer;
  let tieneAlfa = false;
  let ancho: number | undefined;
  let alto: number | undefined;
  try {
    // El canal alfa se lee del original: si el recorte no lo trae, la fruta
    // llega con un rectángulo blanco detrás y hay que avisarlo en el panel.
    const legible = await aBufferLegible(buffer, heic);
    const metadatos = await sharp(legible).metadata();
    tieneAlfa = Boolean(metadatos.hasAlpha);

    procesada = await sharp(legible)
      // `rotate()` sin argumentos aplica la orientación del EXIF: las fotos
      // de teléfono vienen acostadas con la rotación anotada aparte.
      .rotate()
      // `withoutEnlargement`: una foto más chica que el perfil se deja como
      // está. Estirarla solo sumaría peso, no detalle.
      .resize({ width: perfil.ancho, withoutEnlargement: true })
      .webp({
        quality: perfil.calidad,
        alphaQuality: 90,
        // `effort` sube el tiempo de compresión a cambio de menos peso. En
        // una subida manual desde el panel, un par de cientos de ms extra no
        // se notan y el archivo queda bastante más liviano.
        effort: 5,
      })
      .toBuffer();

    const finales = await sharp(procesada).metadata();
    ancho = finales.width;
    alto = finales.height;
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la imagen. Prueba con otro archivo." },
      { status: 400 }
    );
  }

  // La imagen queda en el disco del hosting, bajo public/uploads, y lo que se
  // guarda en la base es la ruta relativa. Eso pide un disco que se pueda
  // escribir y que sobreviva a un reinicio: en cPanel lo hay, y es la razón
  // por la que esto ya no pasa por un almacenamiento externo.
  //
  // La carpeta va por destino para no mezclar las fotos del catálogo con las
  // del local, igual que estaban separadas antes.
  const carpeta = destino === "galeria" ? "local" : "productos";
  // Sufijo aleatorio además del timestamp: dos subidas en el mismo
  // milisegundo se pisarían, y acá pisar significa cambiarle la foto a otro
  // producto sin aviso.
  const nombreFinal = `${base}-${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  const rutaPublica = `/uploads/${carpeta}/${nombreFinal}`;

  try {
    const directorio = path.join(process.cwd(), "public", "uploads", carpeta);
    await mkdir(directorio, { recursive: true });
    await writeFile(path.join(directorio, nombreFinal), procesada);
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la imagen en el servidor. Inténtalo de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      url: rutaPublica,
      tieneAlfa,
      ancho,
      alto,
      pesoOriginal: archivo.size,
      peso: procesada.byteLength,
    },
    { status: 201 }
  );
}
