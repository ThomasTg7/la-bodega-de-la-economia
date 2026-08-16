"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { motion } from "motion/react";
import { EASE_SALIDA, useMovimientoReducido } from "@/lib/motion-config";
import { clp, hayDescuento } from "@/lib/precios";
import { texturaDe } from "@/lib/texturas-producto";

type Props = {
  producto: Producto;
  pedidoMinimo: number;
  onCerrar: () => void;
  onCotizar: () => void;
};

/**
 * Ficha completa del producto, la que abre "Más detalles" en la tarjeta.
 *
 * La tarjeta del catálogo muestra un solo número para que la grilla se lea de
 * un vistazo; acá cabe todo lo que ese resumen deja fuera: la foto grande, la
 * descripción entera, el descuento por volumen y los formatos caja y bin que
 * estén marcados en el panel.
 */
export default function DetalleProducto({ producto, pedidoMinimo, onCerrar, onCotizar }: Props) {
  const reducido = useMovimientoReducido();
  const panel = useRef<HTMLDivElement>(null);

  // Escape cierra y el foco entra al panel: el diálogo se abre sobre una
  // página larga, y sin mover el foco el teclado seguiría navegando el
  // catálogo de atrás. El bloqueo del scroll no vive acá sino en la tarjeta,
  // atado al estado de abierto: si viviera acá se soltaría recién cuando la
  // animación de salida termine de desmontar, y hasta entonces la página
  // quedaría trabada.
  useEffect(() => {
    function escuchar(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", escuchar);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", escuchar);
  }, [onCerrar]);

  const conDescuento = hayDescuento(producto);
  const conCaja = producto.mostrarCaja && producto.precioCaja != null;
  const conBin = producto.mostrarBin && producto.precioBin != null;
  const sinPrecios =
    producto.precioBase == null && producto.precioDescuento == null && !conCaja && !conBin;

  return (
    // Sin envoltorio propio: la capa fija y su animacion de entrada/salida las
    // pone quien abre el dialogo, porque ese motion.div tiene que ser el hijo
    // directo de <AnimatePresence> para que el cierre desmonte de verdad.
    <>
      <div
        aria-hidden="true"
        onClick={onCerrar}
        className="absolute inset-0"
        style={{ background: "rgba(1,69,43,.45)", backdropFilter: "blur(3px)" }}
      />

      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${producto.nombre}`}
        tabIndex={-1}
        initial={reducido ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_SALIDA }}
        className="relative flex max-h-[96svh] min-h-[70svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[22px] bg-white shadow-[var(--shadow-flotante)] outline-none sm:max-h-[92svh] sm:min-h-0 sm:rounded-[22px]"
      >
        <div className="relative aspect-[2/1] shrink-0 sm:aspect-[16/10]">
          <Image
            src={texturaDe(producto)}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-verde-700 shadow-[0_4px_14px_rgba(0,0,0,.18)]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          {producto.destacado && (
            <span className="absolute top-4 left-4 rounded bg-verde-700 px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.14em] text-white uppercase">
              Más pedido
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <h2 className="font-titulo text-verde-700" style={{ fontSize: 28, lineHeight: 1.12 }}>
            {producto.nombre}
          </h2>
          {producto.descripcion && (
            <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">
              {producto.descripcion}
            </p>
          )}

          <div className="mt-5 space-y-2.5">
            {producto.precioBase != null && (
              <FilaPrecio
                titulo={`Precio por ${producto.unidad}`}
                detalle="El de siempre, lleve lo que lleve."
                monto={clp(producto.precioBase)}
                sufijo={`/${producto.unidad}`}
                destacada
              />
            )}

            {conDescuento && (
              <FilaPrecio
                titulo={`Desde ${producto.kilosDescuento} ${producto.unidad}`}
                detalle="Precio con descuento por volumen."
                monto={clp(producto.precioDescuento!)}
                sufijo={`/${producto.unidad}`}
                acento
              />
            )}

            {conCaja && (
              <FilaPrecio
                titulo="Por caja"
                detalle={
                  producto.kilosPorCaja ? `La caja trae ${producto.kilosPorCaja} kg.` : undefined
                }
                monto={clp(producto.precioCaja!)}
              />
            )}

            {conBin && (
              <FilaPrecio
                titulo="Por bin"
                detalle={producto.kilosPorBin ? `El bin trae ${producto.kilosPorBin} kg.` : undefined}
                monto={clp(producto.precioBin!)}
              />
            )}

            {sinPrecios && (
              <p className="rounded-xl bg-cyan-100 p-4 text-sm text-verde-700">
                Este producto se cotiza según la partida del día. Escríbanos y le pasamos el
                precio.
              </p>
            )}
          </div>

          <p className="mt-4 text-[13px] text-tinta-suave">
            Precio hasta agotar stock. Puede variar según el calibre y la calidad de cada
            partida. El pedido más chico que despachamos es de {pedidoMinimo} kg.
          </p>
        </div>

        <div className="shrink-0 border-t border-tinta/10 bg-white p-4">
          <motion.button
            type="button"
            onClick={onCotizar}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-full bg-verde-700 py-3.5 font-semibold text-white transition-colors hover:bg-verde-500"
          >
            Cotizar por WhatsApp
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function FilaPrecio({
  titulo,
  detalle,
  monto,
  sufijo,
  destacada,
  acento,
}: {
  titulo: string;
  detalle?: string;
  monto: string;
  sufijo?: string;
  destacada?: boolean;
  acento?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
      style={{
        background: acento ? "rgba(245,205,7,.18)" : "rgba(11,43,34,.035)",
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-tinta">{titulo}</p>
        {detalle && <p className="text-xs text-tinta-suave">{detalle}</p>}
      </div>
      <p className="flex shrink-0 items-baseline gap-1">
        <span
          className="font-titulo text-verde-600"
          style={{
            fontSize: destacada ? 26 : 20,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {monto}
        </span>
        {sufijo && <span className="text-xs font-semibold text-tinta-suave">{sufijo}</span>}
      </p>
    </div>
  );
}
