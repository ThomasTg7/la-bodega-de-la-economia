"use client";

import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";
import { HORARIOS } from "@/lib/horarios";
import FranjaParallax from "./FranjaParallax";

export default function Cifras() {
  return (
    <FranjaParallax
      imagen="/texturas/naranjas.webp"
      imagenMovil="/texturas/naranjas-movil.webp"
      blurDataURL={BLUR_TEXTURAS.naranjas}
      profundidad={0.38}
      velo={0.62}
      className="py-24"
    >
      <p className="flex items-center justify-center gap-3 text-xs font-bold tracking-[0.18em] text-limon uppercase">
        <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-naranja" />
        Cuándo venir
      </p>

      <h2
        className="mt-4 font-titulo text-white"
        style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)", lineHeight: 1.02 }}
      >
        <TextoRevelado texto="Horarios" modo="palabra" as="span" />
      </h2>

      <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3">
        {HORARIOS.map((fila, i) => (
          <SeccionEntrada key={fila.dias} delay={0.08 * i}>
            {/* Recuadro blanco casi opaco: sobre la foto de fondo, un blanco
                al 10% dejaba el texto peleando con la textura. Con el fondo
                claro el texto pasa a ser oscuro. */}
            <div
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-2xl bg-white/90 px-5 py-4 text-left"
              style={{ opacity: fila.cerrado ? 0.82 : 1 }}
            >
              <span className="font-semibold text-verde-700" style={{ fontSize: "1.05rem" }}>
                {fila.dias}
              </span>
              <span
                className={
                  fila.cerrado ? "font-titulo text-tinta-suave" : "font-titulo text-verde-600"
                }
                style={{ fontSize: "1.45rem", fontVariantNumeric: "tabular-nums" }}
              >
                {fila.horas}
              </span>
            </div>
          </SeccionEntrada>
        ))}
      </div>
    </FranjaParallax>
  );
}
