/**
 * Origen canonico del sitio. `NEXT_PUBLIC_SITIO_URL` manda si esta puesta
 * (para previews o un futuro staging); si no, el dominio real de produccion.
 * A proposito no sale de nada especifico de Vercel: el sitio va a mudarse a
 * un hosting propio y esto tiene que seguir sirviendo despues de esa mudanza.
 */
export const SITIO_URL = (process.env.NEXT_PUBLIC_SITIO_URL || "https://labodegadelaeconomia.cl").replace(
  /\/+$/,
  ""
);

/** Arma una URL absoluta a partir de una ruta del sitio ("/", "/sitemap.xml"). */
export function urlAbsoluta(ruta: string): string {
  return `${SITIO_URL}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}
