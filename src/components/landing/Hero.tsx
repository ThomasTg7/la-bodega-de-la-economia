"use client";

import { useRef } from "react";
import Image from "next/image";
import type { Producto } from "@prisma/client";
import { motion, useScroll, useTransform } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import NumeroEscrito from "@/components/motion/NumeroEscrito";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { clp } from "@/lib/precios";
import { DIMENSIONES_RECORTE, DIMENSION_RECORTE_DEFECTO } from "@/lib/constantes";
import { EASE_SALIDA, EASE_REBOTE, RESORTE_UI, useEsMovil } from "@/lib/motion-config";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";

type Props = {
  productoDestacado: Producto | null;
};

const SELLOS = [
  { icono: "camion", texto: "Te lo llevamos a tu local" },
  { icono: "check", texto: "Al por mayor y al detalle" },
  { icono: "hoja", texto: "Directo del productor" },
];

// Guion de entrada de la pizarra, en segundos. Está acá arriba porque el
// orden importa: primero cuelga el tablero, después cae la palta, al final
// se escribe el precio. Mover un número descoloca toda la escena.
const T = {
  tablero: 0.45,
  vaiven: 1.2,
  etiqueta: 1.5,
  palta: 1.6,
  nombre: 1.95,
  precio: 2.15,
};

