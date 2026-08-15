"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import IconoTikTok from "./IconoTikTok";
import FondoPortada from "./FondoPortada";
import { useBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { REGION, TIKTOK_URL } from "@/lib/constantes";
import { embedMapa } from "@/lib/mapa";
import { ICONOS_SELLOS } from "@/lib/portada";
import { EASE_SALIDA, RESORTE_UI } from "@/lib/motion-config";

type Props = {
  /** Campo "Eslogan de la portada" del panel. */
  eslogan: string;
  /** Dirección exacta del local, tal como está en el panel. Va en la
   * tarjeta del mapa; la línea de arriba muestra ciudad y región. */
  direccion: string;
  ciudad: string;
  /** Los tres sellos, ya resueltos con parsearSellos(). */
  sellos: string[];
  /** Ya resuelto con linkMapa(): el link del panel o la ficha de Google. */
  mapaUrl: string;
};


export default function Hero({ eslogan, direccion, ciudad, sellos, mapaUrl }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const { abrir } = useBurbujaWhatsApp();

  // El fondo se queda atrás mientras el contenido sube: el parallax nace del
  // propio scroll de la portada, no de una capa genérica.
  const { scrollYProgress: progresoHero } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const yTexto = useTransform(progresoHero, [0, 0.8], [0, -120]);
  const opacidadTexto = useTransform(progresoHero, [0, 0.75], [1, 0]);
  const yMapa = useTransform(progresoHero, [0, 1], [0, -180]);

  const { scrollY } = useScroll();
  const opacidadIndicador = useTransform(scrollY, [0, 120], [1, 0]);

  return (
    <section
      ref={heroRef}
      id="portada"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-verde-700"
    >
      {/* z0 — fotos del local a sangre, cruzándose entre ellas. Sin parallax
          ni escala: el único recorte tiene que ser el que hace object-cover
          para llenar la pantalla. Una escala acá se le sumaría encima y la
          foto volvería a verse agrandada. */}
      <div className="absolute inset-0 z-0">
        <FondoPortada />
      </div>

      {/* z1 — velo verde: el texto blanco tiene que leerse sí o sí.
          Son dos, y tienen que serlo: en escritorio el texto vive en la mitad
          izquierda, así que el velo puede ser denso ahí y soltar la foto a la
          derecha. En un teléfono el texto cruza todo el ancho, no hay lado
          libre, y ese mismo degradado tapa la foto entera. El de móvil baja
          la carga pareja y se apoya en la sombra del título para el
          contraste. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] md:hidden"
        style={{
          background:
            "linear-gradient(105deg, rgba(1,69,43,.72) 0%, rgba(1,69,43,.58) 45%, rgba(1,69,43,.34) 100%), linear-gradient(to top, rgba(1,69,43,.78) 0%, transparent 45%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        style={{
          background:
            "linear-gradient(105deg, rgba(1,69,43,.95) 0%, rgba(1,69,43,.82) 45%, rgba(1,69,43,.42) 100%), linear-gradient(to top, rgba(1,69,43,.92) 0%, transparent 40%)",
        }}
      />

      {/* El nav flotante recién aparece pasado el 70% de la portada, así que
          arriba no hay nada que esquivar: el respiro alcanza con la mitad de
          lo que había y el bloque de texto arranca mucho más arriba. */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-x-12 gap-y-5 px-6 pt-7 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-stretch md:gap-y-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:px-10 md:pt-14 md:pb-20">
        {/* Bloque de texto */}
        <motion.div style={{ y: yTexto, opacity: opacidadTexto }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_SALIDA }}
            className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.16em] text-limon uppercase sm:text-xs lg:text-sm"
          >
            <motion.span
              aria-hidden="true"
              className="h-[3px] shrink-0 rounded-full bg-naranja"
              initial={{ width: 0 }}
              animate={{ width: 28 }}
              transition={{ duration: 0.6, ease: EASE_SALIDA, delay: 0.2 }}
            />
            {direccion} · {ciudad}, {REGION}
          </motion.p>

          {/* Cortes de línea fijos: TextoRevelado parte el texto en cajas
              inline-block, así que un salto automático rompería palabras. */}
          {/* Dos escalas distintas, y tienen que serlo: en móvil el título
              ocupa el ancho completo de la pantalla, en escritorio vive
              dentro de una columna que es apenas el 60% del contenido, así
              que un mismo vw no puede servir a los dos.

              Móvil — el piso se probó hasta romper: "LA BODEGA" empieza a
              partirse en dos líneas por sobre ~57px en un iPhone de 414px, y
              por sobre ~49px en uno de 360px. El punto de quiebre está
              siempre cerca del 13.9% del ancho de pantalla; 13.6vw es lo más
              grande que cabe con margen en los tres anchos probados
              (360/375/414) sin partirse.

              Escritorio — medido en el navegador: "LA BODEGA" mide 6.36px de
              ancho por cada px de tamaño de fuente. En lg la columna
              izquierda queda en 691px a 1440, así que el techo de 6.5rem
              (104px → 641px) entra con holgura. El tramo md (768–1023) va
              aparte y más chico: ahí la columna cae a ~337px y con el vw de
              lg el título se partía. */}
          <h1
            className="mt-4 font-titulo text-[clamp(2.6rem,13.6vw,5.5rem)] md:mt-5 text-white md:text-[clamp(2.6rem,5.4vw,4rem)] lg:text-[clamp(3rem,7vw,6.5rem)]"
            style={{
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

          {eslogan.trim() && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_SALIDA, delay: 0.5 }}
              className="mt-5 text-[length:var(--text-cuerpo)] text-white/85 md:mt-6 md:text-[1.05rem] lg:text-[1.3rem]"
              style={{ lineHeight: 1.6, maxWidth: "42ch" }}
            >
              {eslogan}
            </motion.p>
          )}
        </motion.div>

        {/* Mapa del local: el pin de Google sobre la ficha real, dentro de
            un marco que hace juego con la portada. Encima del iframe va una
            capa transparente que se lleva el click: así tocar el mapa en un
            teléfono abre la app de mapas en vez de quedar peleando con el
            zoom de Google dentro de la página. */}
        {/* En escritorio la tarjeta cruza las tres filas de la izquierda
            (texto, botones, sellos). Antes ocupaba solo la primera y las
            otras dos quedaban como un hueco vacío al lado del mapa. */}
        <motion.aside
          style={{ y: yMapa }}
          // El `py` de móvil no es un respiro cualquiera: devuelve el alto
          // que se le sacó al mapa, así que los botones se quedan donde
          // estaban y lo que se libera queda como franja limpia de foto. Va
          // repartido en partes iguales arriba y abajo para que la tarjeta
          // quede con el mismo aire contra el eslogan que contra los botones.
          //
          // Va en svh y no en px para que esa franja sea lo primero que ceda
          // en una pantalla corta: en un teléfono de 740px de alto vale 30 por
          // lado y el bloque entero sigue entrando, en uno de 844 vale 34 y se
          // ve más foto. Con un valor fijo, los teléfonos chicos se pasaban de
          // largo justo por esos 16px.
          className="relative mx-auto w-full max-w-[300px] py-[4svh] sm:py-0 md:mx-0 md:max-w-none lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:ml-auto lg:flex lg:max-w-[425px] lg:items-center"
        >
          {/* La entrada va en su propia capa: el `y` de la tarjeta es el del
              parallax de scroll, y dos animaciones sobre el mismo eje en el
              mismo elemento se pisan. */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE_SALIDA, delay: 0.45 }}
            className="w-full overflow-hidden rounded-[24px] bg-white/10 p-2 backdrop-blur-sm"
            style={{
              boxShadow: "0 30px 64px rgba(0,0,0,.45)",
              border: "1px solid rgba(255,255,255,.22)",
            }}
          >
            <div className="relative overflow-hidden rounded-[17px] bg-verde-700">
              <iframe
                src={embedMapa()}
                title="Mapa de La bodega de la economía"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[140px] w-full border-0 sm:h-[290px] md:h-[320px] lg:h-[400px]"
              />

              <a
                href={mapaUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir la ubicación en Google Maps"
                className="absolute inset-0"
              />
            </div>

            {/* El nombre del local ya está gritado en el h1 de al lado: acá
                solo va la dirección y el botón que abre Maps de verdad. */}
            <motion.a
              href={mapaUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", ...RESORTE_UI }}
              className="mt-2 flex items-center gap-3 rounded-[17px] bg-white/12 px-3 py-3 text-left"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-naranja text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Abrir Google Maps</span>
                <span className="block truncate text-xs text-white/70">
                  {direccion}
                </span>
              </span>
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
                className="shrink-0 text-white/60"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </motion.a>
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
            className="justify-center gap-2 bg-[#25D366] px-5 py-3.5 text-sm text-white shadow-[0_12px_32px_rgba(37,211,102,.32)] sm:px-8 sm:py-4 sm:text-base lg:px-9 lg:py-[1.15rem] lg:text-lg"
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
            href={TIKTOK_URL}
            externo
            delay={0.78}
            className="justify-center gap-2 bg-[#010101] px-5 py-3.5 text-sm text-white shadow-[0_12px_32px_rgba(254,44,85,.28)] sm:px-8 sm:py-4 sm:text-base lg:px-9 lg:py-[1.15rem] lg:text-lg"
          >
            <IconoTikTok />
            Ver TikTok
          </BotonSuave>

        </motion.div>

        <motion.div
          style={{ y: yTexto, opacity: opacidadTexto }}
          initial="oculto"
          animate="visible"
          variants={{ visible: { transition: { delayChildren: 1, staggerChildren: 0.12 } } }}
          className="flex flex-wrap justify-center gap-x-7 gap-y-3 border-t border-white/20 pt-6 md:col-start-1 md:row-start-3 md:justify-start"
        >
          {sellos.map((texto, i) => (
            <motion.span
              key={texto}
              variants={{
                oculto: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SALIDA } },
              }}
              className="flex items-center gap-2 text-sm font-medium text-white/85 lg:text-base"
            >
              <IconoSello nombre={ICONOS_SELLOS[i] ?? "check"} />
              {texto}
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
 * Botón de la portada. Entra con resorte —sube, se pasa un poco de tamaño y
 * se acomoda— y justo después le cruza un destello de lado a lado, que es lo
 * que hace que el ojo caiga ahí. El hover y el tap también van con resorte:
 * la diferencia entre que se sienta suave o brusco está en no usar duración
 * fija para nada de esto.
 */
function BotonSuave({
  como,
  href,
  externo = false,
  onClick,
  delay,
  className = "",
  children,
}: {
  como: "a" | "button";
  href?: string;
  /** Abre en pestaña nueva. Para los anclas internas (#seccion) va en false. */
  externo?: boolean;
  onClick?: () => void;
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  const comun = {
    initial: { opacity: 0, y: 22, scale: 0.86 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      delay,
      type: "spring" as const,
      stiffness: 420,
      damping: 17,
      mass: 0.7,
      opacity: { duration: 0.35, ease: EASE_SALIDA, delay },
    },
    className: `relative isolate flex items-center overflow-hidden rounded-full font-semibold ${className}`,
  };
  const resorte = { type: "spring" as const, ...RESORTE_UI };
  const encima = { y: -4, transition: resorte };
  const tocado = { y: -1, scale: 0.985, transition: resorte };

  // El destello es un gradiente angosto que barre el botón una sola vez,
  // apenas termina de asentarse el resorte. `x` en porcentaje para que la
  // pasada dure lo mismo en el botón corto de móvil y en el largo de
  // escritorio.
  const destello = (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 -z-10 w-1/2"
      style={{
        background:
          "linear-gradient(100deg, transparent 0%, rgba(255,255,255,.45) 50%, transparent 100%)",
      }}
      initial={{ x: "-160%" }}
      animate={{ x: "320%" }}
      transition={{ duration: 0.9, ease: EASE_SALIDA, delay: delay + 0.35 }}
    />
  );

  if (como === "a") {
    return (
      <motion.a
        href={href}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...comun}
        whileHover={encima}
        whileTap={tocado}
      >
        {destello}
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} {...comun} whileHover={encima} whileTap={tocado}>
      {destello}
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
