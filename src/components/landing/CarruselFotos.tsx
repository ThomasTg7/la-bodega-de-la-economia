"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, animate, type PanInfo } from "motion/react";
import CapaParallax from "@/components/motion/CapaParallax";

type Props = {
  fotos: string[];
  /** aspect-ratio CSS del marco, ej. "9 / 16". Si falta, usa alturas fijas. */
  proporcion?: string;
  /** % del marco que ocupa el slide activo. 100 = sin asomo del vecino. */
  anchoSlidePct?: number;
};

const GAP_PX = 16;
const INTERVALO_AUTOPLAY = 5000;

export default function CarruselFotos({
  fotos,
  proporcion,
  anchoSlidePct = 78,
}: Props) {
  const ANCHO_SLIDE_PCT = anchoSlidePct;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [anchoViewport, setAnchoViewport] = useState(0);
  const [index, setIndex] = useState(0);
  const [autoplayActivo, setAutoplayActivo] = useState(true);
  const x = useMotionValue(0);
  const n = fotos.length;

  useEffect(() => {
    function medir() {
      setAnchoViewport(viewportRef.current?.offsetWidth ?? 0);
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const paso = (anchoViewport * ANCHO_SLIDE_PCT) / 100 + GAP_PX;
  const anchoSlide = (anchoViewport * ANCHO_SLIDE_PCT) / 100;

  function targetXFor(i: number) {
    const centrado = (anchoViewport - anchoSlide) / 2;
    return centrado - i * paso;
  }

  useEffect(() => {
    if (!anchoViewport) return;
    const controls = animate(x, targetXFor(index), {
      type: "spring",
      stiffness: 280,
      damping: 32,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, anchoViewport]);

  useEffect(() => {
    if (!autoplayActivo || n <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), INTERVALO_AUTOPLAY);
    return () => clearInterval(id);
  }, [autoplayActivo, n]);

  function indiceMasCercano(valorX: number) {
    let mejor = 0;
    let mejorDistancia = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(targetXFor(i) - valorX);
      if (d < mejorDistancia) {
        mejorDistancia = d;
        mejor = i;
      }
    }
    return mejor;
  }

  function manejarSoltar(_: unknown, info: PanInfo) {
    let nuevo = indiceMasCercano(x.get());
    if (Math.abs(info.velocity.x) > 500) {
      nuevo += info.velocity.x < 0 ? 1 : -1;
    }
    setAutoplayActivo(false);
    setIndex(Math.max(0, Math.min(n - 1, nuevo)));
  }

  function irA(i: number) {
    setAutoplayActivo(false);
    setIndex(Math.max(0, Math.min(n - 1, i)));
  }

  function manejarTeclado(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") irA(index + 1);
    if (e.key === "ArrowLeft") irA(index - 1);
  }

  if (n === 0) return null;

  return (
    <CapaParallax profundidad={0.12} direccion="x">
      <div
        className={`group/carrusel relative w-full overflow-hidden rounded-[14px] ${
          proporcion ? "" : "h-[260px] md:h-[340px]"
        }`}
        style={proporcion ? { aspectRatio: proporcion } : undefined}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Fotos del local"
        tabIndex={0}
        onKeyDown={manejarTeclado}
      >
        <div ref={viewportRef} className="h-full w-full">
          <motion.div
            drag={n > 1 ? "x" : false}
            dragConstraints={{ left: targetXFor(n - 1), right: targetXFor(0) }}
            dragElastic={0.12}
            dragMomentum
            onDragEnd={manejarSoltar}
            style={{ x }}
            className="flex h-full cursor-grab touch-pan-y items-center active:cursor-grabbing"
          >
            {fotos.map((foto, i) => (
              <motion.div
                key={foto + i}
                className="relative h-[92%] shrink-0 overflow-hidden rounded-[22px]"
                style={{ width: anchoSlide || "78%", marginRight: GAP_PX }}
                animate={{ scale: i === index ? 1 : 0.92, opacity: i === index ? 1 : 0.6 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src={foto}
                  alt=""
                  fill
                  draggable={false}
                  sizes="(max-width: 768px) 80vw, 40vw"
                  className="object-cover"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => irA(index - 1)}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-verde-700 opacity-0 shadow-[var(--shadow-media)] transition-opacity group-hover/carrusel:opacity-100 md:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => irA(index + 1)}
              aria-label="Foto siguiente"
              className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-verde-700 opacity-0 shadow-[var(--shadow-media)] transition-opacity group-hover/carrusel:opacity-100 md:flex"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {fotos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => irA(i)}
                  aria-label={`Ir a la foto ${i + 1}`}
                  aria-current={i === index}
                  className="flex h-11 w-6 items-center justify-center"
                >
                  <span
                    className={
                      i === index
                        ? "h-2 w-6 rounded-full bg-white transition-all"
                        : "h-2 w-2 rounded-full bg-white/50 transition-all"
                    }
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </CapaParallax>
  );
}
