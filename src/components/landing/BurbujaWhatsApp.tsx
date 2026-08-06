"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { armarLinkWhatsApp, elegirNumeroPonderado, type NumeroWhatsApp } from "@/lib/whatsapp";
import { ASUNTOS_WHATSAPP } from "@/lib/constantes";
import { EASE_SALIDA, EASE_REBOTE } from "@/lib/motion-config";

const CLAVE_TOOLTIP_VISTO = "bodega_tooltip_whatsapp_visto";
const CLAVE_DESTINO = "bodega_whatsapp_destino";

/**
 * Elige a quién le llega este mensaje respetando los pesos del reparto, y
 * lo deja fijo por lo que dure la pestaña: si alguien escribe dos veces en
 * la misma visita, le sigue contestando la misma persona.
 */
function elegirDestino(numeros: NumeroWhatsApp[]): string {
  if (numeros.length === 0) return "";
  if (numeros.length === 1) return numeros[0].numero;

  try {
    const guardado = sessionStorage.getItem(CLAVE_DESTINO);
    if (guardado && numeros.some((n) => n.numero === guardado)) return guardado;
  } catch {
    // sessionStorage bloqueado (modo privado en algunos navegadores): se
    // sortea igual, solo se pierde la continuidad entre envíos.
  }

  const elegido = elegirNumeroPonderado(numeros)?.numero ?? numeros[0].numero;
  try {
    sessionStorage.setItem(CLAVE_DESTINO, elegido);
  } catch {
    /* ídem */
  }
  return elegido;
}

