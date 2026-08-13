"use client";

import { createContext, useCallback, useContext } from "react";
import { armarLinkWhatsApp, elegirNumeroPonderado, type NumeroWhatsApp } from "@/lib/whatsapp";

export type PrellenadoWhatsApp = {
  asunto?: string;
  mensaje?: string;
};

type ContextoBurbuja = {
  /** Abre WhatsApp con el mensaje ya escrito, si viene alguno. */
  abrir: (prellenado?: PrellenadoWhatsApp) => void;
};

const Contexto = createContext<ContextoBurbuja | null>(null);

const CLAVE_DESTINO = "bodega_whatsapp_destino";

/**
 * Elige a quién le llega este mensaje respetando los pesos del reparto, y
 * lo deja fijo por lo que dure la pestaña: si alguien escribe dos veces en
 * la misma visita, le sigue contestando la misma persona.
 */
function elegirDestino(numeros: NumeroWhatsApp[]): string {
  if (numeros.length === 0) return "";
  if (numeros.length === 1) return numeros[0].numero;

  try {
    const guardado = sessionStorage.getItem(CLAVE_DESTINO);
    if (guardado && numeros.some((n) => n.numero === guardado)) return guardado;
  } catch {
    // sessionStorage bloqueado (modo privado en algunos navegadores): se
    // sortea igual, solo se pierde la continuidad entre envíos.
  }

  const elegido = elegirNumeroPonderado(numeros)?.numero ?? numeros[0].numero;
  try {
    sessionStorage.setItem(CLAVE_DESTINO, elegido);
  } catch {
    /* ídem */
  }
  return elegido;
}

/**
 * Da un solo `abrir()` a todos los botones de WhatsApp del sitio — el del
 * hero, el "Cotizar" de cada producto, el "Encargar" de la calculadora y el
 * botón flotante. Todos saltan derecho a WhatsApp: antes había un panel con
 * formulario en medio, que solo agregaba un paso para pedir un nombre que la
 * conversación de WhatsApp ya trae.
 *
 * El `window.open` corre dentro del click, sin await ni timeout de por medio:
 * Safari en iOS bloquea como popup cualquier ventana que se abra fuera del
 * gesto que la originó.
 */
export function ProveedorBurbujaWhatsApp({
  numeros,
  children,
}: {
  numeros: NumeroWhatsApp[];
  children: React.ReactNode;
}) {
  const abrir = useCallback(
    (datos?: PrellenadoWhatsApp) => {
      const destino = elegirDestino(numeros);
      if (!destino) return;
      const url = armarLinkWhatsApp(destino, datos?.asunto, datos?.mensaje);
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [numeros]
  );

  return <Contexto.Provider value={{ abrir }}>{children}</Contexto.Provider>;
}

export function useBurbujaWhatsApp() {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useBurbujaWhatsApp debe usarse dentro de <ProveedorBurbujaWhatsApp>");
  }
  return ctx;
}
