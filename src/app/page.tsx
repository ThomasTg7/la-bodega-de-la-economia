import { db } from "@/lib/db";
import PaginaPrincipal from "@/components/landing/PaginaPrincipal";

export const revalidate = 0;

export default async function Home() {
  const [productos, ajustes] = await Promise.all([
    db.producto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    db.ajustes.upsert({ where: { id: "sitio" }, update: {}, create: { id: "sitio" } }),
  ]);

  return <PaginaPrincipal productos={productos} ajustes={ajustes} />;
}
