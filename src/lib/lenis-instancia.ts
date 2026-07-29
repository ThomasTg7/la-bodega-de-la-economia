import type Lenis from "lenis";

/**
 * Referencia compartida a la instancia de Lenis creada por <SmoothScroll>.
 * Solo existe una instancia en toda la app (cliente), así que un módulo
 * simple alcanza — evita meter un Context solo para esto.
 */
let instancia: Lenis | null = null;

export function registrarLenis(lenis: Lenis | null) {
  instancia = lenis;
}

export function obtenerLenis() {
  return instancia;
}
