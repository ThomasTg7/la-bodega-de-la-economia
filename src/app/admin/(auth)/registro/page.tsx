import Link from "next/link";
import { db } from "@/lib/db";
import { estadoDe, MINUTOS_VIGENCIA } from "@/lib/invitaciones";
import { hashDeToken } from "@/lib/invitaciones-servidor";
import FormularioRegistro from "@/components/admin/FormularioRegistro";

/**
 * Solo se llega acá con un link de invitación. La validez se mira en el
 * servidor antes de dibujar nada: no tiene sentido hacer llenar cinco campos
 * para avisar al final que el link estaba vencido. La ruta igual vuelve a
 * revisarlo al crear la cuenta — esta pantalla es cortesía, no la cerradura.
 */
export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ invitacion?: string }>;
}) {
  const { invitacion: token } = await searchParams;

  const invitacion = token
    ? await db.invitacion.findUnique({ where: { hashToken: hashDeToken(token) } })
    : null;

  const estado = invitacion ? estadoDe(invitacion) : null;

  if (!token || !invitacion || estado !== "activa") {
    return (
      <>
        <h1 className="text-center font-titulo text-verde-700" style={{ fontSize: 22 }}>
          {estado === "usada" ? "Este link ya se usó" : "Link no válido"}
        </h1>
        <p className="mt-3 text-center text-sm text-tinta-suave">
          {estado === "usada"
            ? "Con este link ya se creó una cuenta. Cada invitación sirve una sola vez."
            : estado === "vencida"
              ? `Las invitaciones duran ${MINUTOS_VIGENCIA} minutos y esta se venció.`
              : "Para crear una cuenta necesitas un link de invitación."}
        </p>
        <p className="mt-3 text-center text-sm text-tinta-suave">
          Pídele uno nuevo a quien administra el sitio.
        </p>
        <p className="mt-6 text-center text-sm text-tinta-suave">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="font-semibold text-cyan-700">
            Entra aquí
          </Link>
        </p>
      </>
    );
  }

  return <FormularioRegistro token={token} expiraEn={invitacion.expiraEn.toISOString()} />;
}
