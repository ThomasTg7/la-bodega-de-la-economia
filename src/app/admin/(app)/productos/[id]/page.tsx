import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import FormProducto from "@/components/admin/FormProducto";

export default async function PaginaEditarProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const producto = await db.producto.findUnique({ where: { id } });
  if (!producto) notFound();

  const ajustes = await db.ajustes.findUnique({ where: { id: "sitio" } });

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver a productos
      </Link>
      <h1 className="mt-2 font-titulo text-verde-700" style={{ fontSize: 28 }}>
        {producto.nombre}
      </h1>
      <div className="mt-6">
        <FormProducto productoExistente={producto} pedidoMinimo={ajustes?.pedidoMinimoKg} />
      </div>
    </div>
  );
}
