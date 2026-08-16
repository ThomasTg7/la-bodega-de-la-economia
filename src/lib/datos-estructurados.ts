import type { Ajustes, Producto } from "@prisma/client";
import { MAPA_BODEGA, REGION, TIKTOK_URL } from "@/lib/constantes";
import { linkMapa } from "@/lib/mapa";
import { HORARIOS } from "@/lib/horarios";
import { texturaDe } from "@/lib/texturas-producto";
import { SITIO_URL, urlAbsoluta } from "@/lib/sitio";

/**
 * JSON-LD para buscadores. Tres objetos en un solo array, cada uno con su
 * propio "@context" — el mismo patron que usan Yoast/Rank Math y que Google
 * soporta sin problema en un unico <script>.
 *
 * Los datos salen de lo mismo que ya pinta la pagina (Ajustes, HORARIOS,
 * productos activos): si cambian desde el panel, el JSON-LD cambia solo.
 */

const DIAS_SEMANA: Record<string, string[]> = {
  "Lunes a viernes": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  Sábado: ["Saturday"],
};

function horaISO(hora: string): string {
  const [h, m] = hora.split(":");
  return `${h.padStart(2, "0")}:${m ?? "00"}`;
}

function horariosEstructurados() {
  return HORARIOS.filter((f) => !f.cerrado && DIAS_SEMANA[f.dias])
    .map((f) => {
      const [desde, hasta] = f.horas.split(" a ");
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DIAS_SEMANA[f.dias],
        opens: horaISO(desde),
        closes: horaISO(hasta),
      };
    });
}

function tiendaEstructurada(ajustes: Ajustes) {
  return {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "@id": urlAbsoluta("/#negocio"),
    name: ajustes.nombreNegocio,
    description: ajustes.descripcion,
    url: SITIO_URL,
    image: urlAbsoluta("/opengraph-image.png"),
    telephone: ajustes.telefono1,
    priceRange: "$$",
    currenciesAccepted: "CLP",
    paymentAccepted: "Cash, Bank transfer",
    address: {
      "@type": "PostalAddress",
      streetAddress: ajustes.direccion,
      addressLocality: ajustes.ciudad,
      addressRegion: REGION,
      addressCountry: "CL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: MAPA_BODEGA.lat,
      longitude: MAPA_BODEGA.lng,
    },
    hasMap: linkMapa(ajustes),
    openingHoursSpecification: horariosEstructurados(),
    sameAs: [TIKTOK_URL],
  };
}

function sitioEstructurado() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": urlAbsoluta("/#sitio"),
    url: SITIO_URL,
    name: "La bodega de la economía",
    inLanguage: "es-CL",
  };
}

function productoEstructurado(producto: Producto, pedidoMinimoKg: number) {
  const precio = producto.precioBase ?? producto.precioDescuento;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": urlAbsoluta(`/#producto-${producto.slug}`),
    name: producto.nombre,
    description: producto.descripcion || undefined,
    image: urlAbsoluta(texturaDe(producto)),
    ...(precio != null
      ? {
          offers: {
            "@type": "Offer",
            url: SITIO_URL,
            priceCurrency: "CLP",
            price: precio,
            availability: "https://schema.org/InStock",
            eligibleQuantity: {
              "@type": "QuantitativeValue",
              minValue: pedidoMinimoKg,
              unitCode: "KGM",
            },
          },
        }
      : {}),
  };
}

export function datosEstructurados(ajustes: Ajustes, productos: Producto[]) {
  return [
    tiendaEstructurada(ajustes),
    sitioEstructurado(),
    ...productos.map((p) => productoEstructurado(p, ajustes.pedidoMinimoKg)),
  ];
}
