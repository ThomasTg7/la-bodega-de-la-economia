"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { RESORTE_SCROLL } from "@/lib/motion-config";

const FRUTAS = [
  { src: "/recortes/limon.png", left: "20%", size: 44 },
  { src: "/recortes/naranja.png", left: "50%", size: 50 },
  { src: "/recortes/palta.png", left: "78%", size: 38 },
];

/** Transición ondulada entre el hero y el catálogo — evita el corte seco. */
export default function TransicionOnda() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const suave = useSpring(scrollYProgress, RESORTE_SCROLL);
  const x = useTransform(suave, [0, 1], ["-60px", "60px"]);
  const rotacion = useTransform(suave, [0, 1], [0, 180]);

  return (
    <div ref={ref} className="relative h-[180px] overflow-hidden bg-white" aria-hidden="true">
      <motion.svg
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ x }}
      >
        <path
          d="M0,90 C240,180 480,0 720,60 C960,120 1200,20 1440,90 L1440,180 L0,180 Z"
          fill="var(--color-cyan-100)"
        />
      </motion.svg>

      {FRUTAS.map((fruta) => (
        <motion.div
          key={fruta.src}
          className="absolute top-1/2"
          style={{ left: fruta.left, y: "-50%", rotate: rotacion }}
        >
          <Image
            src={fruta.src}
            alt=""
            width={fruta.size}
            height={fruta.size}
            style={{ width: fruta.size, height: "auto" }}
          />
        </motion.div>
      ))}
    </div>
  );
}
