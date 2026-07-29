"use client";

import { motion } from "motion/react";
import { EASE_SALIDA, useMovimientoReducido } from "@/lib/motion-config";
import { Icono } from "./Iconos";

/** Contenedor que escalona la entrada de sus hijos <TarjetaSeccion>. */
export function ListaTarjetas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducido = useMovimientoReducido();

  return (
    <motion.div
      initial="oculto"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: reducido ? 0 : 0.07 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type Props = {
  titulo?: string;
  ayuda?: string;
  icono?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Tarjeta blanca del panel, con cabecera opcional y entrada animada. */
export default function TarjetaSeccion({
  titulo,
  ayuda,
  icono,
  acciones,
  children,
  className,
}: Props) {
  return (
    <motion.section
      variants={{
        oculto: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
      }}
      className={`rounded-2xl border border-tinta/[0.07] bg-white p-6 shadow-[var(--shadow-suave)] ${className ?? ""}`}
    >
      {(titulo || acciones) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icono && (
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                <Icono nombre={icono} tam={17} />
              </span>
            )}
            <div>
              {titulo && <h2 className="font-semibold text-tinta">{titulo}</h2>}
              {ayuda && <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>}
            </div>
          </div>
          {acciones}
        </div>
      )}
      {children}
    </motion.section>
  );
}
