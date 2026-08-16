import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaInvitacion } from "@/lib/validaciones";
import { crearToken, expiracionDesdeAhora, hashDeToken } from "@/lib/invitaciones-servidor";

/** Lo que sale hacia el panel. El hash del token nunca viaja. */
const CAMPOS = {
  id: true,
  nota: true,
  creadaPor: true,
  creadaEn: true,
  expiraEn: true,
  usadaEn: true,
  usadaPor: true,
} as const;

export async function GET() {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const invitaciones = await db.invitacion.findMany({
    select: CAMPOS,
    orderBy: { creadaEn: "desc" },
    take: 50,
  });
  return NextResponse.json(invitaciones);
}

export async function POST(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaInvitacion.safeParse(cuerpo ?? {});
  if (!datos.success) {
    return NextResponse.json({ error: "La nota es demasiado larga." }, { status: 400 });
  }

  const token = crearToken();
  const invitacion = await db.invitacion.create({
    data: {
      hashToken: hashDeToken(token),
      nota: datos.data.nota,
      creadaPor: sesion.email,
      expiraEn: expiracionDesdeAhora(),
    },
    select: CAMPOS,
  });

  // El token entero se devuelve una sola vez, acá. Después solo queda su
  // hash en la base, así que si se pierde el link hay que crear otro.
  return NextResponse.json({ ...invitacion, token }, { status: 201 });
}
