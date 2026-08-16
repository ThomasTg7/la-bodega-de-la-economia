import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITIO_URL } from "@/lib/sitio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // El sitemap se resuelve en build; si la base no responde en ese momento
  // no puede tumbar el build entero por una fecha.
  let ultimaModificacion = new Date();
  try {
    const ajustes = await db.ajustes.findUnique({ where: { id: "sitio" } });
    if (ajustes) ultimaModificacion = ajustes.actualizadoEn;
  } catch {
    // se queda con la fecha de ahora
  }

  return [
    {
      url: SITIO_URL,
      lastModified: ultimaModificacion,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
