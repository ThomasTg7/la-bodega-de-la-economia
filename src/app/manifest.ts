import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La bodega de la economía",
    short_name: "La bodega",
    description:
      "Paltas, limones y naranjas siempre al por mayor en Rancagua, con descuento por volumen.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1da38c",
    lang: "es-CL",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
