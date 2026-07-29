"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { EASE_SALIDA, useMovimientoReducido } from "@/lib/motion-config";

/**
 * Envuelve el contenido de cada página del panel. La `key` con el pathname
 * fuerza el remontaje al cambiar de ruta, así cada pantalla entra con un
 * fundido corto en vez de aparecer de golpe. El layout (barra lateral y
 * cabecera) queda fuera y nunca parpadea.
 */
export default function TransicionPagina({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducido = useMovimientoReducido();

  if (reducido) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: EASE_SALIDA }}
    >
      {children}
    </motion.div>
  );
}
