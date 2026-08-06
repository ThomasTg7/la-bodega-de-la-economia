import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    formats: ["image/webp"],
    // Las fotos que sube el panel viven en Vercel Blob, no en /public. El
    // subdominio lleva el id del store, que cambia entre entornos, así que se
    // deja el comodín en esa parte y se cierra el resto del patrón.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
