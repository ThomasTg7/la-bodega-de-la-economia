import type { Producto } from "@prisma/client";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import TarjetaProducto from "./TarjetaProducto";
import { PEDIDO_MINIMO_KG } from "@/lib/constantes";

type Props = {
  productos: Producto[];
  /** Titulo y bajada de la seccion, editables desde el panel. */
  titulo: string;
  bajada: string;
};

export default function Catalogo({ productos, titulo, bajada }: Props) {
  return (
    <section
      id="catalogo"
      className="bg-white px-6 py-24 md:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <SeccionEntrada className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-verde-500 uppercase">
              <span aria-hidden="true" className="h-[3px] w-7 rounded-full bg-naranja" />
              Lo que sale de la bodega
            </p>
            <h2
              className="mt-4 font-titulo text-verde-700"
              style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)", lineHeight: 1.02 }}
            >
              <TextoRevelado texto={titulo} modo="palabra" as="span" />
            </h2>
          </div>
          <div className="max-w-[46ch]">
            <p className="text-tinta-suave" style={{ fontSize: "var(--text-cuerpo)" }}>
              {bajada}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-verde-700 px-4 py-2 text-sm font-semibold text-white">
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
                <path d="M20 10c0-4-3-7-8-7s-8 3-8 7" />
                <path d="M3 10h18l-1.5 10.5a1.5 1.5 0 0 1-1.5 1.3H6a1.5 1.5 0 0 1-1.5-1.3Z" />
              </svg>
              Pedido mínimo de {PEDIDO_MINIMO_KG} kg
            </p>
          </div>
        </SeccionEntrada>

        <div
          className="mt-12 grid gap-7"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {productos.map((producto, i) => (
            <TarjetaProducto key={producto.id} producto={producto} indice={i} />
          ))}
        </div>

        {productos.length === 0 && (
          <p className="mt-16 text-center text-tinta-suave">
            Pronto vamos a tener productos disponibles.
          </p>
        )}
      </div>
    </section>
  );
}
