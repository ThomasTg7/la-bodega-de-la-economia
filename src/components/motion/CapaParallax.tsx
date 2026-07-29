"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "motion/react";
import { RESORTE_SCROLL, useEsMovil, useMovimientoReducido } from "@/lib/motion-config";

type Props = {
  /** 0 (fondo, casi quieto) a 1 (primer plano, se mueve mucho). */
  profundidad: number;
  direccion?: "y" | "x";
  /** [escalaInicial, escalaFinal] a lo largo del scroll. */
  escala?: [number, number];
  /** grados de rotación: un número anima 0→N; una tupla anima [desde, hasta]. */
  rotacion?: number | [number, number];
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Capa que se traslada (y opcionalmente escala/rota) según el progreso de
 * scroll del elemento en el viewport. `profundidad` fija qué tan rápido se
 * mueve respecto al scroll: fondo ~0.10, medio ~0.28, frente ~0.55+.
 */
export default function CapaParallax({
  profundidad,
  direccion = "y",
  escala,
  rotacion,
  className,
  style,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const esMovil = useEsMovil();
  const reducido = useMovimientoReducido();

  // will-change solo mientras el elemento está cerca del viewport — dejarlo
  // permanente en todas las capas parallax de la página consume memoria de
  // GPU sin necesidad.
  const enVista = useInView(ref, { margin: "200px 0px 200px 0px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const suave = useSpring(scrollYProgress, RESORTE_SCROLL);

  const factor = (esMovil ? profundidad * 0.5 : profundidad) * (reducido ? 0 : 1);
  const desplazamiento = useTransform(
    suave,
    [0, 1],
    [`${factor * -100}px`, `${factor * 100}px`]
  );
  const escalaValor = useTransform(suave, [0, 1], escala ?? [1, 1]);
  const rangoRotacion: [number, number] = Array.isArray(rotacion)
    ? rotacion
    : [0, rotacion ?? 0];
  const rotacionValor = useTransform(
    suave,
    [0, 1],
    reducido ? [rangoRotacion[0], rangoRotacion[0]] : rangoRotacion
  );

  const estiloMovimiento =
    direccion === "y"
      ? { y: desplazamiento, scale: escalaValor, rotate: rotacionValor }
      : { x: desplazamiento, scale: escalaValor, rotate: rotacionValor };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, ...estiloMovimiento, willChange: enVista ? "transform" : "auto" }}
    >
      {children}
    </motion.div>
  );
}
