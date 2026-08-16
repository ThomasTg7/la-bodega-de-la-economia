import { db } from "@/lib/db";
import PaginaPrincipal from "@/components/landing/PaginaPrincipal";
import { datosEstructurados } from "@/lib/datos-estructurados";

// La home se sirve estatica y se revalida sola cada hora; las mutaciones del
// panel (ajustes, productos, orden, fotos) fuerzan una revalidacion al
// instante con revalidatePath("/"), asi que un cambio se ve de inmediato
// igual sin depender de este numero.
export const revalidate = 3600;

export default async function Home() {
  const [productos, ajustes] = await Promise.all([
    db.producto.findMany({ where: { activo: true }, orderBy: { orden: "asc" } }),
    db.ajustes.upsert({ where: { id: "sitio" }, update: {}, create: { id: "sitio" } }),
  ]);

  return (
    <>
      {/* JSON-LD para buscadores: no se ve, no pinta nada. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datosEstructurados(ajustes, productos)).replace(/</g, "\\u003c"),
        }}
      />
      <PaginaPrincipal productos={productos} ajustes={ajustes} />
    </>
  );
}
