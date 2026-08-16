/**
 * Origen canonico del sitio. `NEXT_PUBLIC_SITIO_URL` manda si esta puesta
 * (para previews o un futuro staging); si no, el dominio real de produccion.
 * Sale de una variable y no de nada que provea el hosting, para que el valor
 * sea el mismo se mueva el sitio donde se mueva.
 */
export const SITIO_URL = (process.env.NEXT_PUBLIC_SITIO_URL || "https://labodegadelaeconomia.cl").replace(
  /\/+$/,
  ""
);

/** Arma una URL absoluta a partir de una ruta del sitio ("/", "/sitemap.xml"). */
export function urlAbsoluta(ruta: string): string {
  return `${SITIO_URL}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}
