"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { EASE_SUAVE } from "@/lib/motion-config";

const ENLACES = [
  { id: "catalogo", label: "Productos" },
  { id: "calculadora", label: "Calcular" },
  { id: "nosotros", label: "Quiénes somos" },
  { id: "comprar", label: "Cómo comprar" },
  { id: "contacto", label: "Contacto" },
];

/**
 * Cuánto aguanta el nav a la vista sin que nadie mueva la página. El nav
 * acompaña al scroll: aparece con cualquier movimiento y se retira cuando la
 * persona lleva un rato quieta. Se va por tiempo y no por dirección porque
 * quedarse quieto es lo único que dice "no lo estoy usando"; seguir bajando
 * no lo dice.
 */
const OCULTAR_TRAS_MS = 4000;

export default function NavFlotante() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const [activo, setActivo] = useState("catalogo");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    if (temporizador.current) clearTimeout(temporizador.current);

    // Arriba del todo (primera pantalla) no aparece: ahí manda la portada.
    if (y <= window.innerHeight * 0.7) {
      setVisible(false);
      return;
    }

    setVisible(true);
    temporizador.current = setTimeout(() => setVisible(false), OCULTAR_TRAS_MS);
  });

  // Un temporizador pendiente al desmontar dispararía un setState sobre un
  // componente que ya no está.
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  useEffect(() => {
    const secciones = ENLACES.map((e) => document.getElementById(e.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (secciones.length === 0) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        const masVisible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (masVisible) setActivo(masVisible.target.id);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    secciones.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  useEffect(() => {
    function escuchar(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAbierto(false);
    }
    window.addEventListener("keydown", escuchar);
    return () => window.removeEventListener("keydown", escuchar);
  }, []);

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: visible ? 0 : -80, opacity: visible ? 1 : 0 }}
        transition={{ duration: visible ? 0.3 : 0.5, ease: EASE_SUAVE }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="fixed top-5 left-1/2 z-50 -translate-x-1/2"
      >
        <div
          className="flex items-center gap-1 rounded-full border px-3 py-2 shadow-[var(--shadow-suave)]"
          style={{
            background: "rgba(255,255,255,.78)",
            borderColor: "rgba(11,43,34,.08)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <a href="#" aria-label="Inicio" className="mr-1 shrink-0">
            <Image src="/logo.webp" width={32} height={32} alt="" className="rounded-full" />
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {ENLACES.map((enlace) => (
              <a
                key={enlace.id}
                href={`#${enlace.id}`}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: activo === enlace.id ? "var(--color-verde-700)" : "var(--color-tinta-suave)" }}
              >
                {activo === enlace.id && (
                  <motion.span
                    layoutId="nav-indicador"
                    className="absolute inset-0 -z-10 rounded-full bg-cyan-100"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {enlace.label}
              </a>
            ))}
          </div>

          {/* Entrada al panel. Enlace normal y no <Link>: /admin está detrás de
              la sesión, así que prefetcharlo solo traería el redirect al login. */}
          <a
            href="/admin"
            className="ml-1 hidden shrink-0 items-center rounded-full bg-verde-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-verde-500 md:inline-flex"
          >
            IntraNet
          </a>

          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full text-verde-700 md:hidden"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            key="hoja-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-white md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="flex justify-between items-center p-6">
              <Image src="/logo.webp" width={36} height={36} alt="" />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-11 w-11 items-center justify-center rounded-full text-verde-700"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col items-center gap-7 pt-10">
              {ENLACES.map((enlace, i) => (
                <motion.a
                  key={enlace.id}
                  href={`#${enlace.id}`}
                  onClick={() => setMenuAbierto(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  className="font-titulo text-verde-700"
                  style={{ fontSize: 28 }}
                >
                  {enlace.label}
                </motion.a>
              ))}

              <motion.a
                href="/admin"
                onClick={() => setMenuAbierto(false)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: ENLACES.length * 0.06 }}
                className="mt-3 rounded-full bg-verde-600 px-9 py-3.5 font-titulo text-white"
                style={{ fontSize: 22 }}
              >
                IntraNet
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
