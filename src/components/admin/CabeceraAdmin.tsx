"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { EASE_SALIDA, useMovimientoReducido } from "@/lib/motion-config";
import { Icono } from "./Iconos";

const TITULOS: { prefijo: string; titulo: string; exacto?: boolean }[] = [
  { prefijo: "/admin/productos/nuevo", titulo: "Nuevo producto" },
  { prefijo: "/admin/productos", titulo: "Productos" },
  { prefijo: "/admin/mensajes", titulo: "Mensajes" },
  { prefijo: "/admin/invitaciones", titulo: "Invitaciones" },
  { prefijo: "/admin/usuarios", titulo: "Usuarios" },
  { prefijo: "/admin/ajustes", titulo: "Ajustes" },
  { prefijo: "/admin", titulo: "Resumen", exacto: true },
];

function tituloDe(pathname: string) {
  const encontrado = TITULOS.find((t) =>
    t.exacto ? pathname === t.prefijo : pathname.startsWith(t.prefijo)
  );
  return encontrado?.titulo ?? "Panel";
}

export default function CabeceraAdmin({
  email,
  mensajesSinLeer,
}: {
  email: string;
  mensajesSinLeer: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reducido = useMovimientoReducido();
  const titulo = tituloDe(pathname);

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-tinta/[0.07] bg-white/80 px-5 py-3.5 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={titulo}
            initial={reducido ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducido ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE_SALIDA }}
            className="truncate font-titulo text-verde-700"
            style={{ fontSize: 17 }}
          >
            {titulo}
          </motion.p>
        </AnimatePresence>
        <p className="truncate text-xs text-tinta-suave">{email}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <AnimatePresence>
          {mensajesSinLeer > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="hidden rounded-full bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-700 sm:inline"
            >
              {mensajesSinLeer} sin leer
            </motion.span>
          )}
        </AnimatePresence>

        <motion.a
          href="/"
          target="_blank"
          rel="noreferrer"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-tinta/10 text-tinta-suave transition-colors hover:text-verde-700 md:hidden"
          aria-label="Ver la página"
        >
          <Icono nombre="ojo" tam={17} />
        </motion.a>

        <motion.button
          type="button"
          onClick={cerrarSesion}
          whileTap={{ scale: 0.96 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-tinta/10 text-tinta-suave transition-colors hover:text-verde-700 md:hidden"
          aria-label="Cerrar sesión"
        >
          <Icono nombre="salir" tam={17} />
        </motion.button>
      </div>
    </header>
  );
}
