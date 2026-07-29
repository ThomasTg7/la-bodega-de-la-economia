export type NumeroWhatsApp = {
  /** Quién atiende ese número. Solo se usa en el panel. */
  nombre: string;
  numero: string;
  /** Peso relativo del reparto. 70 y 30 reparten igual que 7 y 3. */
  peso: number;
};

export function armarLinkWhatsApp(
  numero: string,
  nombre: string,
  asunto: string,
  mensaje: string
) {
  const tel = numero.replace(/\D/g, "");
  const texto =
    `¡Hola! Soy ${nombre.trim()}.\n` +
    `Asunto: ${asunto}\n\n` +
    `${mensaje.trim()}\n\n` +
    `— Enviado desde labodegadelaeconomia.cl`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}

/**
 * Deja un teléfono escrito a mano en el formato que necesita wa.me: solo
 * dígitos y con código de país. La gente escribe "9 1234 5678" o "+56 9 1234
 * 5678" indistintamente, y sin el 56 adelante el link de WhatsApp no abre.
 */
export function normalizarTelefonoChile(numero: string) {
  const digitos = numero.replace(/\D/g, "");
  if (digitos.startsWith("56")) return digitos;
  // Móvil sin código de país: 9 dígitos partiendo en 9.
  if (digitos.length === 9 && digitos.startsWith("9")) return `56${digitos}`;
  // Móvil al que además le falta el 9 inicial — lo más común al anotar rápido.
  if (digitos.length === 8) return `569${digitos}`;
  return digitos;
}

export function formatearTelefonoChile(numero: string) {
  // +56995415039 -> +56 9 9541 5039
  const limpio = numero.replace(/\D/g, "");
  const match = limpio.match(/^56(9)(\d{4})(\d{4})$/);
  if (!match) return numero;
  return `+56 ${match[1]} ${match[2]} ${match[3]}`;
}

/**
 * Lee el JSON guardado en Ajustes.numerosWhatsapp. Si viene vacío o roto,
 * cae al número único de siempre para que la burbuja nunca quede sin destino.
 */
export function parsearNumerosWhatsapp(json: string, respaldo: string): NumeroWhatsApp[] {
  let lista: unknown;
  try {
    lista = JSON.parse(json || "[]");
  } catch {
    lista = [];
  }

  const numeros = Array.isArray(lista)
    ? lista
        .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({
          nombre: typeof x.nombre === "string" ? x.nombre : "",
          numero: typeof x.numero === "string" ? x.numero : "",
          peso: typeof x.peso === "number" && Number.isFinite(x.peso) ? Math.max(0, x.peso) : 0,
        }))
        .filter((x) => x.numero.replace(/\D/g, "").length >= 8)
    : [];

  if (numeros.length > 0) return numeros;
  return respaldo ? [{ nombre: "", numero: respaldo, peso: 1 }] : [];
}

/** Porcentaje real que le toca a cada número, ya normalizado. */
export function repartoEnPorcentaje(numeros: NumeroWhatsApp[]): number[] {
  const total = numeros.reduce((suma, n) => suma + n.peso, 0);
  // Todos en cero (o uno solo) se reparten en partes iguales: es lo que
  // espera alguien que agregó números y todavía no tocó los pesos.
  if (total <= 0) return numeros.map(() => (numeros.length ? 100 / numeros.length : 0));
  return numeros.map((n) => (n.peso / total) * 100);
}

/**
 * Elige un número al azar respetando los pesos. `azar` es inyectable para
 * poder probar el reparto sin depender de Math.random.
 */
export function elegirNumeroPonderado(
  numeros: NumeroWhatsApp[],
  azar: () => number = Math.random
): NumeroWhatsApp | null {
  if (numeros.length === 0) return null;
  if (numeros.length === 1) return numeros[0];

  const total = numeros.reduce((suma, n) => suma + n.peso, 0);
  if (total <= 0) return numeros[Math.floor(azar() * numeros.length)] ?? numeros[0];

  let punto = azar() * total;
  for (const n of numeros) {
    punto -= n.peso;
    if (punto < 0) return n;
  }
  return numeros[numeros.length - 1];
}
