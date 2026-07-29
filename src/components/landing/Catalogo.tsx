import type { Producto } from "@prisma/client";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import TarjetaProducto from "./TarjetaProducto";

type Props = { productos: Producto[] };

export default function Catalogo({ productos }: Props) {
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
              <TextoRevelado texto="Precio por kilo, al por mayor" modo="palabra" as="span" />
            </h2>
          </div>
          <p className="max-w-[46ch] text-tinta-suave" style={{ fontSize: "var(--text-cuerpo)" }}>
            Los valores se mueven según la semana y el volumen. Escríbenos y te cerramos el
            precio del día para tu pedido.
          </p>
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
