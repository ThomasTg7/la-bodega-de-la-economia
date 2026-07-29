"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useMovimientoReducido } from "@/lib/motion-config";

type Props = {
  texto: string;
  /** segundos antes de empezar a escribir. */
  delay?: number;
  /** milisegundos por carácter. */
  velocidad?: number;
  /** false espera; ej. la tarjeta todavía no entra en pantalla. */
  activo?: boolean;
  /**
   * Red de seguridad: si `activo` no llega a ser true en este plazo (ms), se
   * escribe igual. Un precio es información crítica — jamás puede quedar
   * invisible porque un IntersectionObserver no disparó.
   */
  respaldoMs?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Escribe un texto carácter a carácter, como si alguien lo anotara con tiza
 * en la pizarra. El valor completo queda siempre en el árbol accesible.
 */
export default function NumeroEscrito({
  texto,
  delay = 0,
  velocidad = 90,
  activo = true,
  respaldoMs = 6000,
  className,
  style,
}: Props) {
  const reducido = useMovimientoReducido();
  const [escritos, setEscritos] = useState(0);
  const [forzado, setForzado] = useState(false);

  useEffect(() => {
    if (respaldoMs <= 0) return;
    const t = setTimeout(() => setForzado(true), respaldoMs);
    return () => clearTimeout(t);
  }, [respaldoMs]);

  const debeEscribir = activo || forzado;

  useEffect(() => {
    if (!debeEscribir || reducido) return;

    let intervalo: ReturnType<typeof setInterval>;
    const arranque = setTimeout(() => {
      let i = 0;
      intervalo = setInterval(() => {
        i += 1;
        setEscritos(i);
        if (i >= texto.length) clearInterval(intervalo);
      }, velocidad);
    }, delay * 1000);

    return () => {
      clearTimeout(arranque);
      clearInterval(intervalo);
    };
  }, [texto, delay, velocidad, debeEscribir, reducido]);

  const completo = reducido || escritos >= texto.length;
  const mostrado = reducido ? texto : texto.slice(0, escritos);

  return (
    <span className={className} style={style}>
      <span className="sr-only" style={{ userSelect: "none" }}>
        {texto}
      </span>
      <span aria-hidden="true" style={{ whiteSpace: "pre" }}>
        {mostrado}
        {!completo && (
          <motion.span
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              display: "inline-block",
              width: "0.08em",
              height: "0.72em",
              marginLeft: "0.04em",
              background: "currentColor",
              borderRadius: 2,
            }}
          />
        )}
      </span>
    </span>
  );
}
