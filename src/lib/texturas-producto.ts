/**
 * Foto de catalogo por slug, cuando el producto no tiene `imagenTextura`
 * propia cargada desde el panel. Los slugs no calzan uno a uno con los
 * nombres de archivo (palta-hass -> paltas.webp), asi que el mapa es
 * explicito en vez de interpolado.
 *
 * Vive separado de TarjetaProducto (que es "use client") para que el JSON-LD,
 * que se arma en el server component de la pagina, pueda resolver la misma
 * imagen sin cruzar la frontera cliente/servidor.
 */
export const TEXTURA_POR_SLUG: Record<string, string> = {
  "palta-hass": "/texturas/paltas.webp",
  limon: "/texturas/limones.webp",
  naranja: "/texturas/naranjas.webp",
  mandarina: "/texturas/mandarinas.webp",
};

export const TEXTURA_POR_DEFECTO = "/texturas/paltas.webp";

export function texturaDe(producto: { imagenTextura: string; slug: string }): string {
  return producto.imagenTextura || TEXTURA_POR_SLUG[producto.slug] || TEXTURA_POR_DEFECTO;
}
