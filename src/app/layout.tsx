import type { Metadata, Viewport } from "next";
import { Archivo_Black, Plus_Jakarta_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "La bodega de la economía — Paltas, limones y naranjas en Rancagua",
  description:
    "Un emprendimiento local para locales, donde ahorrar es la única opción. Paltas, limones y naranjas al por mayor y al detalle en Rancagua.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
