"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { registrarLenis } from "@/lib/lenis-instancia";

/**
 * Envuelve la app y activa scroll suave con inercia (Lenis).
 * Se desactiva por completo si el usuario pide menos movimiento, o en
 * pantallas táctiles (en táctil dejamos el scroll nativo: se siente mejor
 * y no rompe el pull-to-refresh).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefiereMenosMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefiereMenosMovimiento) return;

    // Import dinamico: Lenis solo se usa dentro de este efecto, asi que no
    // tiene por que viajar en el JS que se descarga antes de pintar la
    // pagina. `cancelado` cubre el caso de un unmount tan rapido que la
    // instancia terminaria de crearse despues de que el efecto ya se limpio.
    let cancelado = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelado) return;
      const lenis = new Lenis({
        lerp: 0.085,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: true,
        anchors: true,
      });
      lenisRef.current = lenis;
      registrarLenis(lenis);
    });

    return () => {
      cancelado = true;
      lenisRef.current?.destroy();
      lenisRef.current = null;
      registrarLenis(null);
    };
  }, []);

  return <>{children}</>;
}
