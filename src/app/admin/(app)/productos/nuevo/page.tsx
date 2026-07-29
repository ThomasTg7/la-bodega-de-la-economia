import Link from "next/link";
import FormProducto from "@/components/admin/FormProducto";

export default function PaginaNuevoProducto() {
  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-tinta-suave hover:text-tinta">
        ← Volver a productos
      </Link>
      <h1 className="mt-2 font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Nuevo producto
      </h1>
      <div className="mt-6">
        <FormProducto />
      </div>
    </div>
  );
}
