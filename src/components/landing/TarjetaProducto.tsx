"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { AnimatePresence, motion, useInView } from "motion/react";
import NumeroEscrito from "@/components/motion/NumeroEscrito";
import DetalleProducto from "./DetalleProducto";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { clp } from "@/lib/precios";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";
import { texturaDe } from "@/lib/texturas-producto";

type Props = {
  producto: Producto;
  indice: number;
  /** Kilos minimos por pedido, del campo del panel. Va en el mensaje de
   *  WhatsApp para que nadie pida menos de lo que se puede despachar. */
  pedidoMinimo: number;
};

const BLUR_POR_SLUG: Record<string, string> = {
  "palta-hass": BLUR_TEXTURAS.paltas,
  limon: BLUR_TEXTURAS.limones,
  naranja: BLUR_TEXTURAS.naranjas,
  mandarina: BLUR_TEXTURAS.mandarinas,
};

export default function TarjetaProducto({ producto, indice, pedidoMinimo }: Props) {
  const { abrir } = useBurbujaWhatsApp();
  const precioRef = useRef<HTMLDivElement>(null);
  const precioEnVista = useInView(precioRef, { once: true, amount: 0.4 });
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  // La página de atrás no se mueve mientras el detalle está abierto, y vuelve
  // a moverse apenas se cierra — sin esperar a que termine la animación.
  useEffect(() => {
    if (!detalleAbierto) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [detalleAbierto]);

  function cotizar() {
    abrir({
      asunto: "Cotización",
      mensaje: `Quiero cotizar ${producto.nombre}. Necesito ___ ${producto.unidad} (el pedido mínimo es de ${pedidoMinimo} kg).`,
    });
  }

  const foto = texturaDe(producto);
  const blur = BLUR_POR_SLUG[producto.slug] ?? BLUR_TEXTURAS.paltas;
  // La tarjeta muestra un solo numero, el precio de lista. El descuento por
  // volumen y los formatos (caja, bin) se conversan por WhatsApp, que es
  // donde igual se cierra el pedido.
  const precioGrande = producto.precioBase ?? producto.precioDescuento;

  return (
    <SeccionEntrada delay={indice * 0.1} className="h-full">
      <motion.article
        whileHover={{ y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-tinta/10 bg-white shadow-[var(--shadow-suave)] hover:shadow-[var(--shadow-flotante)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/11]">
          <Image
            src={foto}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={blur}
            className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.09]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: "linear-gradient(to top, rgba(1,69,43,.35), transparent 55%)" }}
          />
          {producto.destacado && (
            <span className="absolute top-2 left-2 rounded bg-verde-700 px-2 py-0.5 text-[0.6rem] font-bold tracking-[0.1em] text-white uppercase sm:top-4 sm:left-4 sm:px-2.5 sm:py-1 sm:text-[0.7rem] sm:tracking-[0.14em]">
              Más pedido
            </span>
          )}

          {/* Logo en la esquina de arriba a la derecha: la de la izquierda ya
              la ocupa el sello de "Más pedido". Va sobre un disco blanco
              porque la foto de fruta debajo cambia de color en cada tarjeta y
              el logo solo no siempre se recorta contra ella.

              `alt=""` y aria-hidden: es la marca del propio sitio repetida en
              cada tarjeta, no un dato del producto. Un lector de pantalla
              leyendo "La bodega de la economía" tres veces seguidas antes de
              cada precio solo estorba. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,.18)] backdrop-blur-[2px] sm:top-3 sm:right-3 sm:h-12 sm:w-12 md:h-14 md:w-14"
          >
            <Image
              src="/logo.webp"
              alt=""
              width={56}
              height={56}
              className="h-6 w-6 object-contain sm:h-9 sm:w-9 md:h-11 md:w-11"
            />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-6">
          {/* Los tamaños van en clamp y no fijos: la misma tarjeta mide media
              pantalla en un teléfono y un tercio en un monitor. */}
          <h3
            className="font-titulo text-verde-700"
            style={{ fontSize: "clamp(19px, 5vw, 26px)", lineHeight: 1.15 }}
          >
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="mt-1.5 line-clamp-2 text-[13px] text-tinta-suave">
              {producto.descripcion}
            </p>
          )}

          {precioGrande != null && (
            <div
              ref={precioRef}
              className="mt-auto border-t border-dashed border-tinta/20 pt-4 sm:pt-5"
            >
              <p className="text-[0.6rem] font-bold tracking-[0.14em] text-verde-500 uppercase sm:text-[0.65rem]">
                Precio por {producto.unidad}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <NumeroEscrito
                  texto={clp(precioGrande)}
                  activo={precioEnVista}
                  velocidad={70}
                  className="font-titulo text-verde-600"
                  style={{
                    fontSize: "clamp(23px, 6.4vw, 36px)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span className="text-xs font-semibold text-tinta-suave sm:text-sm">
                  /{producto.unidad}
                </span>
              </p>
              <p className="mt-2 hidden text-[13px] text-tinta-suave sm:block">
                Precio hasta agotar stock. Puede variar según el calibre y la calidad de cada
                partida.
              </p>
            </div>
          )}

          {/* Dos salidas y no una: "Más detalles" para quien todavía compara
              precios y formatos, "Cotizar" para quien ya decidió. */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-2.5">
            <motion.button
              type="button"
              onClick={() => setDetalleAbierto(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border border-verde-700/25 py-3 text-sm font-semibold text-verde-700 transition-colors hover:bg-cyan-100 sm:py-3.5 sm:text-base"
            >
              Más detalles
            </motion.button>
            <motion.button
              type="button"
              onClick={cotizar}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-verde-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-verde-500 sm:py-3.5 sm:text-base"
            >
              Cotizar
            </motion.button>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {detalleAbierto && (
          <motion.div
            key="detalle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          >
            <DetalleProducto
              producto={producto}
              pedidoMinimo={pedidoMinimo}
              onCerrar={() => setDetalleAbierto(false)}
              onCotizar={() => {
                setDetalleAbierto(false);
                cotizar();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </SeccionEntrada>
  );
}
