"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { EASE_SALIDA, RESORTE_UI } from "@/lib/motion-config";

const PASOS = [
  {
    titulo: "Nos escribes",
    texto:
      "Por WhatsApp o por el formulario. Nos dices qué producto necesitas y cuántos kilos.",
  },
  {
    titulo: "Te cotizamos",
    texto:
      "Te confirmamos el precio del día por kilo, lo que hay disponible y cuándo lo tienes.",
  },
  {
    titulo: "Confirmas el pedido",
    texto: "Transferencia o efectivo en la bodega, como te acomode.",
  },
  {
    titulo: "Despachas en nuestra bodega",
    texto: "Pasas a buscar tu pedido ya preparado, en Malleco #04, Cooperativa La Cruz.",
  },
];

export default function Pasos() {
  const rejillaRef = useRef<HTMLDivElement>(null);
  const enVista = useInView(rejillaRef, { once: true, margin: "0px 0px -10% 0px", amount: 0.1 });
  const [respaldo, setRespaldo] = useState(false);

  // Mismo seguro que en el resto: si el observador no dispara, las tarjetas
  // se quedan en opacity 0 y la sección aparece vacía.
  useEffect(() => {
    if (enVista || respaldo) return;
    const id = setInterval(() => {
      const el = rejillaRef.current;
      if (!el) return;
      const caja = el.getBoundingClientRect();
      if (caja.top < window.innerHeight * 1.05 && caja.bottom > 0) {
        setRespaldo(true);
        clearInterval(id);
      }
    }, 700);
    return () => clearInterval(id);
  }, [enVista, respaldo]);

  const visible = enVista || respaldo;

  return (
    <section id="comprar" className="px-6 py-24 md:px-10" style={{ background: "#E6FAF5" }}>
      <div className="mx-auto max-w-7xl">
        <SeccionEntrada>
          <p className="flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-verde-500 uppercase">
            <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-naranja" />
            Cómo comprar
          </p>
          <h2
            className="mt-4 font-titulo text-verde-700"
            style={{ fontSize: "clamp(1.85rem, 4.6vw, 3.4rem)", lineHeight: 1.06 }}
          >
            <TextoRevelado texto="Cuatro pasos y obtén nuestros productos" modo="palabra" as="span" />
          </h2>
        </SeccionEntrada>

        <motion.div
          ref={rejillaRef}
          initial="oculto"
          animate={visible ? "visible" : "oculto"}
          variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
          className="mt-12 grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}
        >
          {PASOS.map((paso, i) => (
            <motion.div
              key={paso.titulo}
              variants={{
                oculto: { opacity: 0, y: 48, scale: 0.94, rotateX: -14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotateX: 0,
                  transition: { duration: 0.7, ease: EASE_SALIDA },
                },
              }}
              whileHover="encima"
              style={{ transformPerspective: 900 }}
              className="group relative h-full overflow-hidden rounded-[18px] border border-tinta/10 bg-white p-7"
            >
              {/* Barrido de color que entra desde abajo al pasar el cursor */}
              <motion.span
                aria-hidden="true"
                variants={{
                  oculto: { scaleY: 0 },
                  visible: { scaleY: 0 },
                  encima: { scaleY: 1, transition: { duration: 0.45, ease: EASE_SALIDA } },
                }}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 origin-bottom bg-cyan-400"
              />

              <span
                aria-hidden="true"
                className="absolute top-4 right-5 font-titulo text-cyan-200"
                style={{ fontSize: 40, lineHeight: 1 }}
              >
                0{i + 1}
              </span>

              <motion.div
                variants={{
                  encima: { y: -8, transition: { type: "spring", ...RESORTE_UI } },
                }}
              >
                <h3
                  className="pr-12 font-titulo text-verde-700"
                  style={{ fontSize: 20, lineHeight: 1.25 }}
                >
                  {paso.titulo}
                </h3>
                <p className="mt-3 text-sm text-tinta-suave" style={{ lineHeight: 1.6 }}>
                  {paso.texto}
                </p>
              </motion.div>

              <motion.span
                aria-hidden="true"
                variants={{
                  encima: {
                    boxShadow: "var(--shadow-flotante)",
                    transition: { duration: 0.35 },
                  },
                }}
                className="pointer-events-none absolute inset-0 rounded-[18px]"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
