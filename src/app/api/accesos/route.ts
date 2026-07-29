import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaAcceso } from "@/lib/validaciones";

export async function GET() {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const accesos = await db.correoAutorizado.findMany({ orderBy: { creadoEn: "desc" } });
  return NextResponse.json(accesos);
}

export async function POST(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaAcceso.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
  }

  const existente = await db.correoAutorizado.findUnique({
    where: { email: datos.data.email },
  });
  if (existente) {
    return NextResponse.json(
      { error: "Ese correo ya está en la lista de accesos." },
      { status: 409 }
    );
  }

  const acceso = await db.correoAutorizado.create({
    data: { ...datos.data, invitadoPor: sesion.email },
  });

  return NextResponse.json(acceso, { status: 201 });
}
