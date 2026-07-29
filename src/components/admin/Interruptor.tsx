"use client";

import { motion } from "motion/react";
import { RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";

type Props = {
  activo: boolean;
  onChange: (v: boolean) => void;
  etiqueta?: string;
  disabled?: boolean;
};

export default function Interruptor({ activo, onChange, etiqueta, disabled }: Props) {
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      animate={{ backgroundColor: activo ? "#076244" : "#D9E2DF" }}
      transition={{ duration: reducido ? 0 : 0.25 }}
      className="inline-flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 disabled:opacity-50"
    >
      <motion.span
        layout
        className="h-6 w-6 rounded-full bg-white shadow"
        animate={{ x: activo ? 20 : 0 }}
        transition={resorte}
      />
    </motion.button>
  );
}