export default function BurbujaWhatsApp({ numeros }: { numeros: NumeroWhatsApp[] }) {
  const { abierta, prellenado, abrir, cerrar } = useBurbujaWhatsApp();
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [entrada, setEntrada] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);

  const [nombre, setNombre] = useState("");
  const [asunto, setAsunto] = useState<string>(ASUNTOS_WHATSAPP[0]);
  const [mensaje, setMensaje] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Entrada del FAB 2.5s después de cargar la página.
  useEffect(() => {
    const t = setTimeout(() => setEntrada(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Globo "¿Te ayudo con un precio?" una sola vez, tras 8s sin interacción.
  useEffect(() => {
    if (sessionStorage.getItem(CLAVE_TOOLTIP_VISTO)) return;
    const t = setTimeout(() => {
      if (!abierta) {
        setTooltip(true);
        sessionStorage.setItem(CLAVE_TOOLTIP_VISTO, "1");
        setTimeout(() => setTooltip(false), 6000);
      }
    }, 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al abrir/cerrar: resetea el indicador de "escribiendo" y prellena desde
  // el contexto (ej: botón "Encargar" de la calculadora). Se ajusta durante
  // el render (comparando contra el `abierta` anterior) en vez de un
  // efecto, porque no es una suscripción a nada externo — es reaccionar a
  // que una prop cambió, que React permite hacer sin efecto.
  const [abiertaAnterior, setAbiertaAnterior] = useState(abierta);
  if (abierta !== abiertaAnterior) {
    setAbiertaAnterior(abierta);
    setMostrarMensaje(false);
    if (abierta) {
      if (prellenado.asunto) setAsunto(prellenado.asunto);
      if (prellenado.mensaje) setMensaje(prellenado.mensaje);
    }
  }

  // Typing indicator: 600ms después de abrirse, muestra el mensaje.
  useEffect(() => {
    if (!abierta) return;
    const t = setTimeout(() => setMostrarMensaje(true), 600);
    return () => clearTimeout(t);
  }, [abierta]);

  // Cerrar con click afuera.
  useEffect(() => {
    if (!abierta) return;
    function manejar(e: MouseEvent) {
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo)) return;
      if (fabRef.current?.contains(objetivo)) return;
      cerrar();
    }
    document.addEventListener("mousedown", manejar);
    return () => document.removeEventListener("mousedown", manejar);
  }, [abierta, cerrar]);

  // Cerrar con Escape + atrapar el foco (Tab) dentro del panel.
  useEffect(() => {
    if (!abierta) return;
    function manejar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cerrar();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const enfocables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [abierta, cerrar]);

  // Al abrir se enfoca el panel, no el campo "Tu nombre": enfocar un input
  // por código levanta el teclado en iOS apenas se toca el botón, tapando
  // media pantalla antes de que la persona alcance a leer el saludo. El
  // panel lleva tabIndex={-1} para poder recibir el foco, así el lector de
  // pantalla igual entra al diálogo y el primer Tab cae en el primer campo.
  useEffect(() => {
    if (abierta) {
      panelRef.current?.focus();
    } else {
      fabRef.current?.focus();
    }
  }, [abierta]);

  function autoRedimensionar() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !mensaje.trim()) return;

    const destino = elegirDestino(numeros);
    if (!destino) return;

    // La conversación queda en WhatsApp, que ya es la bandeja de entrada
    // real. Guardar acá una copia solo llenaba el panel de duplicados (y de
    // gente que abrió WhatsApp pero nunca llegó a apretar enviar).
    const url = armarLinkWhatsApp(destino, nombre, asunto, mensaje);
    window.open(url, "_blank", "noopener,noreferrer");

    setNombre("");
    setMensaje("");
    setAsunto(ASUNTOS_WHATSAPP[0]);
    cerrar();
  }

  const horaActual = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <>
      <motion.button
        ref={fabRef}
        type="button"
        onClick={() => (abierta ? cerrar() : abrir())}
        aria-label={abierta ? "Cerrar chat de WhatsApp" : "Escríbenos por WhatsApp"}
        aria-expanded={abierta}
        initial={{ scale: 0 }}
        animate={entrada ? { scale: [0, 1.15, 1] } : { scale: 0 }}
        transition={{ duration: 0.5, ease: EASE_REBOTE }}
        className="fixed z-[60] flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-flotante)]"
        style={{
          right: 20,
          bottom: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        {entrada && !abierta && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ["0 0 0 0 rgba(37,211,102,.5)", "0 0 0 20px rgba(37,211,102,0)"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "easeOut" }}
          />
        )}
        <motion.svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          fill="currentColor"
          animate={{ rotate: abierta ? 90 : 0 }}
          transition={{ duration: 0.25 }}
        >
          {abierta ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.25 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.19-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.55 3.71-8.23 8.26-8.23zm-4.53 4.7c-.16 0-.42.06-.64.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.7 4.19 3.68 2.07.82 2.49.66 2.94.62.45-.04 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01z" />
          )}
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {tooltip && !abierta && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setTooltip(false);
              abrir();
            }}
            className="fixed z-[60] cursor-pointer rounded-2xl bg-white px-4 py-3 text-sm font-medium text-tinta shadow-[var(--shadow-flotante)]"
            style={{ right: 92, bottom: 32, maxWidth: 220 }}
          >
            ¿Te ayudo con un precio?
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {abierta && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="burbuja-whatsapp-titulo"
            tabIndex={-1}
            initial={{ scale: 0.8, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 24, transition: { duration: 0.22 } }}
            transition={{ duration: 0.35, ease: EASE_SALIDA }}
            style={{
              transformOrigin: "bottom right",
              right: 20,
              bottom: "calc(96px + env(safe-area-inset-bottom))",
              width: "min(360px, calc(100vw - 24px))",
              maxHeight: "78svh",
            }}
            className="fixed z-[60] flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-flotante)] outline-none"
          >
            {/* Cabecera */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#075E54" }}>
              <Image src="/logo.png" width={38} height={38} alt="" className="rounded-full" />
              <div className="text-white">
                <p id="burbuja-whatsapp-titulo" className="text-sm font-semibold">
                  La bodega de la economía
                </p>
                <p className="text-xs" style={{ color: "#B8F0DA" }}>
                  Normalmente responde en minutos
                </p>
              </div>
            </div>

            {/* Cuerpo */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ background: "#ECE5DD" }}
            >
              {!mostrarMensaje ? (
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-tinta/40"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-tinta shadow-sm"
                >
                  <p>
                    ¡Hola! Somos <strong>La bodega de la economía</strong>, en Rancagua.
                    Vendemos paltas, limones y naranjas al por mayor y al detalle. Cuéntanos
                    qué necesitas y te respondemos altiro.
                  </p>
                  <p className="mt-1 text-right text-[10px] text-tinta-suave">{horaActual}</p>
                </motion.div>
              )}
            </div>

            {/* Formulario */}
            <form onSubmit={manejarEnvio} className="space-y-3 border-t border-tinta/10 bg-white p-4">
              {/* text-base (16px) en móvil a propósito: Safari en iOS hace
                  zoom sobre cualquier campo con fuente menor, y no vuelve a
                  alejarse solo. Desde sm: vuelve a 14px, que es el tamaño
                  con el que está diseñado el panel en escritorio. */}
              <input
                type="text"
                required
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-tinta/15 px-3 py-2.5 text-base outline-none focus:border-cyan-400 sm:text-sm"
              />

              <div className="grid grid-cols-3 gap-1.5">
                {ASUNTOS_WHATSAPP.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAsunto(a)}
                    className={
                      asunto === a
                        ? "flex min-h-11 items-center justify-center rounded-full bg-verde-600 px-2 text-xs font-semibold text-white"
                        : "flex min-h-11 items-center justify-center rounded-full border border-tinta/15 px-2 text-xs font-medium text-tinta-suave"
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                required
                rows={3}
                placeholder="Escribe tu mensaje..."
                value={mensaje}
                onChange={(e) => {
                  setMensaje(e.target.value);
                  autoRedimensionar();
                }}
                className="w-full resize-none rounded-xl border border-tinta/15 px-3 py-2.5 text-base outline-none focus:border-cyan-400 sm:text-sm"
              />

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
                style={{ background: "#25D366" }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
                </svg>
                Enviar por WhatsApp
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
