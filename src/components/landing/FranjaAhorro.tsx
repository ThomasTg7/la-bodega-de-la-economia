"use client";

import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";
import FranjaParallax from "./FranjaParallax";

/** Franja de respiro entre "Quiénes somos" y los pasos. Solo una frase. */
export default function FranjaAhorro() {
  return (
    <FranjaParallax
      imagen="/texturas/limones.webp"
      imagenMovil="/texturas/limones-movil.webp"
      blurDataURL={BLUR_TEXTURAS.limones}
      profundidad={0.45}
      velo={0.62}
      // La franja es un respiro, no una sección: con 78svh se comía una
      // pantalla entera de scroll para mostrar una sola frase. La frase ahora
      // es más grande, así que el alto se apoya menos en el vacío.
      className="min-h-[42svh] py-12 md:min-h-[62svh] md:py-24"
    >
      <h2
        className="mx-auto font-titulo text-white"
        style={{
          fontSize: "clamp(2.1rem, 7.4vw, 4.4rem)",
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
