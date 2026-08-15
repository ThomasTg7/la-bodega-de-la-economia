"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Ajustes } from "@prisma/client";
import { motion } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import CarruselFotos from "./CarruselFotos";
import { formatearTelefonoChile } from "@/lib/whatsapp";
import { GALERIA_DEFECTO, parsearGaleria } from "@/lib/galeria";
import { RESORTE_UI } from "@/lib/motion-config";

type Props = { ajustes: Ajustes };

function galeriaDe(ajustes: Ajustes): string[] {
  const fotos = parsearGaleria(ajustes.galeria);
  return fotos.length > 0 ? fotos : [...GALERIA_DEFECTO];
}

/**
 * A dónde apunta el botón "Cómo llegar".
 *
 * Manda el link del panel si lo hay. Se exige http(s) a propósito: un valor a
 * medio pegar ("maps.app.goo.gl/xxx", "www.google.com/...") saldría como ruta
 * relativa del propio sitio y el botón llevaría a una página que no existe.
 * En ese caso vale más el link armado con la dirección, que siempre funciona.
 *
 * El de respaldo es de indicaciones, no de búsqueda: el botón dice "Cómo
 * llegar", así que abre Google Maps con la ruta ya trazada desde donde esté
 * la persona.
 */
function linkComoLlegar(ajustes: Ajustes): string {
  const propio = ajustes.mapaUrl.trim();
  if (/^https?:\/\//i.test(propio)) return propio;

  const destino = encodeURIComponent(`${ajustes.direccion}, ${ajustes.ciudad}, Chile`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
}

export default function QuienesSomos({ ajustes }: Props) {
  const fotos = galeriaDe(ajustes);
  const pistaRef = useRef<HTMLDivElement>(null);
  const telefonos = [ajustes.telefono1, ajustes.telefono2].filter(Boolean);
  const comoLlegar = linkComoLlegar(ajustes);

  return (
    <section
      id="nosotros"
      className="px-6 py-24 md:px-10"
      style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #E6FAF5 100%)" }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-16">
        {/* `contents` en móvil: el envoltorio desaparece de la caja y sus dos
            hijos pasan a ser celdas de la grilla, así el cartel puede meterse
            entre el texto de arriba y la ficha de abajo. En escritorio vuelve
            a ser un bloque y los dos quedan apilados en la columna izquierda,
            que es como estaban. */}
        <div className="contents md:block">
          <div className="order-1">
            <p className="flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-verde-500 uppercase">
              <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-naranja" />
              Quiénes somos
            </p>

            <h2
              className="mt-4 font-titulo text-verde-700"
              style={{ fontSize: "clamp(1.85rem, 4.6vw, 3.4rem)", lineHeight: 1.06 }}
            >
              <TextoRevelado texto="Una bodega, no un intermediario" modo="palabra" as="span" />
            </h2>

            {/* Único texto libre de la sección: sale entero de "Descripción del
              local" en el panel. Si se deja vacío, no queda un hueco. */}
            {ajustes.descripcion.trim() && (
              <SeccionEntrada delay={0.1}>
                <p
                  className="mt-6 whitespace-pre-line text-tinta-suave"
                  style={{ fontSize: "var(--text-cuerpo)", lineHeight: 1.65 }}
                >
                  {ajustes.descripcion}
                </p>
              </SeccionEntrada>
            )}
          </div>

          {/* Ficha de dirección: lo primero que busca alguien que quiere venir.
              En móvil va después del cartel: primero se ve el local, después
              el detalle de cómo llegar. */}
          <div className="order-3">
            <SeccionEntrada delay={0.15}>
              <div className="overflow-hidden rounded-2xl bg-verde-700 text-white shadow-[var(--shadow-media)] md:mt-9">
                <div className="flex flex-wrap items-center justify-between gap-5 p-6">
                  <div className="flex gap-3.5">
                    <IconoPin />
                    <div>
                      <p className="font-titulo" style={{ fontSize: 18, lineHeight: 1.25 }}>
                        {ajustes.direccion}
                      </p>
                      <p className="text-white/75">{ajustes.ciudad}</p>
                    </div>
                  </div>

                  <motion.a
                    href={comoLlegar}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, transition: { type: "spring", ...RESORTE_UI } }}
                    whileTap={{
                      y: -1,
                      scale: 0.985,
                      transition: { type: "spring", ...RESORTE_UI },
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-limon px-7 py-3.5 font-semibold text-verde-700 sm:w-auto"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 11l19-9-9 19-2-8-8-2Z" />
                    </svg>
                    Cómo llegar
                  </motion.a>
                </div>

                {/* El horario en su propia fila. Iba pegado a la ciudad con un
                    punto en medio ("Rancagua · Lunes a sábado de 9 a 20"), que
                    junta dos datos que no tienen nada que ver: uno ubica y el
                    otro dice cuándo venir. Suelto y con su reloj se lee de una
                    pasada, y en un teléfono ya no parte la línea por la mitad. */}
                {ajustes.horario.trim() && (
                  <div className="flex items-center gap-3 border-t border-white/15 px-6 py-4">
                    <IconoReloj />
                    <p className="text-white/85">{ajustes.horario}</p>
                  </div>
                )}

                {/* Los números viven en su propio riel: si no caben, se recortan
                  y se arrastran con el cursor o el dedo. */}
                <div
                  ref={pistaRef}
                  className="overflow-hidden border-t border-white/15 px-5 py-4"
                  style={{
                    maskImage:
                      "linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%)",
                  }}
                >
                  <motion.div
                    drag="x"
                    dragConstraints={pistaRef}
                    dragElastic={0.06}
                    dragMomentum={false}
                    className="flex w-max cursor-grab gap-2.5 active:cursor-grabbing"
                  >
                    {telefonos.map((telefono) => (
                      <a
                        key={telefono}
                        href={`tel:${telefono.replace(/\s/g, "")}`}
                        draggable={false}
                        className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white/20"
                      >
                        <IconoTelefono />
                        {formatearTelefonoChile(telefono)}
                      </a>
                    ))}
                  </motion.div>
                </div>
              </div>
            </SeccionEntrada>
          </div>
        </div>

        {/* Cartel: las fotos con el logo montado en la esquina. */}
        <SeccionEntrada delay={0.1} className="order-2">
          <div className="rounded-[18px] border border-tinta/10 bg-white p-4 shadow-[var(--shadow-media)] transition-transform duration-500 md:rotate-[1.2deg] md:hover:rotate-0">
            {/* El tope de 330px es el de móvil, donde el cartel comparte
                pantalla con todo lo demás. En escritorio vive en su propia
                columna y ahí lo que manda es el ancho de la columna: 480
                llena la de lg (544px menos el marco) sin tocar los bordes. */}
            <div className="relative mx-auto w-full max-w-[330px] md:max-w-[480px]">
              <CarruselFotos fotos={fotos} proporcion="3 / 4" anchoSlidePct={100} />
              <div className="pointer-events-none absolute top-3 right-3 z-20">
                <Image
                  src="/logo.webp"
                  alt={ajustes.nombreNegocio}
                  width={192}
                  height={192}
                  className="h-24 w-24 object-contain md:h-32 md:w-32"
                  style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,.6))" }}
                />
              </div>
            </div>
          </div>
        </SeccionEntrada>
      </div>
    </section>
  );
}

function IconoPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-limon"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-limon"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-limon"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
