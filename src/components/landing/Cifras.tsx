"use client";

import { useEffect, useRef, useState } from "react";
import type { Producto } from "@prisma/client";
import { animate, useInView } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import { BLUR_TEXTURAS } from "@/lib/blur-placeholders";
import { useMovimientoReducido } from "@/lib/motion-config";
import FranjaParallax from "./FranjaParallax";

type Props = { productos: Producto[] };

type Cifra = { valor: number; sufijo?: string; texto: string };

export default function Cifras({ productos }: Props) {
  const umbralMinimo = productos.reduce(
    (min, p) => Math.min(min, p.umbralMayorista),
    productos[0]?.umbralMayorista ?? 10
  );

  // EDITAR: las dos cifras fijas (horas de despacho y días abiertos) son las
  // únicas que no salen de la base de datos. Ajústalas si cambian.
  const cifras: Cifra[] = [
    { valor: productos.length, texto: "líneas de fruta seleccionadas" },
    { valor: 24, sufijo: " h", texto: "desde el pedido al despacho" },
    { valor: umbralMinimo, sufijo: " kg", texto: "para acceder al precio por mayor" },
    { valor: 6, texto: "días a la semana abiertos" },
  ];

  return (
    <FranjaParallax
      imagen="/texturas/naranjas.webp"
      blurDataURL={BLUR_TEXTURAS.naranjas}
      profundidad={0.38}
      velo={0.62}
      className="py-28"
    >
      <p className="flex items-center justify-center gap-3 text-xs font-bold tracking-[0.18em] text-limon uppercase">
        <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-naranja" />
        En números
      </p>

      <h2
        className="mt-4 font-titulo text-white"
        style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)", lineHeight: 1.02 }}
      >
        <TextoRevelado texto="Lo que movemos" modo="palabra" as="span" />
      </h2>

      <div
        className="mt-12 grid gap-10"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {cifras.map((cifra) => (
          <Contador key={cifra.texto} {...cifra} />
        ))}
      </div>
    </FranjaParallax>
  );
}

function Contador({ valor, sufijo = "", texto }: Cifra) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { once: true, margin: "-20% 0px" });
  const reducido = useMovimientoReducido();
  const [contado, setContado] = useState(0);

  useEffect(() => {
    if (!enVista || reducido) return;
    const controls = animate(0, valor, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setContado(Math.round(v)),
    });
    return () => controls.stop();
  }, [enVista, reducido, valor]);

  // Con movimiento reducido no hay conteo: el número sale directo.
  const mostrado = reducido ? valor : contado;

  return (
    <div ref={ref}>
      <p
        className="font-titulo text-limon"
        style={{
          fontSize: "clamp(2.6rem, 5vw, 3.8rem)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {mostrado}
        {sufijo}
      </p>
      <p className="mt-2 text-white/85">{texto}</p>
    </div>
  );
}
