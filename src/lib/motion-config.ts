"use client";

import { useSyncExternalStore } from "react";

/**
 * Suscribe un componente a una media query usando useSyncExternalStore —
 * el API pensado exactamente para esto (leer y reaccionar a una fuente
 * externa mutable como matchMedia), sin setState síncrono dentro de un
 * efecto y sin desajustes de hidratación (el snapshot del servidor es
 * siempre `false`, igual que el primer render del cliente antes de que
 * React se suscriba).
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notificar) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notificar);
      return () => media.removeEventListener("change", notificar);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** true si el usuario pidió menos movimiento en su sistema. */
export function useMovimientoReducido(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** true si el dispositivo tiene mouse real (hover + puntero fino). */
export function useTieneHoverFino(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** true si el viewport es de ancho móvil (< 768px). */
export function useEsMovil(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export const RESORTE_SCROLL = { stiffness: 90, damping: 26, mass: 0.5 };
export const RESORTE_UI = { stiffness: 260, damping: 24, mass: 0.6 };

export const EASE_SALIDA = [0.16, 1, 0.3, 1] as const;
export const EASE_SUAVE = [0.65, 0, 0.35, 1] as const;
export const EASE_REBOTE = [0.34, 1.56, 0.64, 1] as const;
