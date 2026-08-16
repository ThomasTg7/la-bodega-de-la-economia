import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // "motion" no viene en la lista de paquetes optimizados por defecto de
  // Next: sin esto, un `import { motion } from "motion/react"` puede traer
  // mas modulos de los que el componente usa. No cambia como se escribe el
  // codigo, solo lo que termina en el bundle.
  experimental: {
    optimizePackageImports: ["motion"],
  },
  images: {
    // Solo WebP y no tambien AVIF: codificar AVIF es caro en CPU y duplica
    // lo que el optimizador guarda en cache (una copia por formato), y el
    // hosting comparte 2 GB de memoria y 5 GB de disco entre todo. Si algun
    // dia sobra maquina, agregar "image/avif" primero en esta lista es todo
    // el cambio.
    formats: ["image/webp"],
    // Next 16 exige declarar que calidades se permiten optimizar. El sitio
    // solo pide 75 (el default de `next/image`), asi que es la unica.
    qualities: [75],
    // Los originales no cambian salvo que alguien resuba la foto con otro
    // nombre (ver el comentario de mas abajo sobre los estaticos de
    // /public), asi que el cache del optimizador puede vivir tranquilo.
    minimumCacheTTL: 31536000,
    // Sin remotePatterns: todas las imágenes son locales. Las que sube el
    // panel quedan en public/uploads del propio hosting, así que entran por
    // ruta relativa igual que las que vienen con el sitio.
  },
  async headers() {
    // Cache inmutable para los estaticos que ya vienen versionados a mano
    // por los scripts de scripts/ (preparar-imagenes.py, preparar-logo.py,
    // etc). Va aca y no en la configuracion del hosting para que lo aplique
    // el propio servidor de Next, sin depender de donde corra.
    //
    // Con esto puesto, reemplazar una de estas fotos tiene que ser con un
    // nombre de archivo nuevo, no sobrescribiendo el mismo: un navegador que
    // ya la tenga en cache no va a volver a pedirla en un año.
    const inmutable = {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    };
    return [
      { source: "/texturas/:path*", headers: [inmutable] },
      { source: "/fotos-local/:path*", headers: [inmutable] },
      { source: "/recortes/:path*", headers: [inmutable] },
      { source: "/logo.webp", headers: [inmutable] },
    ];
  },
};

export default nextConfig;
