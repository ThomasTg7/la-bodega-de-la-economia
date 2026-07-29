import Link from "next/link";
import { db } from "@/lib/db";
import ListaProductos from "@/components/admin/ListaProductos";

export default async function PaginaProductos() {
  const productos = await db.producto.findMany({ orderBy: { orden: "asc" } });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
            Productos
          </h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Arrastra el asa para cambiar el orden del catálogo. El interruptor lo muestra o lo
            esconde de la página.
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="shrink-0 rounded-full bg-verde-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-verde-500"
        >
          + Agregar
        </Link>
      </div>

      <div className="mt-6">
        <ListaProductos inicial={productos} />
      </div>
    </div>
  );
}
