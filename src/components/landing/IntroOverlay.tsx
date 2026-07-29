"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { obtenerLenis } from "@/lib/lenis-instancia";
import { EASE_SALIDA } from "@/lib/motion-config";

const CLAVE_SESION = "intro-vista";
const TEXTO = "LA BODEGA DE LA ECONOMÍA";

type Modo = "cargando" | "completo" | "corto";

export default function IntroOverlay() {
  const [modo, setModo] = useState<Modo>("cargando");
  const [visible, setVisible] = useState(true);

  // Decide el modo ANTES de pintar (useLayoutEffect) para no mostrar un
  // frame con el modo incorrecto, y bloquea el scroll de inmediato. No es
  // un simple sync de estado (además escribe sessionStorage, para Lenis y
  // bloquea el body) así que no encaja en useSyncExternalStore — es una
  // inicialización imperativa única, el uso canónico de un efecto.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const yaVista = sessionStorage.getItem(CLAVE_SESION);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.body.style.overflow = "hidden";
    obtenerLenis()?.stop();

    if (yaVista) {
      setModo("corto");
    } else {
      sessionStorage.setItem(CLAVE_SESION, "1");
      setModo(reducido ? "corto" : "completo");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (modo === "cargando") return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duracion = modo === "completo" ? 1900 : reducido ? 300 : 250;

    const t = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
      obtenerLenis()?.start();
    }, duracion);

    return () => clearTimeout(t);
  }, [modo]);

  if (modo === "cargando" || !visible) return null;

  const completo = modo === "completo";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "#1DA38C" }}
      initial={completo ? { clipPath: "circle(140% at 50% 50%)" } : { opacity: 1 }}
      animate={
        completo
          ? {
              clipPath: [
                "circle(140% at 50% 50%)",
                "circle(140% at 50% 50%)",
                "circle(0% at 50% 50%)",
              ],
            }
          : { opacity: [1, 1, 0] }
      }
      transition={
        completo
          ? { duration: 1.9, times: [0, 0.63, 1], ease: EASE_SALIDA }
          : { duration: 0.25, times: [0, 0, 1] }
      }
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, filter: "blur(14px)" }}
        animate={
          completo
            ? {
                scale: [0.82, 1, 1, 1.25],
                opacity: [0, 1, 1, 0],
                filter: ["blur(14px)", "blur(0px)", "blur(0px)", "blur(0px)"],
              }
            : { scale: 1, opacity: [0, 1, 1, 0], filter: "blur(0px)" }
        }
        transition={
          completo
            ? { duration: 1.9, times: [0, 0.368, 0.63, 1], ease: EASE_SALIDA }
            : { duration: 0.25 }
        }
      >
        <Image src="/logo.png" width={120} height={120} alt="" priority />
      </motion.div>

      {completo && (
        <div className="mt-4 flex" style={{ perspective: 600 }}>
          {Array.from(TEXTO).map((letra, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.03, ease: EASE_SALIDA }}
              className="font-titulo text-white"
              style={{ fontSize: 15, letterSpacing: "0.08em" }}
            >
              {letra === " " ? " " : letra}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