export default function Hero({ productoDestacado }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const { abrir } = useBurbujaWhatsApp();
  const esMovil = useEsMovil();

  // El fondo se queda atrás mientras el contenido sube: el parallax nace del
  // propio scroll de la portada, no de una capa genérica.
  const { scrollYProgress: progresoHero } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const yFondo = useTransform(progresoHero, [0, 1], ["0%", "26%"]);
  const escalaFondo = useTransform(progresoHero, [0, 1], [1.16, 1.3]);
  const yTexto = useTransform(progresoHero, [0, 0.8], [0, -120]);
  const opacidadTexto = useTransform(progresoHero, [0, 0.75], [1, 0]);
  const yPizarra = useTransform(progresoHero, [0, 1], [0, -220]);
  const rotarPizarra = useTransform(progresoHero, [0, 1], [0, 6]);

  const { scrollY } = useScroll();
  const opacidadIndicador = useTransform(scrollY, [0, 120], [1, 0]);

  const precioMayor = productoDestacado?.precioMayorista ?? null;
  const recorte = productoDestacado?.imagenRecorte || "/recortes/palta.png";
  const dim =
    DIMENSIONES_RECORTE[productoDestacado?.slug ?? ""] ?? DIMENSION_RECORTE_DEFECTO;

  return (
    <section
      ref={heroRef}
      id="portada"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-verde-700"
    >
      {/* z0 — foto de bodega a sangre: se aleja y crece al hacer scroll */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: yFondo, scale: escalaFondo }}
      >
        <Image
          src="/texturas/paltas.webp"
          alt="Paltas Hass a granel en la bodega"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_TEXTURAS.paltas}
          className="object-cover"
        />
      </motion.div>

      {/* z1 — velo verde: el texto blanco tiene que leerse sí o sí */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(105deg, rgba(1,69,43,.95) 0%, rgba(1,69,43,.82) 45%, rgba(1,69,43,.42) 100%), linear-gradient(to top, rgba(1,69,43,.92) 0%, transparent 40%)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-x-12 gap-y-8 px-6 pt-24 pb-20 md:grid-cols-[1.1fr_0.9fr] md:gap-y-6 md:px-10 md:pt-28 md:pb-24">
        {/* Bloque de texto */}
        <motion.div style={{ y: yTexto, opacity: opacidadTexto }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SALIDA }}
            className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.18em] text-limon uppercase sm:text-xs"
          >
            <motion.span
              aria-hidden="true"
              className="h-[3px] rounded-full bg-naranja"
              initial={{ width: 0 }}
              animate={{ width: 28 }}
              transition={{ duration: 0.6, ease: EASE_SALIDA, delay: 0.2 }}
            />
            Rancagua · Región de O&apos;Higgins
          </motion.p>

          {/* Cortes de línea fijos: TextoRevelado parte el texto en cajas
              inline-block, así que un salto automático rompería palabras. */}
          <h1
            className="mt-5 font-titulo text-white"
            style={{
              fontSize: "clamp(2.6rem, 5.6vw, 5.5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              textShadow: "0 4px 30px rgba(0,0,0,.35)",
            }}
          >
            <span className="block">
              <TextoRevelado texto="LA BODEGA" modo="caracter" as="span" arranque="carga" />
            </span>
            <span className="block">
              <TextoRevelado
                texto="DE LA"
                modo="caracter"
                as="span"
                arranque="carga"
                delayInicial={9 * 0.035}
              />
            </span>
            <span className="block">
              <TextoRevelado
                texto="ECONOMÍA"
                modo="caracter"
                as="span"
                arranque="carga"
                delayInicial={14 * 0.035}
                className="text-cyan-400"
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_SALIDA, delay: 0.5 }}
            className="mt-6 text-white/85"
            style={{ fontSize: "var(--text-cuerpo)", lineHeight: 1.6, maxWidth: "46ch" }}
          >
            De un emprendimiento local a los locales de la zona. Háblanos cuando quieras y
            te hacemos llegar tus productos.
          </motion.p>
        </motion.div>

        {/* Pizarra colgada: una palta y el precio por kilo. Nada más. */}
        <motion.aside
          style={{ y: yPizarra, rotate: rotarPizarra }}
          className="relative mx-auto w-full max-w-[360px] md:mx-0 md:ml-auto md:max-w-[380px]"
        >
          {/* Capa 1 — el tablero baja y queda colgando de los dos tornillos */}
          <motion.div
            initial={{ opacity: 0, y: -70, rotateX: -62 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.95, ease: EASE_SALIDA, delay: T.tablero }}
            style={{ transformPerspective: 1000, transformOrigin: "top center" }}
          >
            {/* Capa 2 — vaivén de péndulo hasta quedar apenas torcida */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: esMovil ? [0, -3, 1.6, -0.8, 0] : [0, -7, 4, -2.4, 1.2, -1.6] }}
              transition={{ duration: 1.9, ease: "easeOut", delay: T.vaiven }}
              style={{ transformOrigin: "top center" }}
            >
              {/* Marco de madera */}
              <div
                className="relative rounded-[12px] p-[11px]"
                style={{
                  background:
                    "repeating-linear-gradient(96deg, #7a5230 0 5px, #6b4a2b 5px 11px, #835a35 11px 16px)",
                  boxShadow:
                    "0 30px 64px rgba(0,0,0,.55), 0 4px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.14)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-[13px] left-6 h-3 w-3 rounded-full bg-[#cfd3d6] shadow-[0_2px_4px_rgba(0,0,0,.6)]"
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-[13px] right-6 h-3 w-3 rounded-full bg-[#cfd3d6] shadow-[0_2px_4px_rgba(0,0,0,.6)]"
                />

                {/* Tablero de tiza */}
                <div
                  className="relative overflow-hidden rounded-[5px] px-6 pt-7 pb-6 text-center sm:px-7"
                  style={{
                    background: "linear-gradient(158deg, #1a3a2f 0%, #0c1e18 55%, #142d25 100%)",
                    boxShadow: "inset 0 0 70px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,255,255,.05)",
                  }}
                >
                  {/* Polvo de tiza: manchones y rayado del paño */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 40% at 22% 18%, rgba(255,255,255,.07), transparent 70%), radial-gradient(ellipse 50% 35% at 78% 72%, rgba(255,255,255,.05), transparent 70%), repeating-linear-gradient(102deg, rgba(255,255,255,.035) 0 1px, transparent 1px 7px)",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[7px] rounded-[3px] border border-dashed border-white/20"
                  />

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_SALIDA, delay: T.etiqueta }}
                    className="relative text-[0.68rem] font-bold tracking-[0.18em] text-limon uppercase"
                  >
                    Precio por mayor
                  </motion.p>

                  {/* La palta vive dentro del tablero: cae desde arriba y
                      después se queda flotando en su sitio. */}
                  <motion.div
                    initial={{ opacity: 0, y: -70, scale: 0.65, rotate: -24 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: -6 }}
                    transition={{ duration: 0.9, ease: EASE_REBOTE, delay: T.palta }}
                    className="relative mt-4 flex justify-center"
                  >
                    <motion.div
                      animate={{ y: [0, -9, 0], rotate: [0, 1.6, 0] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: T.palta + 1,
                      }}
                    >
                      <Image
                        src={recorte}
                        alt={productoDestacado?.nombre ?? "Palta"}
                        width={dim.w}
                        height={dim.h}
                        priority
                        className="w-auto select-none"
                        style={{
                          height: "clamp(148px, 20vw, 210px)",
                          filter: "drop-shadow(0 18px 24px rgba(0,0,0,.6))",
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_SALIDA, delay: T.nombre }}
                    className="relative mt-4 font-titulo text-white"
                    style={{ fontSize: "1.4rem", lineHeight: 1.2 }}
                  >
                    {productoDestacado?.nombre ?? "Palta Hass"}
                  </motion.p>

                  {precioMayor != null ? (
                    <p className="relative mt-2 flex items-baseline justify-center gap-2">
                      <NumeroEscrito
                        texto={clp(precioMayor)}
                        delay={T.precio}
                        velocidad={95}
                        className="font-titulo text-limon"
                        style={{
                          fontSize: "clamp(2.6rem, 7vw, 3.8rem)",
                          lineHeight: 0.95,
                          fontVariantNumeric: "tabular-nums",
                          textShadow: "0 0 18px rgba(245,205,7,.35)",
                        }}
                      />
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: T.precio + clp(precioMayor).length * 0.095 }}
                        className="text-base font-semibold text-white/70"
                      >
                        el kilo
                      </motion.span>
                    </p>
                  ) : (
                    <p className="relative mt-3 text-white/70">Consulta el precio del día</p>
                  )}

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: T.precio + 1 }}
                    className="relative mt-5 border-t border-dashed border-white/15 pt-4 text-xs text-white/55"
                  >
                    El precio está sujeto a variaciones.
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.aside>

        {/* Botones y sellos van después de la pizarra. En escritorio los
            devuelvo a la columna izquierda, bajo el texto. */}
        <motion.div
          style={{ y: yTexto, opacity: opacidadTexto }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 md:col-start-1 md:row-start-2 md:justify-start"
        >
          <BotonSuave
            como="button"
            onClick={() => abrir()}
            delay={0.72}
            className="justify-center gap-2 bg-[#25D366] px-5 py-3.5 text-sm text-white shadow-[0_12px_32px_rgba(37,211,102,.32)] sm:px-8 sm:py-4 sm:text-base"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.82c0 4.55-3.7 8.25-8.25 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.19-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.55 3.71-8.23 8.26-8.23zm-4.53 4.7c-.16 0-.42.06-.64.31-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.7 2.7 4.19 3.68 2.07.82 2.49.66 2.94.62.45-.04 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.35-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.42-.55-.42-.14-.01-.3-.01-.46-.01z" />
            </svg>
            <span className="sm:hidden">Escríbenos</span>
            <span className="hidden sm:inline">Escríbenos por WhatsApp</span>
          </BotonSuave>

          <BotonSuave
            como="a"
            href="#catalogo"
            delay={0.8}
            className="justify-center border-2 border-white/50 px-5 py-3.5 text-sm text-white sm:px-8 sm:py-4 sm:text-base"
          >
            Ver productos
          </BotonSuave>
        </motion.div>

        <motion.div
          style={{ y: yTexto, opacity: opacidadTexto }}
          initial="oculto"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 1, staggerChildren: 0.12 } } }}
          className="flex flex-wrap justify-center gap-x-7 gap-y-3 border-t border-white/20 pt-6 md:col-start-1 md:row-start-3 md:justify-start"
        >
          {SELLOS.map((sello) => (
            <motion.span
              key={sello.texto}
              variants={{
                oculto: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
              }}
              className="flex items-center gap-2 text-sm font-medium text-white/85"
            >
              <IconoSello nombre={sello.icono} />
              {sello.texto}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        style={{ opacity: opacidadIndicador }}
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="text-xs font-medium tracking-[0.2em] text-white/60">DESLIZA</span>
        <div className="relative h-10 w-px overflow-hidden bg-white/25">
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-3 w-px bg-limon"
          />
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Botón de la portada. El hover y el tap van con resorte en vez de un salto
 * de escala: la diferencia entre que se sienta suave o brusco está acá.
 */
function BotonSuave({
  como,
  href,
  onClick,
  delay,
  className = "",
  children,
}: {
  como: "a" | "button";
  href?: string;
  onClick?: () => void;
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  const comun = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_SALIDA, delay },
    className: `flex items-center rounded-full font-semibold ${className}`,
  };
  const resorte = { type: "spring" as const, ...RESORTE_UI };
  const encima = { y: -4, transition: resorte };
  const tocado = { y: -1, scale: 0.985, transition: resorte };

  if (como === "a") {
    return (
      <motion.a href={href} {...comun} whileHover={encima} whileTap={tocado}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} {...comun} whileHover={encima} whileTap={tocado}>
      {children}
    </motion.button>
  );
}

function IconoSello({ nombre }: { nombre: string }) {
  const comun = {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "shrink-0 text-limon",
  };

  if (nombre === "camion") {
    return (
      <svg {...comun}>
        <path d="M10 17h4V5H2v12h3m5 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m-9 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M14 9h4l4 4v4h-2m0 0a2 2 0 1 1-4 0" />
      </svg>
    );
  }
  if (nombre === "hoja") {
    return (
      <svg {...comun}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    );
  }
  return (
    <svg {...comun}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
