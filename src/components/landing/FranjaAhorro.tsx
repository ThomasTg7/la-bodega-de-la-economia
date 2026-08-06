"use client";

import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";
import FranjaParallax from "./FranjaParallax";

/** Franja de respiro entre la portada y el catálogo. Solo una frase. */
export default function FranjaAhorro() {
  return (
    <FranjaParallax
      imagen="/texturas/limones.webp"
      imagenMovil="/texturas/limones-movil.webp"
      blurDataURL={BLUR_TEXTURAS.limones}
      profundidad={0.45}
      velo={0.62}
      className="min-h-[78svh] py-28 md:py-32"
    >
      <h2
        className="mx-auto font-titulo text-white"
        style={{
          fontSize: "clamp(1.6rem, 5.2vw, 3.6rem)",
          lineHeight: 1.1,
          // 20ch: con menos, "DONDE AHORRAR ES" se parte en móvil y el "ES"
          // queda solo en una línea.
          maxWidth: "20ch",
          textShadow: "0 6px 40px rgba(0,0,0,.55)",
        }}
      >
        <span className="block">
          <TextoRevelado texto="DONDE " modo="palabra" as="span" />
          <TextoRevelado
            texto="AHORRAR"
            modo="palabra"
            as="span"
            delayInicial={0.08}
            className="text-verde-300"
          />
          <TextoRevelado texto=" ES" modo="palabra" as="span" delayInicial={0.16} />
        </span>
        <span className="block">
          <TextoRevelado texto="LA ÚNICA " modo="palabra" as="span" delayInicial={0.24} />
          <TextoRevelado
            texto="OPCIÓN"
            modo="palabra"
            as="span"
            delayInicial={0.36}
            className="text-verde-300"
          />
        </span>
      </h2>

      <SeccionEntrada delay={0.15}>
        <p
          className="mx-auto mt-6 text-white/85"
          style={{ fontSize: "var(--text-cuerpo)", maxWidth: "40ch" }}
        >
          Un precio justo para locales comerciales o para comenzar a emprender.
        </p>
      </SeccionEntrada>
    </FranjaParallax>
  );
}
