"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type PrellenadoWhatsApp = {
  asunto?: string;
  mensaje?: string;
};

type ContextoBurbuja = {
  abierta: boolean;
  prellenado: PrellenadoWhatsApp;
  abrir: (prellenado?: PrellenadoWhatsApp) => void;
  cerrar: () => void;
};

const Contexto = createContext<ContextoBurbuja | null>(null);

/**
 * Comparte el estado de la burbuja de WhatsApp entre el botón del hero, el
 * botón "Encargar" de la calculadora, el nav y el panel flotante en sí —
 * todos son hermanos bajo <PaginaPrincipal>, así que un context evita
 * pasar callbacks por props a través de todo el árbol.
 */
export function ProveedorBurbujaWhatsApp({ children }: { children: React.ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  const [prellenado, setPrellenado] = useState<PrellenadoWhatsApp>({});

  const abrir = useCallback((datos?: PrellenadoWhatsApp) => {
    setPrellenado(datos ?? {});
    setAbierta(true);
  }, []);

  const cerrar = useCallback(() => setAbierta(false), []);

  return (
    <Contexto.Provider value={{ abierta, prellenado, abrir, cerrar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useBurbujaWhatsApp() {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useBurbujaWhatsApp debe usarse dentro de <ProveedorBurbujaWhatsApp>");
  }
  return ctx;
}
