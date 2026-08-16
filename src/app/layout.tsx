import type { Metadata, Viewport } from "next";
import { Archivo_Black, Plus_Jakarta_Sans } from "next/font/google";
import { SITIO_URL } from "@/lib/sitio";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const TITULO = "La bodega de la economía — Paltas, limones y naranjas en Rancagua";
const DESCRIPCION =
  "Un emprendimiento local para locales, donde ahorrar es la única opción. Paltas, limones y naranjas siempre al por mayor en Rancagua, con descuento por volumen.";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: TITULO,
  description: DESCRIPCION,
  applicationName: "La bodega de la economía",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "/",
    siteName: "La bodega de la economía",
    title: TITULO,
    description: DESCRIPCION,
    // El alto, el ancho, el tipo y el texto alternativo no se declaran acá:
    // los pone Next leyendo el propio archivo src/app/opengraph-image.jpg y su
    // opengraph-image.alt.txt, que tienen prioridad sobre este objeto.
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1da38c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CL"
      className={`${archivoBlack.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        {/* La primera escena de FondoPortada es el LCP. Los `media` tienen
            que calzar exacto con los del <picture> de ese componente
            (max-width: 767px para la fuente movil) o el navegador termina
            pidiendo las dos imagenes en vez de una sola. */}
        <link
          rel="preload"
          as="image"
          href="/texturas/portada/principal-movil.webp"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/texturas/portada/principal.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        {/* El mapa incrustado del Hero trae maps.google.com/gstatic.com: la
            conexion se adelanta aca para que cuando el iframe la pida ya
            este lista. */}
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
