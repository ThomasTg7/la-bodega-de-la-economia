import type { Ajustes } from "@prisma/client";
import { MAPA_BODEGA } from "@/lib/constantes";

/**
 * Link del botón "Cómo llegar". Si en el panel cargaron un link propio se usa
 * ese; si no, la ficha real del local en Google Maps, que abre la app de mapas
 * en el teléfono con la ruta lista.
 */
export function linkMapa(ajustes: Pick<Ajustes, "mapaUrl">) {
  return ajustes.mapaUrl || MAPA_BODEGA.ficha;
}

/**
 * Mapa incrustado en un <iframe>, sin API key ni facturación: el modo
 * `output=embed` de Google Maps es el mismo que entrega el botón "Compartir →
 * Insertar un mapa" de la ficha.
 *
 * La consulta va por el nombre publicado del local y no por coordenadas: con
 * el nombre, el pin sale con la etiqueta del negocio; con coordenadas, Google
 * se come la etiqueta en la redirección y queda un pin anónimo.
 */
export function embedMapa(zoom = 17) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(MAPA_BODEGA.consulta)}&z=${zoom}&hl=es&output=embed`;
}
