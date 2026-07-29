import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email(),
  clave: z.string().min(1),
});

export const esquemaRegistro = z.object({
  email: z.string().trim().toLowerCase().email(),
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
  precioDetalle: z.number().int().min(0).nullable().optional(),
  precioMayorista: z.number().int().min(0).nullable().optional(),
  precioCaja: z.number().int().min(0).nullable().optional(),
  precioBin: z.number().int().min(0).nullable().optional(),
  kilosPorCaja: z.number().int().min(0).nullable().optional(),
  kilosPorBin: z.number().int().min(0).nullable().optional(),
  umbralMayorista: z.number().int().min(1).default(10),
  imagenTextura: z.string().trim().default(""),
  imagenRecorte: z.string().trim().default(""),
  colorAcento: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#30CFB2"),
  activo: z.boolean().default(true),
  destacado: z.boolean().default(false),
  orden: z.number().int().min(0).default(0),
});

export const esquemaProductoParcial = esquemaProducto.partial();

export const esquemaAcceso = z.object({
  email: z.string().trim().toLowerCase().email(),
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
  descripcion: z.string().trim().max(600).optional(),
  mapaUrl: z.string().trim().max(500).optional(),
  galeria: z.string().optional(),
});

const esquemaNumeroWhatsapp = z.object({
  nombre: z.string().trim().max(40),
  numero: z
    .string()
    .trim()
    .refine((n) => n.replace(/\D/g, "").length >= 8, "Número demasiado corto"),
  peso: z.number().min(0).max(100),
});

/** El campo viaja como texto JSON, así que el contenido se valida aparte. */
function esListaNumerosValida(json: string) {
  try {
    return z.array(esquemaNumeroWhatsapp).max(10).safeParse(JSON.parse(json)).success;
  } catch {
    return false;
  }
}
