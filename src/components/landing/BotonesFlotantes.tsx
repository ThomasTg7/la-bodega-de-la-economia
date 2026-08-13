"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { EASE_REBOTE } from "@/lib/motion-config";

const CLAVE_TOOLTIP_VISTO = "bodega_tooltip_whatsapp_visto";

/**
 * Botón flotante de WhatsApp: el único que sigue a la persona por toda la
 * página. Sale 2.5s después de cargar para no tapar la portada apenas entra
 * alguien, y salta derecho al chat.
 */
export default function BotonesFlotantes() {
  const { abrir } = useBurbujaWhatsApp();
  const [entrada, setEntrada] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntrada(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Globo "¿Te ayudo con un precio?" una sola vez, tras 8s sin interacción.
  useEffect(() => {
    if (sessionStorage.getItem(CLAVE_TOOLTIP_VISTO)) return;
    const t = setTimeout(() => {
      setTooltip(true);
      sessionStorage.setItem(CLAVE_TOOLTIP_VISTO, "1");
      setTimeout(() => setTooltip(false), 6000);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // El halo del pulso crece 14px más allá del botón, así que el margen al
  // borde tiene que ser mayor que eso o el anillo se ve cortado contra el
  // canto de la pantalla. Con 22px queda un respiro de 8px. Los
  // safe-area-inset cubren el notch y la barra de gestos: sin el de la
  // derecha, un teléfono en horizontal mete el botón bajo el notch.
  const HALO = 14;
  const abajo = "calc(22px + env(safe-area-inset-bottom))";
  const derecha = "calc(22px + env(safe-area-inset-right))";

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          setTooltip(false);
          abrir();
        }}
        aria-label="Escríbenos por WhatsApp"
        initial={{ scale: 0 }}
        animate={entrada ? { scale: [0, 1.15, 1] } : { scale: 0 }}
        transition={{ duration: 0.5, ease: EASE_REBOTE }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-[60] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-flotante)] sm:h-[62px] sm:w-[62px]"
        style={{ right: derecha, bottom: abajo }}
      >
        {entrada && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(37,211,102,.5)",
                `0 0 0 ${HALO}px rgba(37,211,102,0)`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "easeOut" }}
          />
        )}
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.25 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.19-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.55 3.71-8.23 8.26-8.23zm-4.53 4.7c-.16 0-.42.06-.64.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.7 4.19 3.68 2.07.82 2.49.66 2.94.62.45-.04 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {tooltip && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setTooltip(false);
              abrir();
            }}
            className="fixed z-[60] rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-tinta shadow-[var(--shadow-flotante)]"
            style={{
              // Arranca donde termina el botón (56px + sus 22 de margen) y
              // no pasa del borde izquierdo aunque el texto crezca.
              right: "calc(88px + env(safe-area-inset-right))",
              bottom: abajo,
              maxWidth: "min(220px, calc(100vw - 110px))",
            }}
          >
            ¿Te ayudo con un precio?
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
