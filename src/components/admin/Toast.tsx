"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { Icono } from "./Iconos";

type Tipo = "exito" | "error" | "info";
type ToastItem = { id: number; mensaje: string; tipo: Tipo };

type ContextoToast = {
  mostrar: (mensaje: string, tipo?: Tipo) => void;
};

const Contexto = createContext<ContextoToast | null>(null);

const DURACION_MS = 3600;

/**
 * Vidrio esmerilado teñido, no relleno sólido: un aviso no es un botón y no
 * debería invitar a hacerle clic. El color solo aparece en el borde, el
 * icono y la línea de tiempo de abajo.
 */
const ESTILOS: Record<Tipo, { acento: string; fondo: string; borde: string; icono: string }> = {
  exito: {
    acento: "#076244",
    fondo: "rgba(233, 247, 242, 0.72)",
    borde: "rgba(7, 98, 68, 0.26)",
    icono: "visto",
  },
  error: {
    acento: "#C24E00",
    fondo: "rgba(254, 241, 232, 0.72)",
    borde: "rgba(194, 78, 0, 0.26)",
    icono: "alerta",
  },
  info: {
    acento: "#146B5E",
    fondo: "rgba(240, 248, 246, 0.72)",
    borde: "rgba(11, 43, 34, 0.16)",
    icono: "chat",
  },
};

let siguienteId = 1;

export function ProveedorToast({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: Tipo = "info") => {
    const id = siguienteId++;
    setItems((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, DURACION_MS);
  }, []);

  const descartar = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Contexto.Provider value={{ mostrar }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 md:items-end md:px-0"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <Aviso key={item.id} item={item} onDescartar={() => descartar(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </Contexto.Provider>
  );
}

function Aviso({ item, onDescartar }: { item: ToastItem; onDescartar: () => void }) {
  const reducido = useMovimientoReducido();
  const estilo = ESTILOS[item.tipo];

  return (
    <motion.div
      layout={!reducido}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2, ease: EASE_SALIDA } }}
      transition={reducido ? { duration: 0 } : { type: "spring", ...RESORTE_UI }}
      onClick={onDescartar}
      className="pointer-events-auto relative w-fit max-w-[min(360px,90vw)] cursor-default overflow-hidden rounded-2xl"
      style={{
        background: estilo.fondo,
        border: `1px solid ${estilo.borde}`,
        backdropFilter: "blur(16px) saturate(1.4)",
        WebkitBackdropFilter: "blur(16px) saturate(1.4)",
        boxShadow: "0 8px 28px rgba(11, 43, 34, 0.10)",
      }}
    >
      <div className="flex items-start gap-2.5 px-4 py-3">
        <span className="mt-px shrink-0" style={{ color: estilo.acento }}>
          <Icono nombre={estilo.icono} tam={16} />
        </span>
        <p className="text-sm font-medium text-tinta">{item.mensaje}</p>
      </div>

      {/* Línea de tiempo: dice cuánto le queda sin parecer una acción. */}
      {!reducido && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left"
          style={{ background: estilo.acento, opacity: 0.45 }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: DURACION_MS / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

export function useToast() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ProveedorToast>");
  return ctx;
}
