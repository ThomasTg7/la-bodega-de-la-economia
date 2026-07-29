export const ASUNTOS_CONTACTO = [
  "Compra al detalle",
  "Compra al por mayor",
  "Cotización",
  "Sugerencia",
  "Reclamo",
  "Otro",
] as const;

export const ASUNTOS_WHATSAPP = [
  "Compra",
  "Venta",
  "Cotización",
  "Sugerencia",
  "Reclamo",
  "Otro",
] as const;

export const COLORES_ACENTO = [
  "#30CFB2", // cyan
  "#076244", // verde
  "#224621", // verde palta
  "#F5CD07", // limón
  "#FD7005", // naranja
  "#1DA38C", // cyan medio
] as const;

/**
 * Fotos que ya vienen con el sitio, ofrecidas en el panel como atajo para no
 * obligar a subir una imagen nueva cada vez.
 *   - catalogo: varias frutas juntas, llena la tarjeta del catálogo.
 *   - recorte:  una sola fruta con fondo transparente, flota en la calculadora.
 */
export const FOTOS_BODEGA = {
  catalogo: [
    { nombre: "Paltas", url: "/texturas/paltas.webp" },
    { nombre: "Limones", url: "/texturas/limones.webp" },
    { nombre: "Naranjas", url: "/texturas/naranjas.webp" },
  ],
  recorte: [
    { nombre: "Palta", url: "/recortes/palta.png" },
    { nombre: "Limón", url: "/recortes/limon.png" },
    { nombre: "Naranja", url: "/recortes/naranja.png" },
  ],
} as const;

// Dimensiones reales de los recortes generados en la Fase 1 — evita que el
// navegador reserve una caja cuadrada para la palta (que es retrato) antes
// de que la imagen cargue. Un slug fuera de esta lista usa un fallback
// cuadrado razonable.
export const DIMENSIONES_RECORTE: Record<string, { w: number; h: number }> = {
  "palta-hass": { w: 452, h: 620 },
  limon: { w: 428, h: 440 },
  naranja: { w: 440, h: 440 },
};

export const DIMENSION_RECORTE_DEFECTO = { w: 440, h: 440 };
