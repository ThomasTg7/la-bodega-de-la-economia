import { z } from "zod";

import { MAX_FOTOS_GALERIA } from "./galeria";

/** Nombre de usuario: sin espacios ni arroba, para no confundirlo con un correo. */
export const NOMBRE_USUARIO = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo");

export const esquemaLogin = z.object({
  // Un solo campo para las dos formas de entrar. No se valida como correo ni
  // se pasa a minúsculas: puede ser un nombre de usuario, y el cotejo de la
  // base ya es insensible a mayúsculas.
  identificador: z.string().trim().min(1).max(120),
  clave: z.string().min(1),
});

export const esquemaRegistro = z.object({
  email: z.string().trim().toLowerCase().email(),
  usuario: NOMBRE_USUARIO,
  nombre: z.string().trim().min(2).max(60),
  clave: z.string().min(8).max(72),
  // El token del link de invitación. El largo se comprueba nomás: si vale o
  // no lo dice la base, y de eso se encarga la ruta.
  token: z.string().trim().min(10).max(200),
});

/** Cambio de clave propio, desde el panel. */
export const esquemaCambioClave = z.object({
  // La actual se pide entera aunque solo se compare contra el hash: es lo que
  // evita que un computador con la sesión abierta se quede con la cuenta.
  claveActual: z.string().min(1).max(72),
  claveNueva: z.string().min(8).max(72),
});

/**
 * Alta de usuario hecha desde adentro del panel. Mismos campos que el
 * registro público pero sin palabra clave: acá la autorización es la sesión
 * de quien lo crea.
 */
export const esquemaUsuarioNuevo = z.object({
  email: z.string().trim().toLowerCase().email(),
  usuario: NOMBRE_USUARIO,
  nombre: z.string().trim().min(2).max(60),
  clave: z.string().min(8).max(72),
});

export const esquemaProducto = z.object({
  nombre: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  descripcion: z.string().trim().max(300).default(""),
  unidad: z.enum(["kg", "unidad", "malla"]).default("kg"),
  precioBase: z.number().int().min(0).nullable().optional(),
  precioDescuento: z.number().int().min(0).nullable().optional(),
  precioCaja: z.number().int().min(0).nullable().optional(),
  precioBin: z.number().int().min(0).nullable().optional(),
  kilosPorCaja: z.number().int().min(0).nullable().optional(),
  kilosPorBin: z.number().int().min(0).nullable().optional(),
  // Vacio = este producto no tiene descuento por volumen. Por eso nullable y
  // sin default: un 10 puesto de oficio obligaria a que todo producto tenga
  // un escalon de descuento, que es justo lo que no queremos.
  kilosDescuento: z.number().int().min(1).nullable().optional(),
  imagenTextura: z.string().trim().default(""),
  imagenRecorte: z.string().trim().default(""),
  colorAcento: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#30CFB2"),
  // Casillas del panel: mandan si el formato sale en el detalle del producto,
  // aparte de que tenga precio cargado.
  mostrarCaja: z.boolean().default(false),
  mostrarBin: z.boolean().default(false),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  orden: z.number().int().min(0).default(0),
});

export const esquemaProductoParcial = esquemaProducto.partial();

/**
 * Deja del objeto validado solo los campos que venían en el cuerpo original.
 *
 * Hace falta porque `.partial()` no apaga los `.default()`: al parsear un
 * PATCH de `{ activo: false }`, zod devuelve además descripcion "",
 * imagenTextura "", colorAcento "#30CFB2", orden 0 y compañía. Mandado tal
 * cual a un `update` de Prisma, apagar un producto le borraba las imágenes,
 * el texto y su lugar en la lista. Un PATCH tiene que tocar lo que le
 * mandaron y nada más, así que el cuerpo crudo es quien manda qué columnas se
 * escriben; zod sigue decidiendo con qué valores.
 */
