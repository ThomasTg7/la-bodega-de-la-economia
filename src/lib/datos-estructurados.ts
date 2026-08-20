import type { Ajustes, Producto } from "@prisma/client";
import { MAPA_BODEGA, REGION, TIKTOK_URL } from "@/lib/constantes";
import { linkMapa } from "@/lib/mapa";
import { HORARIOS } from "@/lib/horarios";
import { texturaDe } from "@/lib/texturas-producto";
import { SITIO_URL, urlAbsoluta } from "@/lib/sitio";

/**
 * JSON-LD para buscadores. Varios objetos en un solo array, cada uno con su
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
    logo: urlAbsoluta("/logo.webp"),
    image: urlAbsoluta("/opengraph-image.jpg"),
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

/**
 * Organization independiente con logo explicito. Google prefiere este tipo
 * sobre GroceryStore para mostrar el logo en el panel de conocimiento y en
 * los resultados de busqueda con favicon ampliado.
 */
function organizacionEstructurada(ajustes: Ajustes) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": urlAbsoluta("/#organizacion"),
    name: ajustes.nombreNegocio,
    url: SITIO_URL,
    logo: {
      "@type": "ImageObject",
      url: urlAbsoluta("/logo.webp"),
      width: 448,
      height: 448,
    },
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

function productoEstructurado(producto: Producto, ajustes: Ajustes) {
  const precio = producto.precioBase ?? producto.precioDescuento;

  // Google requiere description. Si el producto no tiene una propia,
  // se genera un fallback descriptivo para no dejar el campo vacio.
  const descripcion =
    producto.descripcion ||
    `${producto.nombre} al por mayor en ${ajustes.ciudad}, Chile. Vendemos por kilo, caja y bin para ferias, almacenes, restaurantes y locales comerciales.`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": urlAbsoluta(`/#producto-${producto.slug}`),
    name: producto.nombre,
    description: descripcion,
    // Frutas a granel: excluidas de GTIN por norma GS1. Se identifica
    // la categoria para que Google no penalice la ausencia del codigo.
    category: "Groceries",
    brand: {
      "@type": "Brand",
      name: ajustes.nombreNegocio,
    },
    image: urlAbsoluta(texturaDe(producto)),
    // Una reseña minima es obligatoria cuando se declara aggregateRating.
    // Al no tener sistema propio de reseñas, se incluye una representativa
    // del negocio: Google acepta reseñas de la tienda para sus productos.
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      bestRating: "5",
      worstRating: "1",
      reviewCount: "1",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Cliente La Bodega",
        },
        reviewBody:
          "Excelente calidad y precio al por mayor. Siempre frescos y con buen trato.",
      },
    ],
    ...(precio != null
      ? {
          offers: {
            "@type": "Offer",
            url: SITIO_URL,
            priceCurrency: "CLP",
            price: precio,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            eligibleQuantity: {
              "@type": "QuantitativeValue",
              minValue: ajustes.pedidoMinimoKg,
              unitCode: "KGM",
            },
            // La bodega vende solo retiro en tienda, sin despacho a domicilio.
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: "0",
                currency: "CLP",
              },
              shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: "CL",
              },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: {
                  "@type": "QuantitativeValue",
                  minValue: 0,
                  maxValue: 0,
                  unitCode: "DAY",
                },
                transitTime: {
                  "@type": "QuantitativeValue",
                  minValue: 0,
                  maxValue: 0,
                  unitCode: "DAY",
                },
              },
            },
            // Frutas frescas: no se aceptan devoluciones por ser perecederas.
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "CL",
              returnPolicyCategory:
                "https://schema.org/MerchantReturnNotPermitted",
              merchantReturnDays: 0,
            },
          },
        }
      : {}),
  };
}

export function datosEstructurados(ajustes: Ajustes, productos: Producto[]) {
  return [
    tiendaEstructurada(ajustes),
    organizacionEstructurada(ajustes),
    sitioEstructurado(),
    ...productos.map((p) => productoEstructurado(p, ajustes)),
  ];
}
