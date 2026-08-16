"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { motion, useInView } from "motion/react";
import NumeroEscrito from "@/components/motion/NumeroEscrito";
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
        <div className="relative aspect-[16/11] overflow-hidden">
          <Image
            src={foto}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
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
            <span className="absolute top-4 left-4 rounded bg-verde-700 px-2.5 py-1 text-[0.7rem] font-bold tracking-[0.14em] text-white uppercase">
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
            className="pointer-events-none absolute top-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,.18)] backdrop-blur-[2px] md:h-14 md:w-14"
          >
            <Image
              src="/logo.webp"
              alt=""
              width={56}
              height={56}
              className="h-9 w-9 object-contain md:h-11 md:w-11"
            />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-titulo text-verde-700" style={{ fontSize: 26, lineHeight: 1.15 }}>
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
              className="mt-auto border-t border-dashed border-tinta/20 pt-5"
            >
              <p className="text-[0.65rem] font-bold tracking-[0.14em] text-verde-500 uppercase">
                Precio por {producto.unidad}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <NumeroEscrito
                  texto={clp(precioGrande)}
                  activo={precioEnVista}
                  velocidad={70}
                  className="font-titulo text-verde-600"
                  style={{
                    fontSize: 36,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span className="text-sm font-semibold text-tinta-suave">
                  /{producto.unidad}
                </span>
              </p>
              <p className="mt-2 text-[13px] text-tinta-suave">
                Precio hasta agotar stock. Puede variar según el calibre y la calidad de cada
                partida.
              </p>
            </div>
          )}

          <motion.button
            type="button"
            onClick={() =>
              abrir({
                asunto: "Cotización",
                mensaje: `Quiero cotizar ${producto.nombre}. Necesito ___ ${producto.unidad} (el pedido mínimo es de ${pedidoMinimo} kg).`,
              })
            }
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-5 w-full rounded-full bg-verde-700 py-3.5 font-semibold text-white transition-colors hover:bg-verde-500"
          >
            Cotizar
          </motion.button>
        </div>
      </motion.article>
    </SeccionEntrada>
  );
}