export function soloCamposEnviados<T extends object>(cuerpo: unknown, datos: T): Partial<T> {
  if (typeof cuerpo !== "object" || cuerpo === null) return {};
  const enviados = new Set(Object.keys(cuerpo));
  return Object.fromEntries(
    Object.entries(datos).filter(([campo]) => enviados.has(campo))
  ) as Partial<T>;
}

/** Lo único que se elige al crear un link: para quién es. */
export const esquemaInvitacion = z.object({
  nota: z.string().trim().max(120).default(""),
});

export const esquemaMensaje = z.object({
  nombre: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  asunto: z.string().trim().max(60).default("Consulta"),
  mensaje: z.string().trim().min(10).max(1000),
  origen: z.enum(["formulario", "whatsapp"]).default("formulario"),
  destino: z.string().trim().max(30).default(""),
  // Honeypot: acepta cualquier valor (incluso relleno por un bot) para que
  // la validación nunca lo rechace — es la ruta del handler la que decide
  // qué hacer si viene con contenido, no el esquema.
  sitio_web: z.string().optional().default(""),
});

export const esquemaAjustes = z.object({
  nombreNegocio: z.string().trim().min(1).max(80).optional(),
  eslogan: z.string().trim().max(300).optional(),
  direccion: z.string().trim().max(200).optional(),
  ciudad: z.string().trim().max(80).optional(),
  telefono1: z.string().trim().max(30).optional(),
  telefono2: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  numerosWhatsapp: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || esListaNumerosValida(s),
      "Cada número necesita al menos 8 dígitos y un peso entre 0 y 100."
    ),
  horario: z.string().trim().max(120).optional(),
  // Siempre en kilos: la bodega no vende en otra unidad. El tope de 10.000 es
  // para que un cero de más no deje la tienda sin poder venderle a nadie.
  pedidoMinimoKg: z.coerce.number().int().min(1).max(10000).optional(),
  descripcion: z.string().trim().max(600).optional(),
  // Los tres sellos viajan como texto JSON. Vacíos se permiten: al leerlos,
  // parsearSellos() rellena cada hueco con el texto de fábrica.
  portadaSellos: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || esListaSellosValida(s),
      "Los sellos de la portada tienen que ser hasta 3 frases de 60 caracteres."
    ),
  catalogoTitulo: z.string().trim().max(80).optional(),
  catalogoBajada: z.string().trim().max(300).optional(),
  // Vacío = se arma solo con la dirección. Si viene algo, tiene que ser una
  // URL completa: sin el https:// el navegador la tomaría como ruta interna
  // del sitio y el botón "Cómo llegar" no llevaría a ninguna parte.
  mapaUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https?:\/\/\S+$/i.test(v),
      "El link del mapa tiene que empezar con https://"
    )
    .optional(),
  // Igual que los sellos: viaja como texto JSON y el contenido se revisa
  // aparte. El tope de fotos se valida acá y no solo en el panel, que es
  // donde se ve el contador: el panel es una pantalla, no una cerradura.
  galeria: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || esListaGaleriaValida(s),
      `El carrusel admite hasta ${MAX_FOTOS_GALERIA} fotos.`
    ),
});

const esquemaNumeroWhatsapp = z.object({
  nombre: z.string().trim().max(40),
  numero: z
    .string()
    .trim()
    .refine((n) => n.replace(/\D/g, "").length >= 8, "Número demasiado corto"),
  peso: z.number().min(0).max(100),
});

function esListaGaleriaValida(json: string) {
  try {
    return z
      .array(z.string().trim().min(1).max(500))
      .max(MAX_FOTOS_GALERIA)
      .safeParse(JSON.parse(json)).success;
  } catch {
    return false;
  }
}

function esListaSellosValida(json: string) {
  try {
    return z.array(z.string().max(60)).max(3).safeParse(JSON.parse(json)).success;
  } catch {
    return false;
  }
}

/** El campo viaja como texto JSON, así que el contenido se valida aparte. */
function esListaNumerosValida(json: string) {
  try {
    return z.array(esquemaNumeroWhatsapp).max(10).safeParse(JSON.parse(json)).success;
  } catch {
    return false;
  }
}
