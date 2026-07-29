import { db } from "@/lib/db";
import PanelAjustes from "@/components/admin/PanelAjustes";

export default async function PaginaAjustes() {
  const ajustes = await db.ajustes.upsert({
    where: { id: "sitio" },
    update: {},
    create: { id: "sitio" },
  });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Ajustes
      </h1>
      <p className="mt-1 text-tinta-suave">Los datos que se muestran en la página.</p>
      <div className="mt-6">
        <PanelAjustes inicial={ajustes} />
      </div>
    </div>
  );
}
