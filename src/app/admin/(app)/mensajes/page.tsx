import { db } from "@/lib/db";
import PanelMensajes from "@/components/admin/PanelMensajes";

export default async function PaginaMensajes() {
  const mensajes = await db.mensaje.findMany({ orderBy: { creadoEn: "desc" } });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Mensajes
      </h1>
      <p className="mt-1 text-tinta-suave">Lo que te escriben desde la página.</p>
      <div className="mt-6">
        <PanelMensajes inicial={mensajes} />
      </div>
    </div>
  );
}
