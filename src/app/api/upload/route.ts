import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { leerSesion } from "@/lib/sesion";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

/** La foto de catálogo llega a usarse a ancho completo en la portada. */
const ANCHO_CATALOGO = 1600;
/** El recorte se dibuja a ~260px de alto como máximo. */
const ANCHO_RECORTE = 900;

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

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json(
      { error: "Formato no admitido. Sube una imagen JPG, PNG, WebP o AVIF." },
      { status: 400 }
    );
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return NextResponse.json(
      { error: "La imagen pesa demasiado. El máximo son 8 MB." },
      { status: 400 }
    );
  }

  const esRecorte = request.nextUrl.searchParams.get("tipo") === "recorte";
  const buffer = Buffer.from(await archivo.arrayBuffer());
  const base = slugificar(archivo.name.replace(/\.[^.]+$/, ""));
  // Todo sale en WebP, incluidos los recortes: soporta transparencia igual
  // que PNG y pesa una fracción. Un PNG de una fruta recortada a 1600px se
  // va fácil sobre 1 MB; el mismo WebP queda en decenas de KB.
  const nombreArchivo = `${base}-${Date.now()}.webp`;

  let procesada: Buffer;
  let tieneAlfa = false;
  let ancho: number | undefined;
  let alto: number | undefined;
  try {
    // El canal alfa se lee del original: si el recorte no lo trae, la fruta
    // llega con un rectángulo blanco detrás y hay que avisarlo en el panel.
    const metadatos = await sharp(buffer).metadata();
    tieneAlfa = Boolean(metadatos.hasAlpha);

    procesada = await sharp(buffer)
      .rotate()
      // El recorte nunca se dibuja más alto que ~260px en pantalla, así que
      // 900px de ancho ya cubre pantallas retina de sobra. La foto de
      // catálogo sí se usa a lo ancho completo en la portada.
      .resize({ width: esRecorte ? ANCHO_RECORTE : ANCHO_CATALOGO, withoutEnlargement: true })
      .webp({
        quality: esRecorte ? 86 : 78,
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

  // En Vercel el disco es de solo lectura, así que la imagen no puede quedar
  // en /public: se sube a Blob y lo que se guarda en la base es la URL
  // absoluta que devuelve. El sufijo aleatorio evita el error por nombre
  // repetido si dos subidas caen en el mismo milisegundo.
  let subida: Awaited<ReturnType<typeof put>>;
  try {
    subida = await put(`productos/${nombreArchivo}`, procesada, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la imagen. Inténtalo de nuevo." },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      url: subida.url,
      tieneAlfa,
      ancho,
      alto,
      pesoOriginal: archivo.size,
      peso: procesada.byteLength,
    },
    { status: 201 }
  );
}
