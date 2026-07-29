import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";

type Contexto = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const acceso = await db.correoAutorizado.findUnique({ where: { id } });
  if (!acceso) {
    return NextResponse.json({ error: "Acceso no encontrado." }, { status: 404 });
  }

  // Revocar un correo ya usado también elimina la cuenta asociada.
  if (acceso.usado) {
    await db.usuario.deleteMany({ where: { email: acceso.email } });
  }
  await db.correoAutorizado.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
