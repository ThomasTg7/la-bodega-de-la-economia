import { db } from "@/lib/db";
import PanelAccesos from "@/components/admin/PanelAccesos";

export default async function PaginaAccesos() {
  const accesos = await db.correoAutorizado.findMany({ orderBy: { creadoEn: "desc" } });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Accesos
      </h1>
      <p className="mt-1 text-tinta-suave">Invita a otras personas a entrar al panel.</p>
      <div className="mt-6">
        <PanelAccesos inicial={accesos} />
      </div>
    </div>
  );
}
