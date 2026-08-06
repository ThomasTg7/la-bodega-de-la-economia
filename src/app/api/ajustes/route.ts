import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaAjustes } from "@/lib/validaciones";

export async function GET() {
  const ajustes = await db.ajustes.upsert({
    where: { id: "sitio" },
    update: {},
    create: { id: "sitio" },
  });
  return NextResponse.json(ajustes);
}

export async function PATCH(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaAjustes.safeParse(cuerpo);
  if (!datos.success) {
    // El panel muestra este texto tal cual en el aviso, así que se manda el
    // motivo concreto ("el link del mapa...") en vez de un "datos inválidos"
    // que deja a la persona sin saber qué campo corregir.
    const motivo = datos.error.issues[0]?.message;
    return NextResponse.json({ error: motivo ?? "Datos inválidos." }, { status: 400 });
  }

  const ajustes = await db.ajustes.update({ where: { id: "sitio" }, data: datos.data });
  return NextResponse.json(ajustes);
}
