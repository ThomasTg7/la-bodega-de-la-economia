"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { motion, useInView } from "motion/react";
import NumeroEscrito from "@/components/motion/NumeroEscrito";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { clp } from "@/lib/precios";
import { EASE_SALIDA } from "@/lib/motion-config";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";

type Props = {
  producto: Producto;
  indice: number;
};

// Los slugs no calzan uno a uno con los nombres de archivo (palta-hass ->
// paltas.webp), así que el mapa es explícito en vez de interpolado.
const TEXTURA_POR_SLUG: Record<string, string> = {
  "palta-hass": "/texturas/paltas.webp",
  limon: "/texturas/limones.webp",
  naranja: "/texturas/naranjas.webp",
};

const BLUR_POR_SLUG: Record<string, string> = {
  "palta-hass": BLUR_TEXTURAS.paltas,
  limon: BLUR_TEXTURAS.limones,
  naranja: BLUR_TEXTURAS.naranjas,
};

export default function TarjetaProducto({ producto, indice }: Props) {
  const { abrir } = useBurbujaWhatsApp();
  const precioRef = useRef<HTMLDivElement>(null);
  const precioEnVista = useInView(precioRef, { once: true, amount: 0.4 });

  const foto =
    producto.imagenTextura || TEXTURA_POR_SLUG[producto.slug] || "/texturas/paltas.webp";
  const blur = BLUR_POR_SLUG[producto.slug] ?? BLUR_TEXTURAS.paltas;
  const precioGrande = producto.precioMayorista ?? producto.precioDetalle;
  const hayDosPrecios = producto.precioMayorista != null && producto.precioDetalle != null;

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
              className="mt-auto flex items-end justify-between gap-4 border-t border-dashed border-tinta/20 pt-5"
            >
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.14em] text-verde-500 uppercase">
                  Por mayor · {producto.umbralMayorista}+ {producto.unidad}
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
              </div>

              {hayDosPrecios && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={precioEnVista ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE_SALIDA, delay: 0.5 }}
                  className="text-right"
                >
                  <p className="text-[0.65rem] font-bold tracking-[0.14em] text-tinta-suave uppercase">
                    Detalle
                  </p>
                  <p className="font-semibold text-tinta" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {clp(producto.precioDetalle!)}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          <motion.button
            type="button"
            onClick={() =>
              abrir({
                asunto: "Cotización",
                mensaje: `Quiero cotizar ${producto.nombre}. Necesito ___ ${producto.unidad}.`,
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
