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
      // En móvil la franja es un respiro, no una sección: con 78svh se comía
      // una pantalla entera de scroll para mostrar una sola frase.
      className="min-h-[52svh] py-16 md:min-h-[78svh] md:py-32"
    >
      <h2
        className="mx-auto font-titulo text-white"
        style={{
          fontSize: "clamp(1.6rem, 5.2vw, 3.6rem)",
          lineHeight: 1.1,
          // 20ch: con menos, "PRECIOS AL ALCANCE" se parte en móvil y deja
          // una palabra suelta en su propia línea.
          maxWidth: "20ch",
          textShadow: "0 6px 40px rgba(0,0,0,.55)",
        }}
      >
        <span className="block">
          <TextoRevelado texto="PRECIOS AL" modo="palabra" as="span" />
        </span>
        <span className="block">
          <TextoRevelado texto="ALCANCE DE SU " modo="palabra" as="span" delayInicial={0.16} />
          <TextoRevelado
            texto="BOLSILLO"
            modo="palabra"
            as="span"
            delayInicial={0.32}
            className="text-verde-300"
          />
        </span>
      </h2>

      <SeccionEntrada delay={0.15}>
        <p
          className="mx-auto mt-6 text-white/85"
          style={{ fontSize: "var(--text-cuerpo)", maxWidth: "40ch" }}
        >
          Trato de primera mano, atendido por sus dueños.
        </p>
      </SeccionEntrada>
    </FranjaParallax>
  );
}
