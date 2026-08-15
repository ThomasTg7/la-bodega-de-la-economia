/**
 * El carrusel de "Quiénes somos" y el de la sección Ubicación se alimentan
 * del mismo campo: `Ajustes.galeria`, un JSON de rutas.
 *
 * El tope existe por dos razones: el campo es un VarChar(3000) en la base y
 * seis URLs de Blob ya lo dejan a media capacidad, y un carrusel con más de
 * seis fotos nadie lo mira entero.
 */
export const MAX_FOTOS_GALERIA = 6;

/** Las que trae el sitio de fábrica, si el panel nunca subió ninguna. */
export const GALERIA_DEFECTO = [
  "/fotos-local/local-1.webp",
  "/fotos-local/local-2.webp",
  "/fotos-local/local-3.webp",
] as const;

/** Lee el JSON del campo y descarta lo que no sea una ruta. */
export function parsearGaleria(json: string): string[] {
  try {
    const lista = JSON.parse(json || "[]");
    if (!Array.isArray(lista)) return [];
    return lista
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .slice(0, MAX_FOTOS_GALERIA);
  } catch {
    return [];
  }
}
