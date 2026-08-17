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
  precioBase: number | null;
  precioDescuento: number | null;
  kilosDescuento: number | null;
  precioCaja: number | null;
  precioBin: number | null;
  kilosPorCaja: number | null;
  kilosPorBin: number | null;
  mostrarCaja: boolean;
  mostrarBin: boolean;
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
  // "Más detalles" acá abre lo mismo que abre en la página. Antes era un botón
  // dibujado que no hacía nada, y la ficha —donde salen la caja, el bin y el
  // descuento— no se podía revisar sin guardar y salir a mirar el sitio.
  const [verDetalle, setVerDetalle] = useState(false);
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
              {verDetalle ? (
                <VistaDetalle datos={datos} onVolver={() => setVerDetalle(false)} />
              ) : (
                <VistaCatalogo datos={datos} onVerDetalle={() => setVerDetalle(true)} />
              )}
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
function VistaCatalogo({
  datos,
  onVerDetalle,
}: {
  datos: DatosVista;
  onVerDetalle: () => void;
}) {
  // Mismo criterio que TarjetaProducto: manda el precio de lista y el
  // descuento va al lado. Si acá se desalinea, la vista previa miente.
  const precioGrande = datos.precioBase ?? datos.precioDescuento;
  // El descuento necesita las dos mitades (precio rebajado y desde cuántos
  // kilos), igual que en la página: con una sola no hay nada que mostrar.
  const hayDescuento =
    datos.precioDescuento != null && datos.precioBase != null && datos.kilosDescuento != null;

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
                Precio por {datos.unidad}
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
            {hayDescuento && (
              <div className="rounded-lg bg-limon/20 px-2.5 py-1.5 text-right">
                <p className="text-[0.6rem] font-bold tracking-[0.14em] text-verde-700 uppercase">
                  Desde {datos.kilosDescuento} {datos.unidad}
                </p>
                <p className="text-sm font-semibold text-verde-700">
                  {clp(datos.precioDescuento!)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onVerDetalle}
            className="rounded-full border border-verde-700/25 py-2.5 text-center text-sm font-semibold text-verde-700 transition-colors hover:bg-cyan-100"
          >
            Más detalles
          </button>
          <div className="rounded-full bg-verde-700 py-2.5 text-center text-sm font-semibold text-white">
            Cotizar
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Réplica de la ficha que abre "Más detalles" en la página. Las condiciones
 * son las mismas que las de DetalleProducto: el descuento pide sus dos
 * mitades, y la caja y el bin piden estar marcados y tener precio. Si acá se
 * desalinea, la vista previa miente.
 */
function VistaDetalle({ datos, onVolver }: { datos: DatosVista; onVolver: () => void }) {
  const conDescuento = datos.precioDescuento != null && datos.kilosDescuento != null;
  const conCaja = datos.mostrarCaja && datos.precioCaja != null;
  const conBin = datos.mostrarBin && datos.precioBin != null;
  const sinPrecios =
    datos.precioBase == null && datos.precioDescuento == null && !conCaja && !conBin;

  return (
    <div className="overflow-hidden rounded-[18px] border border-tinta/10 bg-white shadow-[var(--shadow-media)]">
      <div className="relative aspect-[2/1] overflow-hidden bg-cyan-100">
        {datos.imagenTextura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={datos.imagenTextura} alt="" className="h-full w-full object-cover" />
        ) : (
          <FaltaFoto texto="Falta la foto del catálogo" />
        )}
        <button
          type="button"
          onClick={onVolver}
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-verde-700 shadow-sm"
          aria-label="Volver a la tarjeta"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-titulo text-verde-700" style={{ fontSize: 22, lineHeight: 1.15 }}>
          {datos.nombre || "Nombre del producto"}
        </h3>
        {datos.descripcion && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-tinta-suave">
            {datos.descripcion}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {datos.precioBase != null && (
            <FilaDetalle
              titulo={`Precio por ${datos.unidad}`}
              monto={clp(datos.precioBase)}
              sufijo={`/${datos.unidad}`}
              destacada
            />
          )}
          {conDescuento && (
            <FilaDetalle
              titulo={`Desde ${datos.kilosDescuento} ${datos.unidad}`}
              monto={clp(datos.precioDescuento!)}
              sufijo={`/${datos.unidad}`}
              acento
            />
          )}
          {conCaja && (
            <FilaDetalle
              titulo="Por caja"
              detalle={datos.kilosPorCaja ? `${datos.kilosPorCaja} kg` : undefined}
              monto={clp(datos.precioCaja!)}
            />
          )}
          {conBin && (
            <FilaDetalle
              titulo="Por bin"
              detalle={datos.kilosPorBin ? `${datos.kilosPorBin} kg` : undefined}
              monto={clp(datos.precioBin!)}
            />
          )}
          {sinPrecios && (
            <p className="rounded-xl bg-cyan-100 p-3 text-xs text-verde-700">
              Sin ningún precio cargado, la ficha solo invita a escribir por WhatsApp.
            </p>
          )}
        </div>

        <div className="mt-4 w-full rounded-full bg-verde-700 py-2.5 text-center text-sm font-semibold text-white">
          Cotizar por WhatsApp
        </div>
      </div>
    </div>
  );
}

function FilaDetalle({
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
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
      style={{ background: acento ? "rgba(245,205,7,.18)" : "rgba(11,43,34,.035)" }}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-tinta">{titulo}</p>
        {detalle && <p className="text-[11px] text-tinta-suave">{detalle}</p>}
      </div>
      <p className="flex shrink-0 items-baseline gap-1">
        <span
          className="font-titulo text-verde-600"
          style={{
            fontSize: destacada ? 20 : 16,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {monto}
        </span>
        {sufijo && <span className="text-[10px] font-semibold text-tinta-suave">{sufijo}</span>}
      </p>
    </div>
  );
}

/** Réplica de la columna izquierda de la calculadora de la página. */
function VistaCalculadora({ datos }: { datos: DatosVista }) {
  // Sin umbral de descuento no hay cantidad "interesante" que mostrar, así
  // que la vista previa cae al kilo suelto para seguir mostrando el precio.
  const kilos = datos.kilosDescuento ?? 1;
  const precio = datos.kilosDescuento != null ? datos.precioDescuento ?? datos.precioBase : datos.precioBase ?? datos.precioDescuento;

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
