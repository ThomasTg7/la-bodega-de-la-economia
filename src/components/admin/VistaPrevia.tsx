"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ObjetoFlotante from "@/components/motion/ObjetoFlotante";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { clp } from "@/lib/precios";
import { Icono } from "./Iconos";

export type DatosVista = {
  nombre: string;
  descripcion: string;
  unidad: string;
  precioDetalle: number | null;
  precioMayorista: number | null;
  umbralMayorista: number;
  imagenTextura: string;
  imagenRecorte: string;
  colorAcento: string;
  destacado: boolean;
};

const PESTANAS = [
  { id: "catalogo", label: "Catálogo", icono: "imagen" },
  { id: "calculadora", label: "Calculadora", icono: "calculadora" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

/**
 * Muestra el producto tal como sale en la página, en las dos partes donde
 * aparece — y cada una usa una foto distinta:
 *   Catálogo    -> imagenTextura (varias frutas juntas, llena la tarjeta)
 *   Calculadora -> imagenRecorte (una sola fruta, fondo transparente)
 */
export default function VistaPrevia({ datos }: { datos: DatosVista }) {
  const [pestana, setPestana] = useState<Pestana>("catalogo");
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-tinta">Vista previa</p>
        <div className="flex rounded-full bg-tinta/[0.06] p-1">
          {PESTANAS.map((p) => {
            const activa = pestana === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPestana(p.id)}
                className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ color: activa ? "var(--color-verde-700)" : "var(--color-tinta-suave)" }}
              >
                {activa && (
                  <motion.span
                    layoutId="pastilla-vista-previa"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-suave)]"
                    transition={resorte}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icono nombre={p.icono} tam={13} />
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-3">
        <AnimatePresence mode="wait">
          {pestana === "catalogo" ? (
            <motion.div
              key="catalogo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_SALIDA }}
            >
              <VistaCatalogo datos={datos} />
            </motion.div>
          ) : (
            <motion.div
              key="calculadora"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_SALIDA }}
            >
              <VistaCalculadora datos={datos} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Réplica de la tarjeta del catálogo de la página. */
function VistaCatalogo({ datos }: { datos: DatosVista }) {
  const precioGrande = datos.precioMayorista ?? datos.precioDetalle;
  const hayDosPrecios = datos.precioMayorista != null && datos.precioDetalle != null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-tinta/10 bg-white shadow-[var(--shadow-media)]">
      <div className="relative aspect-[16/11] overflow-hidden bg-cyan-100">
        {datos.imagenTextura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={datos.imagenTextura} alt="" className="h-full w-full object-cover" />
        ) : (
          <FaltaFoto texto="Falta la foto del catálogo" />
        )}
        {datos.destacado && (
          <span className="absolute top-3 left-3 rounded bg-verde-700 px-2 py-1 text-[0.6rem] font-bold tracking-[0.14em] text-white uppercase">
            Más pedido
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-titulo text-verde-700" style={{ fontSize: 22, lineHeight: 1.15 }}>
          {datos.nombre || "Nombre del producto"}
        </h3>
        {datos.descripcion && (
          <p className="mt-1.5 line-clamp-2 text-[12px] text-tinta-suave">{datos.descripcion}</p>
        )}

        {precioGrande != null && (
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-tinta/20 pt-4">
            <div>
              <p className="text-[0.6rem] font-bold tracking-[0.14em] text-verde-500 uppercase">
                Por mayor · {datos.umbralMayorista}+ {datos.unidad}
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span
                  className="font-titulo text-verde-600"
                  style={{ fontSize: 30, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
                >
                  {clp(precioGrande)}
                </span>
                <span className="text-xs font-semibold text-tinta-suave">/{datos.unidad}</span>
              </p>
            </div>
            {hayDosPrecios && (
              <div className="text-right">
                <p className="text-[0.6rem] font-bold tracking-[0.14em] text-tinta-suave uppercase">
                  Detalle
                </p>
                <p className="text-sm font-semibold text-tinta">{clp(datos.precioDetalle!)}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 w-full rounded-full bg-verde-700 py-2.5 text-center text-sm font-semibold text-white">
          Cotizar
        </div>
      </div>
    </div>
  );
}

/** Réplica de la columna izquierda de la calculadora de la página. */
function VistaCalculadora({ datos }: { datos: DatosVista }) {
  const kilos = datos.umbralMayorista;
  const precio = datos.precioMayorista ?? datos.precioDetalle;

  return (
    <div className="overflow-hidden rounded-[18px] border border-tinta/10 bg-white p-5 shadow-[var(--shadow-media)]">
      <div className="relative flex h-[190px] items-center justify-center">
        <motion.div
          aria-hidden="true"
          className="absolute rounded-full"
          animate={{ backgroundColor: datos.colorAcento }}
          transition={{ duration: 0.6 }}
          style={{ width: 190, height: 190, filter: "blur(46px)", opacity: 0.28 }}
        />
        {datos.imagenRecorte ? (
          <ObjetoFlotante indice={0}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={datos.imagenRecorte}
              alt=""
              className="w-auto select-none"
              style={{ height: 150, filter: "var(--shadow-recorte)" }}
            />
          </ObjetoFlotante>
        ) : (
          <div className="relative h-full w-full">
            <FaltaFoto texto="Falta la foto de la calculadora" />
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-cyan-100/70 p-4 text-center">
        <p className="text-xs font-semibold text-tinta-suave">
          {kilos} {datos.unidad} · {datos.nombre || "Producto"}
        </p>
        <p
          className="mt-1 font-titulo text-verde-700"
          style={{ fontSize: 28, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}
        >
          {precio != null ? clp(precio * kilos) : "—"}
        </p>
        <p className="mt-1 text-[11px] text-tinta-suave">
          {precio != null ? `${clp(precio)} por ${datos.unidad}` : "Falta poner un precio"}
        </p>
      </div>
    </div>
  );
}

function FaltaFoto({ texto }: { texto: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-tinta-suave">
      <Icono nombre="imagen" tam={22} />
      <span className="px-4 text-center text-xs font-medium">{texto}</span>
    </div>
  );
}
