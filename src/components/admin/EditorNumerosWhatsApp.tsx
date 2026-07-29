"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { repartoEnPorcentaje, type NumeroWhatsApp } from "@/lib/whatsapp";
import { Icono } from "./Iconos";

const COLORES_REPARTO = ["#30CFB2", "#076244", "#FD7005", "#F5CD07", "#1DA38C", "#224621"];

type Props = {
  numeros: NumeroWhatsApp[];
  onChange: (numeros: NumeroWhatsApp[]) => void;
};

/**
 * Lista de números de WhatsApp con el peso de cada uno. Los pesos son
 * relativos: 70/30 reparte igual que 7/3, así que no obliga a que sumen 100.
 * El porcentaje real se muestra calculado para que no haya que hacer la
 * cuenta a mano.
 */
export default function EditorNumerosWhatsApp({ numeros, onChange }: Props) {
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };
  const porcentajes = repartoEnPorcentaje(numeros);
  const hayReparto = numeros.length > 1;

  function actualizar(indice: number, parche: Partial<NumeroWhatsApp>) {
    onChange(numeros.map((n, i) => (i === indice ? { ...n, ...parche } : n)));
  }

  function agregar() {
    onChange([...numeros, { nombre: "", numero: "", peso: numeros.length === 0 ? 100 : 50 }]);
  }

  function quitar(indice: number) {
    onChange(numeros.filter((_, i) => i !== indice));
  }

  function repartirParejo() {
    const parejo = numeros.length > 0 ? Math.round(100 / numeros.length) : 0;
    onChange(numeros.map((n) => ({ ...n, peso: parejo })));
  }

  return (
    <div>
      {/* Barra con el reparto resultante */}
      <AnimatePresence>
        {hayReparto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-tinta/[0.07]">
                {numeros.map((n, i) => (
                  <motion.div
                    key={`${n.numero}-${i}`}
                    className="h-full"
                    animate={{ width: `${porcentajes[i]}%` }}
                    transition={resorte}
                    style={{ background: COLORES_REPARTO[i % COLORES_REPARTO.length] }}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {numeros.map((n, i) => (
                  <span
                    key={`leyenda-${n.numero}-${i}`}
                    className="flex items-center gap-1.5 text-xs text-tinta-suave"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: COLORES_REPARTO[i % COLORES_REPARTO.length] }}
                    />
                    {n.nombre || n.numero || "sin nombre"}
                    <strong className="text-tinta">{Math.round(porcentajes[i])}%</strong>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {numeros.map((n, i) => (
            <motion.div
              key={i}
              layout={!reducido}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: EASE_SALIDA }}
              className="rounded-xl border border-tinta/10 bg-white p-3.5"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ background: COLORES_REPARTO[i % COLORES_REPARTO.length] }}
                />

                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`wa-nombre-${i}`}
                      className="block text-xs font-semibold text-tinta-suave"
                    >
                      ¿Quién contesta?
                    </label>
                    <input
                      id={`wa-nombre-${i}`}
                      type="text"
                      value={n.nombre}
                      onChange={(e) => actualizar(i, { nombre: e.target.value })}
                      placeholder="Ej: Thomas"
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-2.5 py-2 text-sm outline-none transition-colors focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`wa-numero-${i}`}
                      className="block text-xs font-semibold text-tinta-suave"
                    >
                      Número
                    </label>
                    <input
                      id={`wa-numero-${i}`}
                      type="tel"
                      inputMode="tel"
                      value={n.numero}
                      onChange={(e) => actualizar(i, { numero: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="mt-1 w-full rounded-lg border border-tinta/15 px-2.5 py-2 text-sm outline-none transition-colors focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => quitar(i)}
                  aria-label={`Quitar ${n.nombre || n.numero || "número"}`}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tinta-suave transition-colors hover:bg-tinta/5 hover:text-tinta"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {hayReparto && (
                <div className="mt-3 flex items-center gap-3 border-t border-tinta/[0.07] pt-3">
                  <label
                    htmlFor={`wa-peso-${i}`}
                    className="shrink-0 text-xs font-semibold text-tinta-suave"
                  >
                    Le toca
                  </label>
                  <input
                    id={`wa-peso-${i}`}
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={n.peso}
                    onChange={(e) => actualizar(i, { peso: Number(e.target.value) })}
                    className="h-2 flex-1 cursor-pointer accent-verde-600"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={n.peso}
                    onChange={(e) =>
                      actualizar(i, {
                        peso: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    aria-label={`Peso de ${n.nombre || n.numero || "este número"}`}
                    className="w-16 rounded-lg border border-tinta/15 px-2 py-1.5 text-center text-sm outline-none transition-colors focus:border-cyan-400"
                  />
                  <span
                    className="w-12 shrink-0 text-right text-sm font-bold"
                    style={{ color: COLORES_REPARTO[i % COLORES_REPARTO.length] }}
                  >
                    {Math.round(porcentajes[i])}%
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          onClick={agregar}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 rounded-full border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta transition-colors hover:border-tinta/30"
        >
          <Icono nombre="mas" tam={15} />
          Agregar número
        </motion.button>

        {hayReparto && (
          <button
            type="button"
            onClick={repartirParejo}
            className="text-xs font-semibold text-cyan-700"
          >
            Repartir en partes iguales
          </button>
        )}
      </div>

      {numeros.length === 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium" style={{ color: "var(--color-naranja-texto)" }}>
          <Icono nombre="alerta" tam={14} className="mt-px" />
          Sin números acá, la burbuja usa el WhatsApp de más abajo.
        </p>
      )}
    </div>
  );
}
