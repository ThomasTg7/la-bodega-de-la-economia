"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useMovimientoReducido, EASE_SALIDA } from "@/lib/motion-config";

type Props = {
  texto: string;
  modo?: "palabra" | "caracter";
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  claseUnidad?: string;
  /** delay antes de que arranque la primera unidad (para encadenar tras otros elementos). */
  delayInicial?: number;
  once?: boolean;
  /**
   * "vista" espera a que el texto entre en pantalla. "carga" anima apenas
   * monta: obligatorio sobre el pliegue, donde el observador puede no
   * llegar a dispararse nunca y el texto se quedaría invisible.
   */
  arranque?: "vista" | "carga";
};

/**
 * Revela un texto palabra a palabra o carácter a carácter con un
 * desplazamiento vertical + blur. El texto completo queda accesible
 * (sr-only); la versión animada lleva aria-hidden.
 */
export default function TextoRevelado({
  texto,
  modo = "palabra",
  as = "span",
  className,
  claseUnidad,
  delayInicial = 0,
  once = true,
  arranque = "vista",
}: Props) {
  const reducido = useMovimientoReducido();
  const ref = useRef<HTMLSpanElement>(null);
  // margin positivo abajo: dispara apenas asoma, en vez de exigir que ya
  // esté un 10% dentro. Un título que no se revela es un título invisible.
  const enVista = useInView(ref, { once, margin: "0px 0px -5% 0px", amount: 0.05 });
  const [respaldo, setRespaldo] = useState(false);
  const Tag = as;

  // Red de seguridad. Si el IntersectionObserver no dispara —pasa con
  // content-visibility, con contenedores transformados y en algunos
  // navegadores— el título se queda en opacity 0 para siempre. Este sondeo
  // lo revela igual en cuanto entra en pantalla, y se apaga solo apenas
  // alguno de los dos caminos gana.
  useEffect(() => {
    if (!once || arranque === "carga" || enVista || respaldo) return;
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
  }, [once, arranque, enVista, respaldo]);

  if (reducido) {
    return <Tag className={className}>{texto}</Tag>;
  }

  const visible = arranque === "carga" || enVista || respaldo;
  const unidades = modo === "caracter" ? Array.from(texto) : texto.split(" ");

  return (
    <Tag className={className} style={{ perspective: "800px" }}>
      {/* userSelect:none evita que copiar el título traiga el texto dos
          veces: la copia accesible y la animada. */}
      <span className="sr-only" style={{ userSelect: "none" }}>
        {texto}
      </span>
      <span aria-hidden="true" ref={ref}>
        {unidades.map((unidad, i) => {
          const esEspacio = unidad === " ";
          const contenido =
            modo === "caracter"
              ? esEspacio
                ? " "
                : unidad
              : unidad + (i < unidades.length - 1 ? " " : "");
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "top",
                // Colchón imprescindible: con line-height < 1 la caja de
                // recorte mide menos que el glifo y se come tildes y colas.
                // El margen negativo devuelve el espacio al layout.
                padding: "0.18em 0.04em",
                margin: "-0.18em -0.04em",
              }}
            >
              <motion.span
                className={claseUnidad}
                style={{ display: "inline-block", willChange: "transform, opacity" }}
                initial={{ y: "130%", opacity: 0, filter: "blur(12px)" }}
                animate={
                  visible
                    ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                    : { y: "130%", opacity: 0, filter: "blur(12px)" }
                }
                transition={{
                  duration: 0.85,
                  ease: EASE_SALIDA,
                  delay: visible ? delayInicial + i * 0.035 : 0,
                }}
              >
                {contenido}
              </motion.span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
