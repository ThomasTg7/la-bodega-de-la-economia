"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
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

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      registrarLenis(null);
    };
  }, []);

  return <>{children}</>;
}
