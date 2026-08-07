import type { Ajustes } from "@prisma/client";

/**
 * Link del botón "Cómo llegar". Si en el panel cargaron un link propio (el de
 * la ficha del local en Google Maps, por ejemplo) se usa ese; si no, se arma
 * una búsqueda por dirección, que lleva al mismo lugar sin tener que
 * configurar nada.
 */
export function linkMapa(ajustes: Pick<Ajustes, "mapaUrl" | "direccion" | "ciudad">) {
  if (ajustes.mapaUrl) return ajustes.mapaUrl;

  const consulta = `${ajustes.direccion}, ${ajustes.ciudad}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
}
