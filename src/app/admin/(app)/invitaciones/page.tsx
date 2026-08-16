import { db } from "@/lib/db";
import PanelInvitaciones from "@/components/admin/PanelInvitaciones";
import { MINUTOS_VIGENCIA } from "@/lib/invitaciones";

export default async function PaginaInvitaciones() {
  const invitaciones = await db.invitacion.findMany({
    select: {
      id: true,
      nota: true,
      creadaPor: true,
      creadaEn: true,
      expiraEn: true,
      usadaEn: true,
      usadaPor: true,
    },
    orderBy: { creadaEn: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Invitaciones
      </h1>
      <p className="mt-1 text-tinta-suave">
        Links de un solo uso, válidos por {MINUTOS_VIGENCIA} minutos, para que alguien se cree su
        cuenta.
      </p>
      <div className="mt-6">
        <PanelInvitaciones inicial={invitaciones} />
      </div>
    </div>
  );
}
