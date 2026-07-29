"use client";

import { useEffect } from "react";
import Link from "next/link";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { Icono } from "./Iconos";

type Tarjeta = {
  href: string;
  numero: number;
  etiqueta: string;
  icono: string;
  resaltar?: boolean;
};

type ProductoSinFoto = { id: string; nombre: string; falta: string };

/** Número que sube desde 0 al montar la tarjeta. */
function Contador({ valor }: { valor: number }) {
  const reducido = useMovimientoReducido();
  const bruto = useMotionValue(0);
  const texto = useTransform(bruto, (v) => Math.round(v).toString());

  useEffect(() => {
    if (reducido) {
      bruto.set(valor);
      return;
    }
    const control = animate(bruto, valor, { duration: 0.9, ease: EASE_SALIDA });
    return () => control.stop();
  }, [valor, bruto, reducido]);

  return <motion.span>{texto}</motion.span>;
}

export default function ResumenPanel({
  tarjetas,
  sinFoto,
}: {
  tarjetas: Tarjeta[];
  sinFoto: ProductoSinFoto[];
}) {
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  return (
    <motion.div
      initial="oculto"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reducido ? 0 : 0.08 } } }}
    >
      <motion.div
        variants={{
          oculto: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
        }}
      >
        <h1 className="font-titulo text-verde-700" style={{ fontSize: 30 }}>
          Hola
        </h1>
        <p className="mt-1 text-tinta-suave">Este es el resumen de tu bodega.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <motion.div
            key={t.href + t.etiqueta}
            variants={{
              oculto: { opacity: 0, y: 20, scale: 0.97 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: EASE_SALIDA },
              },
            }}
            whileHover={reducido ? undefined : { y: -5 }}
            transition={resorte}
          >
            <Link
              href={t.href}
              className="flex h-full flex-col justify-between rounded-2xl border border-tinta/[0.07] bg-white p-5 shadow-[var(--shadow-suave)] transition-shadow hover:shadow-[var(--shadow-media)]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: t.resaltar ? "rgba(253,112,5,.12)" : "var(--color-cyan-100)",
                  color: t.resaltar ? "var(--color-naranja-texto)" : "var(--color-cyan-700)",
                }}
              >
                <Icono nombre={t.icono} tam={18} />
              </span>
              <p
                className="mt-4 font-titulo"
                style={{
                  fontSize: 38,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color: t.resaltar ? "var(--color-naranja-texto)" : "var(--color-verde-700)",
                }}
              >
                <Contador valor={t.numero} />
              </p>
              <p className="mt-1.5 text-sm leading-snug text-tinta-suave">{t.etiqueta}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {sinFoto.length > 0 && (
        <motion.div
          variants={{
            oculto: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
          }}
          className="mt-6 rounded-2xl border p-5"
          style={{ borderColor: "rgba(253,112,5,.25)", background: "rgba(253,112,5,.06)" }}
        >
          <p className="flex items-center gap-2 font-semibold" style={{ color: "var(--color-naranja-texto)" }}>
            <Icono nombre="alerta" tam={18} />
            Productos con fotos incompletas
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            Cada producto usa dos fotos: una del catálogo (varias frutas juntas) y una de la
            calculadora (una sola fruta recortada).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sinFoto.map((p) => (
              <Link
                key={p.id}
                href={`/admin/productos/${p.id}`}
                className="rounded-full border border-tinta/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-tinta transition-colors hover:border-tinta/25"
              >
                {p.nombre} · falta {p.falta}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        variants={{
          oculto: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
        }}
        className="mt-8"
      >
        <p className="text-sm font-semibold text-tinta">Accesos directos</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <AccesoDirecto href="/admin/productos/nuevo" primario>
            <Icono nombre="mas" tam={16} />
            Agregar producto
          </AccesoDirecto>
          <AccesoDirecto href="/admin/productos">
            <Icono nombre="caja" tam={16} />
            Cambiar precios
          </AccesoDirecto>
          <AccesoDirecto href="/admin/accesos">
            <Icono nombre="llave" tam={16} />
            Invitar a alguien
          </AccesoDirecto>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AccesoDirecto({
  href,
  primario,
  children,
}: {
  href: string;
  primario?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        className={
          primario
            ? "flex items-center gap-2 rounded-full bg-verde-600 px-5 py-2.5 text-sm font-semibold text-white"
            : "flex items-center gap-2 rounded-full border border-tinta/15 bg-white px-5 py-2.5 text-sm font-semibold text-tinta"
        }
      >
        {children}
      </Link>
    </motion.div>
  );
}
