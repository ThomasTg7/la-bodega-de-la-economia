/**
 * Nota musical de TikTok. El logo son tres copias de la misma silueta —
 * cian corrida a la izquierda, roja a la derecha y blanca encima — que es
 * como la marca arma su desfase de color. Sobre fondo negro se lee igual
 * que en la app.
 */
export default function IconoTikTok({ tamano = 18 }: { tamano?: number }) {
  const d =
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12v-3.2a5.8 5.8 0 0 0-.77-.05A5.79 5.79 0 0 0 4.07 15.4a5.79 5.79 0 0 0 5.79 5.79 5.79 5.79 0 0 0 5.79-5.79V9.01a7.35 7.35 0 0 0 4.29 1.38V7.3a4.28 4.28 0 0 1-3.34-1.48z";

  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={d} fill="#25F4EE" transform="translate(-1.1 -0.7)" />
      <path d={d} fill="#FE2C55" transform="translate(1.1 0.7)" />
      <path d={d} fill="#FFFFFF" />
    </svg>
  );
}
