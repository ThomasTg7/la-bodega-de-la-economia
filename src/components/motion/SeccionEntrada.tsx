"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { EASE_SALIDA } from "@/lib/motion-config";

type Props = {
  className?: string;
  delay?: number;
  as?: "div" | "section";
  children: React.ReactNode;
};

/** Fade + elevación estándar cuando la sección entra en el viewport. */
export default function SeccionEntrada({ className, delay = 0, as = "div", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { once: true, margin: "0px 0px -5% 0px", amount: 0.05 });
  const [respaldo, setRespaldo] = useState(false);

  // Mismo seguro que en TextoRevelado: si el observador no dispara, el
  // bloque se queda en opacity 0 y el contenido desaparece de la página.
  useEffect(() => {
    if (enVista || respaldo) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const caja = el.getBoundingClientRect();
      if (caja.top < window.innerHeight * 1.05 && caja.bottom > 0) {
        setRespaldo(true);
        clearInterval(id);
      }
    }, 700);
    return () => clearInterval(id);
  }, [enVista, respaldo]);

  const MotionTag = as === "section" ? motion.section : motion.div;
  const visible = enVista || respaldo;

  return (
    <MotionTag
      ref={ref as React.RefObject<HTMLDivElement & HTMLElement>}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.75, ease: EASE_SALIDA, delay }}
    >
      {children}
    </MotionTag>
  );
}
