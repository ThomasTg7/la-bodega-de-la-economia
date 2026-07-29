"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { RESORTE_UI, useTieneHoverFino } from "@/lib/motion-config";

type Props = {
  className?: string;
  intensidadRotacion?: number; // grados máximos
  intensidadTraslacion?: number; // px máximos
  children: React.ReactNode;
};

/**
 * Inclina su contenido en 3D siguiendo la posición del mouse. Solo se activa
 * en dispositivos con mouse real (hover + puntero fino) — en táctil no
 * existe hover, así que se renderiza estático sin costo extra.
 */
export default function TiltMouse({
  className,
  intensidadRotacion = 10,
  intensidadTraslacion = 14,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const activo = useTieneHoverFino();

  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const traX = useMotionValue(0);
  const traY = useMotionValue(0);

  const rotXSuave = useSpring(rotX, RESORTE_UI);
  const rotYSuave = useSpring(rotY, RESORTE_UI);
  const traXSuave = useSpring(traX, RESORTE_UI);
  const traYSuave = useSpring(traY, RESORTE_UI);

  function manejarMovimiento(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotY.set(px * intensidadRotacion * 2);
    rotX.set(-py * intensidadRotacion * 2);
    traX.set(px * intensidadTraslacion * 2);
    traY.set(py * intensidadTraslacion * 2);
  }

  function resetear() {
    rotX.set(0);
    rotY.set(0);
    traX.set(0);
    traY.set(0);
  }

  if (!activo) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={manejarMovimiento}
      onMouseLeave={resetear}
      style={{
        rotateX: rotXSuave,
        rotateY: rotYSuave,
        x: traXSuave,
        y: traYSuave,
        transformPerspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
}
