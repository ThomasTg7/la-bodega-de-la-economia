"use client";

import { motion } from "motion/react";
import { useMovimientoReducido } from "@/lib/motion-config";

type Props = {
  /** índice del elemento en su grupo — desfasa la duración para que el conjunto no se sincronice. */
  indice?: number;
  amplitud?: number;
  className?: string;
  mostrarSombra?: boolean;
  children: React.ReactNode;
};

/**
 * Hace flotar suavemente a su contenido (sube/baja + leve balanceo) en un
 * bucle infinito independiente del scroll, con una sombra de contacto que
 * se achica y aclara en contrafase — así el objeto se lee como algo físico
 * que se despega de la superficie, no como una imagen pegada.
 */
export default function ObjetoFlotante({
  indice = 0,
  amplitud = 18,
  className,
  mostrarSombra = true,
  children,
}: Props) {
  const reducido = useMovimientoReducido();
  // Duraciones "primas" entre sí para que varios ObjetoFlotante en pantalla
  // nunca queden en fase.
  const duracion = 7 + indice * 1.3;

  if (reducido) {
    return (
      <div className={className} style={{ position: "relative" }}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <motion.div
        animate={{ y: [0, -amplitud, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: duracion, repeat: Infinity, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
      {mostrarSombra && (
        <motion.div
          aria-hidden="true"
          animate={{ scaleX: [1, 0.72, 1], opacity: [0.9, 0.5, 0.9] }}
          transition={{ duration: duracion, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-4%",
            width: "72%",
            height: "15%",
            transform: "translateX(-50%)",
            borderRadius: "999px",
            background: "radial-gradient(ellipse, rgba(11,43,34,.34), transparent 72%)",
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
