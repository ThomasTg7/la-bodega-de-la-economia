"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { RESORTE_SCROLL, useEsMovil, useMovimientoReducido } from "@/lib/motion-config";

type Props = {
  /** Foto de fondo a sangre. */
  imagen: string;
  /** Variante recortada en vertical, se usa en vez de `imagen` bajo los 768px. */
  imagenMovil?: string;
  blurDataURL?: string;
  /** Cuánto se desplaza el fondo respecto al scroll (0 = quieto). */
  profundidad?: number;
  /** Oscurecimiento sobre la foto, 0 a 1. */
  velo?: number;
  className?: string;
  id?: string;
  children: React.ReactNode;
};

/**
 * Franja a pantalla partida con foto de fondo que se desplaza más lento que
 * el contenido. El fondo se monta sobredimensionado (inset -30%) para que el
 * desplazamiento nunca deje ver el borde de la imagen.
 */
export default function FranjaParallax({
  imagen,
  imagenMovil,
  blurDataURL,
  profundidad = 0.24,
  velo = 0.55,
  className = "",
  id,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const esMovil = useEsMovil();
  const reducido = useMovimientoReducido();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const suave = useSpring(scrollYProgress, RESORTE_SCROLL);

  const factor = (esMovil ? profundidad * 0.6 : profundidad) * (reducido ? 0 : 1);
  const yFondo = useTransform(suave, [0, 1], [`${factor * -260}px`, `${factor * 260}px`]);
  // La foto entra grande y se va asentando: refuerza la sensación de que
  // está más lejos que el texto, que va en sentido contrario.
  //
  // En móvil arranca mucho más cerca del 1. La variante vertical ya viene
  // recortada para ese ancho, así que el 1.28 de escritorio la ampliaba
  // encima del recorte y la dejaba encimosa; el desplazamiento del parallax
  // en móvil también es menor (factor * 0.6), o sea que no necesita tanto
  // sobrante para no descubrir el borde.
  const escalaMax = esMovil ? 1.1 : 1.28;
  const escalaMin = esMovil ? 1.02 : 1.14;
  const escalaFondo = useTransform(
    suave,
    [0, 0.5, 1],
    reducido ? [1, 1, 1] : [escalaMax, escalaMin, escalaMax]
  );
  const yTexto = useTransform(suave, [0, 1], reducido ? ["0px", "0px"] : ["90px", "-90px"]);
  const opacidadTexto = useTransform(
    suave,
    [0, 0.2, 0.8, 1],
    reducido ? [1, 1, 1, 1] : [0.2, 1, 1, 0.2]
  );

  return (
    <section
      ref={ref}
      id={id}
      className={`relative grid place-items-center overflow-hidden bg-verde-700 text-center ${className}`}
    >
      {/* El sobrante vertical es lo que más acerca la foto: la caja mide un
          190% del alto de la franja y `object-cover` la escala hasta llenarla,
          recortando por los lados. En móvil basta un 144% para tapar el
          recorrido del parallax (±70px con el factor reducido), y la foto se
          ve bastante más lejos. */}
      <motion.div
        className="absolute inset-[-22%_0] z-0 md:inset-[-45%_0]"
        style={{ y: yFondo, scale: escalaFondo }}
      >
        <Image
          src={esMovil && imagenMovil ? imagenMovil : imagen}
          alt=""
          fill
          aria-hidden="true"
          sizes="100vw"
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          className="object-cover"
        />
      </motion.div>

      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1]"
        style={{ background: `rgba(1,42,27,${velo})` }}
      />

      <motion.div
        style={{ y: yTexto, opacity: opacidadTexto }}
        className="relative z-[2] mx-auto w-full max-w-5xl px-6 md:px-10"
      >
        {children}
      </motion.div>
    </section>
  );
}
