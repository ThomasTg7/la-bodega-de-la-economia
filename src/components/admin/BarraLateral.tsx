"use client";

import Link, { useLinkStatus } from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { Icono } from "./Iconos";

const ENLACES = [
  { href: "/admin", label: "Resumen", icono: "inicio", exacto: true },
  { href: "/admin/productos", label: "Productos", icono: "caja" },
  { href: "/admin/mensajes", label: "Mensajes", icono: "chat" },
  { href: "/admin/invitaciones", label: "Invitar", icono: "llave" },
  { href: "/admin/qr", label: "QR", icono: "qr" },
  { href: "/admin/usuarios", label: "Usuarios", icono: "persona" },
  { href: "/admin/ajustes", label: "Ajustes", icono: "engranaje" },
];

function estaActivo(pathname: string, href: string, exacto?: boolean) {
  return exacto ? pathname === href : pathname.startsWith(href);
}

/** Barrita de carga que se muestra mientras la ruta destino todavía no llega. */
function PulsoNavegando() {
  const { pending } = useLinkStatus();
  return (
    <motion.span
      aria-hidden="true"
      className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full bg-cyan-400"
      initial={false}
      animate={{ opacity: pending ? 1 : 0, scaleX: pending ? 1 : 0.2 }}
      transition={{ duration: 0.25 }}
    />
  );
}

export default function BarraLateral({ mensajesSinLeer = 0 }: { mensajesSinLeer?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-tinta/[0.07] bg-white p-4 md:flex">
        <Link href="/admin" className="mb-7 flex items-center gap-2.5 px-2 pt-2">
          <motion.span whileHover={{ rotate: -8, scale: 1.08 }} transition={resorte}>
            <Image src="/logo.webp" width={34} height={34} alt="" />
          </motion.span>
          <span className="font-titulo text-sm leading-tight text-verde-700">
            La bodega
            <span className="block text-[10px] font-bold tracking-[0.16em] text-tinta-suave uppercase">
              Panel
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {ENLACES.map((enlace) => {
            const activo = estaActivo(pathname, enlace.href, enlace.exacto);
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                aria-current={activo ? "page" : undefined}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
                style={{ color: activo ? "var(--color-verde-700)" : "var(--color-tinta-suave)" }}
              >
                {activo && (
                  <motion.span
                    layoutId="pastilla-nav"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-cyan-100"
                    transition={resorte}
                  />
                )}
                <motion.span
                  className="relative z-10 flex items-center gap-3"
                  whileHover={{ x: 2 }}
                  transition={resorte}
                >
                  <Icono nombre={enlace.icono} />
                  {enlace.label}
                </motion.span>

                <AnimatePresence>
                  {enlace.href === "/admin/mensajes" && mensajesSinLeer > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={resorte}
                      className="relative z-10 ml-auto rounded-full bg-verde-600 px-2 py-0.5 text-xs font-bold text-white"
                    >
                      {mensajesSinLeer}
                    </motion.span>
                  )}
                </AnimatePresence>

                <PulsoNavegando />
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-1 border-t border-tinta/[0.07] pt-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-tinta-suave transition-colors hover:bg-cyan-100/60 hover:text-verde-700"
          >
            <Icono nombre="ojo" />
            Ver la página
          </a>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-tinta-suave transition-colors hover:bg-tinta/5"
          >
            <Icono nombre="salir" />
            Salir
          </button>
        </div>
      </aside>

      {/* Móvil: barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-tinta/[0.07] bg-white/95 py-1.5 backdrop-blur md:hidden">
        {ENLACES.map((enlace) => {
          const activo = estaActivo(pathname, enlace.href, enlace.exacto);
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              aria-current={activo ? "page" : undefined}
              className="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[9.5px] font-medium"
              style={{ color: activo ? "var(--color-verde-700)" : "var(--color-tinta-suave)" }}
            >
              {activo && (
                <motion.span
                  layoutId="pastilla-nav-movil"
                  aria-hidden="true"
                  className="absolute inset-x-1.5 inset-y-0 rounded-xl bg-cyan-100"
                  transition={resorte}
                />
              )}
              <motion.span
                className="relative z-10 flex flex-col items-center gap-0.5"
                animate={{ scale: activo ? 1.06 : 1 }}
                transition={resorte}
              >
                <Icono nombre={enlace.icono} tam={20} />
                {enlace.label}
              </motion.span>
              {enlace.href === "/admin/mensajes" && mensajesSinLeer > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={resorte}
                  className="absolute top-0.5 right-1/4 z-10 h-2 w-2 rounded-full bg-verde-600"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
