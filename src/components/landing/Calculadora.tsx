"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import ObjetoFlotante from "@/components/motion/ObjetoFlotante";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { calcular, clp } from "@/lib/precios";
import {
  DIMENSIONES_RECORTE,
  DIMENSION_RECORTE_DEFECTO,
  PEDIDO_MINIMO_KG,
} from "@/lib/constantes";
import { EASE_REBOTE } from "@/lib/motion-config";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";

type Props = { productos: Producto[] };

export default function Calculadora({ productos }: Props) {
  const disponibles = useMemo(() => productos.filter((p) => p.activo), [productos]);
  const [slugActivo, setSlugActivo] = useState(disponibles[0]?.slug ?? "");
  // La calculadora parte en el pedido mas chico que se acepta: mostrar 10 kg
  // cuando el minimo son 100 solo llevaba a que alguien armara un pedido que
  // despues no se le puede tomar.
  const [kilos, setKilos] = useState(PEDIDO_MINIMO_KG);
  const [textoKilos, setTextoKilos] = useState(String(PEDIDO_MINIMO_KG));
  const { abrir } = useBurbujaWhatsApp();

  const producto = disponibles.find((p) => p.slug === slugActivo) ?? disponibles[0] ?? null;
  const resultado = producto
    ? calcular(
        {
          precioBase: producto.precioBase,
          precioDescuento: producto.precioDescuento,
          kilosDescuento: producto.kilosDescuento,
        },
        kilos
      )
    : null;

  // Total animado: cuenta hacia el nuevo valor en vez de saltar de golpe.
  const totalObjetivo = useMotionValue(resultado?.total ?? 0);
  const totalSuave = useSpring(totalObjetivo, { duration: 0.4, bounce: 0.15 });
  const [totalTexto, setTotalTexto] = useState(() => clp(resultado?.total ?? 0));
  useEffect(() => {
    totalObjetivo.set(resultado?.total ?? 0);
  }, [resultado?.total, totalObjetivo]);
  useMotionValueEvent(totalSuave, "change", (v) => setTotalTexto(clp(Math.round(v))));

  if (!producto || !resultado) {
    return null;
  }

  const dim = DIMENSIONES_RECORTE[producto.slug] ?? DIMENSION_RECORTE_DEFECTO;
  // El recorrido arranca en el minimo y llega al triple, con el umbral del
  // descuento siempre dentro de la pista aunque este cargado mas alto.
  const topeSlider = Math.max(PEDIDO_MINIMO_KG * 3, producto.kilosDescuento * 2);
  const enPista = (n: number) =>
    ((Math.min(topeSlider, Math.max(PEDIDO_MINIMO_KG, n)) - PEDIDO_MINIMO_KG) /
      (topeSlider - PEDIDO_MINIMO_KG)) *
    100;
  const valorSlider = Math.min(topeSlider, Math.max(PEDIDO_MINIMO_KG, kilos));
  // Solo se llega acá escribiendo a mano en el campo: el slider no baja del
  // mínimo.
  const bajoElMinimo = kilos < PEDIDO_MINIMO_KG;
  const porcentaje = enPista(kilos);
  const porcentajeUmbral = enPista(producto.kilosDescuento);

  const fondoPista = resultado.usaDescuento
    ? `linear-gradient(to right, var(--color-limon) 0%, var(--color-limon) ${porcentaje}%, #e2e8f0 ${porcentaje}%, #e2e8f0 100%)`
    : `linear-gradient(to right, var(--color-verde-600) 0%, var(--color-cyan-400) ${porcentaje}%, #e2e8f0 ${porcentaje}%, #e2e8f0 100%)`;

  function actualizarKilos(nuevo: number) {
    const limpio = Math.max(0, Math.min(9999, Math.round(nuevo)));
    setKilos(limpio);
    setTextoKilos(String(limpio));
  }

  function manejarEncargo() {
    if (!producto || !resultado || kilos < PEDIDO_MINIMO_KG) return;
    abrir({
      asunto: "Compra",
      mensaje: `Quiero encargar ${kilos} kg de ${producto.nombre}. Según su calculadora serían ${clp(
        resultado.total
      )}${resultado.usaDescuento ? " con el descuento por volumen" : ""}. ¿Me confirman disponibilidad?`,
    });
  }

  return (
    <section
      id="calculadora"
      className="relative overflow-hidden px-6 py-[72px] md:px-10"
      style={{ background: "linear-gradient(120deg, #E6FAF5, #FFFFFF)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(48,207,178,.08) 50%, transparent 60%)",
        }}
      />

      <SeccionEntrada className="relative mx-auto max-w-2xl text-center">
        <h2
          className="font-titulo text-verde-700"
          style={{ fontSize: "var(--text-h2)", lineHeight: 1.05 }}
        >
          <TextoRevelado texto="Calcula lo que te llevas" modo="palabra" as="span" />
        </h2>
        <p className="mt-3 text-tinta-suave" style={{ fontSize: "var(--text-cuerpo)" }}>
          Elige la fruta, mueve los kilos y mira el precio. Al pasar los kilos marcados,
          el descuento por volumen se aplica solo.
        </p>
      </SeccionEntrada>

      <div className="relative mx-auto mt-12 grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[0.42fr_0.58fr] md:gap-8">
        {/* Columna izquierda: la fruta */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-[180px] items-center justify-center md:h-[260px]">
            <motion.div
              aria-hidden="true"
              className="absolute rounded-full"
              animate={{ backgroundColor: producto.colorAcento }}
              transition={{ duration: 0.6 }}
              style={{
                width: 260,
                height: 260,
                filter: "blur(50px)",
                opacity: 0.25,
              }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={producto.slug}
                initial={{ scale: 0.8, opacity: 0, rotate: 18, filter: "blur(8px)" }}
                animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                exit={{ scale: 0.8, opacity: 0, rotate: -18, filter: "blur(8px)" }}
                transition={{ duration: 0.45, ease: EASE_REBOTE }}
                className="relative"
              >
                <ObjetoFlotante indice={0}>
                  <Image
                    src={producto.imagenRecorte || "/recortes/palta.png"}
                    alt={producto.nombre}
                    width={dim.w}
                    height={dim.h}
                    className="w-auto select-none"
                    style={{
                      height: "clamp(150px, 24svh, 260px)",
                      filter: "var(--shadow-recorte)",
                    }}
                  />
                </ObjetoFlotante>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {disponibles.map((p) => {
              const activo = p.slug === slugActivo;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setSlugActivo(p.slug)}
                  className={
                    activo
                      ? "rounded-full bg-verde-600 px-5 py-2 text-sm font-semibold text-white transition-colors"
                      : "rounded-full border border-tinta/15 px-5 py-2 text-sm font-semibold text-tinta-suave transition-colors hover:border-tinta/30"
                  }
                >
                  {p.nombre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna derecha: el cálculo */}
        <div>
          <label
            htmlFor="calc-kilos"
            className="block text-sm font-semibold text-tinta"
          >
            ¿Cuántos kilos te llevas? (mínimo {PEDIDO_MINIMO_KG} kg)
          </label>

          <div className="mt-3 flex items-center gap-4">
            <div className="relative flex-1">
              <input
                id="calc-kilos"
                type="range"
                min={PEDIDO_MINIMO_KG}
                max={topeSlider}
                step={10}
                value={valorSlider}
                onChange={(e) => actualizarKilos(Number(e.target.value))}
                className="control-slider"
                style={{ "--fondo-pista": fondoPista } as React.CSSProperties}
                aria-valuenow={kilos}
                aria-valuemin={PEDIDO_MINIMO_KG}
                aria-valuemax={topeSlider}
                aria-valuetext={`${kilos} kilos`}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-tinta/30"
                style={{ left: `${porcentajeUmbral}%` }}
              >
                <span className="absolute top-4 -translate-x-1/2 text-[10px] whitespace-nowrap text-tinta-suave">
                  {producto.kilosDescuento} kg
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-tinta/15 px-3 py-2">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={textoKilos}
                onChange={(e) => {
                  setTextoKilos(e.target.value);
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) setKilos(Math.max(0, n));
                }}
                onBlur={() => actualizarKilos(kilos)}
                className="w-14 bg-transparent text-right font-semibold text-tinta outline-none"
              />
              <span className="text-sm text-tinta-suave">kg</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-media)]">
            <p className="text-sm text-tinta-suave">
              {kilos} kg · {producto.nombre}
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-tinta-suave">Precio por kilo</span>
              <span className="font-semibold text-tinta">{clp(resultado.unitario)}</span>
            </div>
            <div className="my-3 border-t border-tinta/10" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-tinta-suave">Total</span>
                <span
                  className="font-titulo text-verde-700"
                  style={{ fontSize: 44, fontVariantNumeric: "tabular-nums" }}
                >
                  {totalTexto}
                </span>
              </div>

              <AnimatePresence>
                {resultado.usaDescuento && (
                  <motion.div
                    key="sello"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3 }}
                    // La inclinación va por CSS, no por Motion: así en móvil
                    // sale recto desde el primer frame. Si la animara Motion,
                    // el valor se fija al montar, cuando todavía no se sabe el
                    // ancho, y el sello aparecía torcido igual.
                    className="md:-rotate-[8deg]"
                  >
                    <motion.div
                      initial={{ scale: 2.4 }}
                      animate={{
                        scale: [2.4, 0.92, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(245,205,7,.6)",
                          "0 0 0 24px rgba(245,205,7,0)",
                        ],
                      }}
                      exit={{ scale: 0.6 }}
                      transition={{ duration: 0.5, ease: EASE_REBOTE }}
                      className="rounded-[10px] bg-limon px-3 py-1.5"
                      style={{ border: "2px dashed white" }}
                    >
                      <span
                        className="flex items-center gap-1.5 font-titulo text-verde-700"
                        style={{ fontSize: 13, letterSpacing: "0.12em" }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="15"
                          height="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h9a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.8Z" />
                          <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
                        </svg>
                        DESCUENTO APLICADO
                      </span>
                      <span className="sr-only" aria-live="polite">
                        Descuento por volumen aplicado
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* El aviso del mínimo manda sobre el del descuento: de nada
                sirve decirle a alguien cuánto le falta para la rebaja si el
                pedido todavía no alcanza para tomarse. */}
            {bajoElMinimo ? (
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--color-naranja-texto)" }}>
                El pedido mínimo es de {PEDIDO_MINIMO_KG} kg — te faltan{" "}
                {PEDIDO_MINIMO_KG - kilos} kg
              </p>
            ) : (
              <>
                {!resultado.usaDescuento && resultado.faltan > 0 && (
                  <p
                    className="mt-3 text-sm font-medium"
                    style={{ color: "var(--color-naranja-texto)" }}
                  >
                    Te faltan {resultado.faltan} kg para el precio con descuento
                  </p>
                )}
                {resultado.usaDescuento && resultado.ahorro > 0 && (
                  <p className="mt-3 text-sm font-medium text-verde-600">
                    Estás ahorrando {clp(resultado.ahorro)}
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              onClick={manejarEncargo}
              disabled={bajoElMinimo}
              className="mt-5 w-full rounded-full border-2 border-cyan-500 py-3 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:border-tinta/15 disabled:text-tinta-suave disabled:hover:bg-transparent"
            >
              {bajoElMinimo
                ? `Sube a ${PEDIDO_MINIMO_KG} kg para encargar`
                : `Encargar estos ${kilos} kg por WhatsApp`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
