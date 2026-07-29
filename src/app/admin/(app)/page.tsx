import { db } from "@/lib/db";
import ResumenPanel from "@/components/admin/ResumenPanel";

export default async function PaginaInicioAdmin() {
  const [productos, mensajesSinLeer, accesosPendientes] = await Promise.all([
    db.producto.findMany({ orderBy: { orden: "asc" } }),
    db.mensaje.count({ where: { leido: false } }),
    db.correoAutorizado.count({ where: { usado: false } }),
  ]);

  const activos = productos.filter((p) => p.activo).length;

  // Las dos fotos cumplen papeles distintos y ninguna reemplaza a la otra:
  // la del catálogo llena la tarjeta, la de la calculadora flota recortada.
  const sinFoto = productos
    .filter((p) => !p.imagenTextura || !p.imagenRecorte)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      falta: !p.imagenTextura && !p.imagenRecorte ? "las dos fotos" : !p.imagenTextura ? "la del catálogo" : "la de la calculadora",
    }));

  return (
    <ResumenPanel
      sinFoto={sinFoto}
      tarjetas={[
        {
          href: "/admin/productos",
          numero: activos,
          etiqueta: "Productos a la venta",
          icono: "caja",
        },
        {
          href: "/admin/mensajes",
          numero: mensajesSinLeer,
          etiqueta: "Mensajes sin leer",
          icono: "chat",
          resaltar: mensajesSinLeer > 0,
        },
        {
          href: "/admin/accesos",
          numero: accesosPendientes,
          etiqueta: "Invitaciones sin usar",
          icono: "llave",
          resaltar: accesosPendientes > 0,
        },
        {
          href: "/admin/productos",
          numero: sinFoto.length,
          etiqueta: "Productos con fotos incompletas",
          icono: "imagen",
          resaltar: sinFoto.length > 0,
        },
      ]}
    />
  );
}
