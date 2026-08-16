"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useEsMovil, useMovimientoReducido } from "@/lib/motion-config";

/**
 * Las escenas del fondo. Los archivos los genera
 * scripts/preparar-portada.py desde imagenes-bodega/.
 *
 * La primera es distinta en cada dispositivo a propósito: en el teléfono va
 * la foto vertical desde la calle, que llena mucho mejor una pantalla alta.
 * La segunda es la misma foto para los dos, recortada distinto: entera en
 * móvil, en franja 16:9 en escritorio.
 *
 * La tercera es la foto que en escritorio ya va de primera, así que solo
 * corre en móvil (`soloMovil`): repetirla en la misma vuelta se notaría.
 */
const ESCENAS = [
  {
    nombre: "principal",
    alt: "El galpón de La bodega de la economía abierto, con cajas de naranjas en la entrada",
    soloMovil: false,
  },
  {
    nombre: "secundaria",
    alt: "Interior del galpón, con cajas de naranjas apiladas y el montacargas al fondo",
    soloMovil: false,
  },
  {
    nombre: "tercera",
    alt: "El galpón de La bodega de la economía visto de frente desde la calle",
    soloMovil: true,
  },
] as const;

/** Cuánto se queda quieta cada foto antes de empezar a cambiar. */
const INTERVALO_MS = 5000;
/** Duración del cruce. Tiene que caber holgado dentro del intervalo o las
 * fotos nunca terminan de asentarse y el fondo queda en un barrido continuo. */
const CRUCE_S = 0.9;

/**
 * Fondo de la portada. Las fotos se montan todas a la vez, una encima de
 * otra, y lo único que se anima es la opacidad: montarlas y desmontarlas
 * haría que el navegador volviera a decodificar la imagen en cada vuelta, y
 * el parpadeo se nota justo en el cambio.
 *
 * Va con `<picture>` y no con next/image porque acá hace falta dirección de
 * arte: escritorio y móvil no son recortes distintos de la misma foto, son
 * fotos distintas. El navegador elige la fuente por media query antes de
 * pedir nada, así que baja un solo archivo y el LCP no depende de que
 * hidrate un hook de tamaño de pantalla. Los webp ya salen del script en su
 * medida final, así que el optimizador de Next no tendría nada que hacer.
 *
 * El hook de tamaño sí decide cuántas escenas giran, y eso no toca al LCP:
 * la escena que agrega es la última y, como se monta recién al hidratar,
 * en escritorio no se descarga nunca.
 *
 * `object-cover` + `object-center`: la foto llena la pantalla y se recorta
 * sola por donde sobra, siempre desde el centro. El único "zoom" es el que
 * hace falta para cubrir el viewport; encima de esta capa no hay ninguna
 * escala, que era lo que antes agrandaba la foto de más.
 */
export default function FondoPortada() {
  const esMovil = useEsMovil();
  const reducido = useMovimientoReducido();
  const [actual, setActual] = useState(0);
  // La primera escena es el LCP y va siempre. Las otras dos no hacen falta
  // para el primer pintado, así que su descarga se pospone hasta que la
  // página ya terminó de cargar del todo: no le compiten ancho de banda a
  // la foto que sí importa apenas se entra. El cruce recién arranca a los
  // 5s (INTERVALO_MS), que es tiempo de sobra para que esto ya esté listo.
  const [listas, setListas] = useState(false);

  const escenas = esMovil ? ESCENAS : ESCENAS.filter((e) => !e.soloMovil);
  const total = escenas.length;

  useEffect(() => {
    // Sin rama para "ya está complete": este componente monta pegado al
    // arranque de la página (va dentro del Hero), mucho antes de que el
    // evento `load` — que espera hasta la última imagen — pueda haber
    // disparado ya.
    const marcarListas = () => setListas(true);
    window.addEventListener("load", marcarListas);
    return () => window.removeEventListener("load", marcarListas);
  }, []);

  useEffect(() => {
    if (reducido || !listas) return;
    // Si el largo cambia (se hidrata el hook y aparece la tercera), el índice
    // podría quedar apuntando a una escena que ya no está.
    setActual((i) => i % total);
    const id = setInterval(() => setActual((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [reducido, listas, total]);

  return (
    <>
      {escenas.map((escena, i) => {
        // Las escenas 2 y 3 ni se montan hasta que `listas` es true: antes
        // de eso no hay nada que animar, la primera se queda quieta.
        if (i > 0 && !listas) return null;
        return (
          <motion.div
            key={escena.nombre}
            className="absolute inset-0"
            // `initial={false}` para que la primera foto ya esté visible en el
            // primer frame: si entrara animando, la portada arrancaría en verde.
            initial={false}
            animate={{ opacity: i === actual ? 1 : 0 }}
            transition={{ duration: CRUCE_S, ease: "easeInOut" }}
          >
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet={`/texturas/portada/${escena.nombre}-movil.webp`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/texturas/portada/${
                  escena.soloMovil ? `${escena.nombre}-movil` : escena.nombre
                }.webp`}
                alt={escena.alt}
                // La primera es el LCP y va con prioridad. Las otras tienen que
                // estar descargadas antes de que les toque el cambio, así que
                // también van en `eager`: en lazy dependerían de que dispare el
                // IntersectionObserver y aparecerían de golpe.
                fetchPriority={i === 0 ? "high" : "low"}
                loading="eager"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover object-center"
              />
            </picture>
          </motion.div>
        );
      })}
    </>
  );
}
