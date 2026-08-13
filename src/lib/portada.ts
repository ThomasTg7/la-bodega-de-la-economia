/**
 * Los sellos de la portada: tres frases cortas bajo los botones. El ícono de
 * cada uno es fijo por posición (camión, visto, hoja) y solo el texto se
 * edita desde el panel — así nadie puede dejar la portada con tres camiones.
 */
export const ICONOS_SELLOS = ["camion", "check", "hoja"] as const;

export const SELLOS_DEFECTO = [
  "Despacha en nuestro local",
  "Siempre precio por mayor",
  "Directo del productor",
] as const;

/**
 * Encabezado del catálogo. Mismo criterio que los sellos: si en el panel
 * dejan el campo vacío, vuelve el texto de fábrica en vez de quedar la
 * sección sin título.
 */
export const CATALOGO_DEFECTO = {
  titulo: "Siempre precio por mayor",
  // Sin dos puntos ni guiones, a propósito. Son frases seguidas, como se
  // hablaría en el mostrador.
  bajada:
    "Acá no vendemos al detalle, todo es al por mayor. Consulte por los mejores productos de la región y lleve calidad hasta su negocio.",
} as const;

/**
 * Lee el JSON de `Ajustes.portadaSellos`. Cada hueco vacío cae a su texto de
 * fábrica por separado: si alguien borra solo el del medio, los otros dos
 * siguen en pie en vez de perderse los tres.
 */
export function parsearSellos(json: string): string[] {
  let lista: unknown;
  try {
    lista = JSON.parse(json || "[]");
  } catch {
    lista = [];
  }

  return SELLOS_DEFECTO.map((defecto, i) => {
    const valor = Array.isArray(lista) ? lista[i] : undefined;
    return typeof valor === "string" && valor.trim() ? valor.trim() : defecto;
  });
}
