export const ASUNTOS_CONTACTO = [
  "Compra",
  "Pedido grande",
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
  mandarina: { w: 454, h: 440 },
};

export const DIMENSION_RECORTE_DEFECTO = { w: 440, h: 440 };

/**
 * Ficha del local en Google Maps. `lat`/`lng` salen de resolver el link
 * corto que se comparte desde la app (maps.app.goo.gl/enu2GTZ2Ra1ocShh6):
 * son las mismas coordenadas del pin publicado, así que el mapa incrustado
 * cae exactamente sobre el local y no sobre el centro de la calle.
 */
export const MAPA_BODEGA = {
  ficha: "https://maps.app.goo.gl/enu2GTZ2Ra1ocShh6",
  lat: -34.1523487,
  lng: -70.7203963,
  /**
   * Nombre tal como está publicado en Google (sin tilde, así está en la
   * ficha). Es lo que busca el mapa incrustado para dejar el pin sobre el
   * local con su etiqueta.
   */
  consulta: "La bodega de la economia rancagua",
} as const;

/**
 * Región donde está el local, para la línea de ubicación de la portada. La
 * ciudad sale de Ajustes (editable en el panel); la región va acá porque es
 * el único dato de la dirección que no cambia sin mudarse de negocio.
 */
export const REGION = "Región de O'Higgins";

/** Redes del negocio. El link va tal cual al perfil público. */
export const TIKTOK_URL = "https://www.tiktok.com/@la_bodega_de_la_economia";

/**
 * Piso para hacer un pedido. La bodega vende solo al por mayor, así que bajo
 * esta cantidad no se despacha: la calculadora parte acá y el catálogo lo
 * dice antes de que alguien escriba.
 *
 * El valor de verdad vive en `Ajustes.pedidoMinimoKg` y se edita desde el
 * panel. Este es el respaldo: lo usan las pantallas que no tienen los ajustes
 * a mano y es el default de la columna en la base.
 */
export const PEDIDO_MINIMO_KG = 100;

/**
 * Kilos que trae un bin cuando el producto no tiene el dato cargado. Es una
 * referencia, no una medida exacta: los bins vienen entre 380 y 420 según la
 * fruta y cómo se acomode.
 */
export const KILOS_BIN_REFERENCIA = 400;
