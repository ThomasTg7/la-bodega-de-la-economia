import type { MetadataRoute } from "next";
import { SITIO_URL, urlAbsoluta } from "@/lib/sitio";

/**
 * Si `NEXT_PUBLIC_SITIO_URL` apunta a otra cosa que el dominio real (un
 * preview, un staging), no hay sitemap que valga: se bloquea todo para que
 * ese entorno no compita por indexacion con el sitio de verdad.
 */
const ES_PRODUCCION = SITIO_URL === "https://labodegadelaeconomia.cl";

export default function robots(): MetadataRoute.Robots {
  if (!ES_PRODUCCION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
