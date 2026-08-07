"use client";

import type { Ajustes } from "@prisma/client";
import { motion } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import CarruselFotos from "./CarruselFotos";
import { formatearTelefonoChile } from "@/lib/whatsapp";
import { linkMapa } from "@/lib/mapa";

type Props = { ajustes: Ajustes };

function galeriaDe(ajustes: Ajustes): string[] {
  try {
    const lista = JSON.parse(ajustes.galeria) as unknown;
    if (Array.isArray(lista) && lista.length > 0) {
      return lista.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // JSON inválido -> cae al respaldo
  }
  return ["/texturas/paltas.webp", "/texturas/limones.webp", "/texturas/naranjas.webp", "/logo.png"];
}

export default function Ubicacion({ ajustes }: Props) {
  const fotos = galeriaDe(ajustes);
  const mapaUrl = linkMapa(ajustes);

  return (
    <section
      id="ubicacion"
      className="relative overflow-hidden bg-verde-700 px-6 py-24 text-white md:px-10"
      style={{ colorScheme: "dark", contentVisibility: "auto", containIntrinsicSize: "1px 800px" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: "url(/texturas/paltas.webp)", mixBlendMode: "overlay" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-14 md:grid-cols-[0.45fr_0.55fr] md:gap-[56px]">
        <div className="order-2 md:order-1">
          <h2 className="font-titulo" style={{ fontSize: "var(--text-h2)", lineHeight: 1.05 }}>
            <TextoRevelado texto="Ven a vernos" modo="palabra" as="span" />
          </h2>

          <SeccionEntrada delay={0.1} className="mt-6 flex gap-3 rounded-2xl bg-white/10 p-5">
            <span aria-hidden="true" className="text-xl">📍</span>
            <div>
              <p className="font-semibold">{ajustes.nombreNegocio}</p>
              <p className="text-white/85">{ajustes.direccion}</p>
              <p className="text-white/85">{ajustes.ciudad}</p>
            </div>
          </SeccionEntrada>

          <SeccionEntrada delay={0.15}>
            <p className="mt-6 text-white/85" style={{ lineHeight: 1.6 }}>
              {ajustes.descripcion}
            </p>
          </SeccionEntrada>

          <SeccionEntrada delay={0.2} className="mt-5 flex items-center gap-3 text-white/85">
            <span aria-hidden="true">🕐</span>
            <span>{ajustes.horario}</span>
          </SeccionEntrada>

          <SeccionEntrada delay={0.25} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BotonLlamada telefono={ajustes.telefono1} />
            {ajustes.telefono2 && <BotonLlamada telefono={ajustes.telefono2} />}
          </SeccionEntrada>

          <SeccionEntrada delay={0.3}>
            <a
              href={mapaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              Cómo llegar →
            </a>
          </SeccionEntrada>
        </div>

        <div className="order-1 md:order-2">
          <CarruselFotos fotos={fotos} />
        </div>
      </div>
    </section>
  );
}

function BotonLlamada({ telefono }: { telefono: string }) {
  return (
    <motion.a
      href={`tel:${telefono.replace(/\s/g, "")}`}
      initial="reposo"
      whileTap="presionado"
      animate="reposo"
      className="relative flex min-h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-cyan-400 px-6 font-semibold text-verde-700"
      style={{ scale: 1 }}
      variants={{ reposo: { scale: 1 }, presionado: { scale: 0.97 } }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-white/50"
        variants={{ reposo: { scale: 0, opacity: 0 }, presionado: { scale: 1.8, opacity: [0.5, 0] } }}
        transition={{ duration: 0.5 }}
      />
      <span aria-hidden="true">📞</span>
      {formatearTelefonoChile(telefono)}
    </motion.a>
  );
}
