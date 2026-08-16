import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";

type Contexto = { params: Promise<{ id: string }> };

/**
 * Anula un link. Borra la fila y con eso el hash: el link deja de servir en
 * el acto, aunque le queden minutos. Las cuentas ya creadas con ese link no
 * se tocan — para sacar a alguien del panel hay que borrar su cuenta, que es
 * otra cosa.
 */
export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await db.invitacion.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Esa invitación ya no existe." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
