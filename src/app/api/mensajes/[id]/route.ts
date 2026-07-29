import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";

type Contexto = { params: Promise<{ id: string }> };

const esquemaActualizar = z
  .object({ leido: z.boolean().optional(), respondido: z.boolean().optional() })
  .refine(
    (d) => d.leido !== undefined || d.respondido !== undefined,
    "Nada que actualizar."
  );

export async function PATCH(request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaActualizar.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  // La fecha de respuesta se pone acá y no la manda el cliente: es un dato
  // derivado de la acción, no algo que el panel deba poder inventar.
  const { leido, respondido } = datos.data;
  const cambios = {
    ...(leido !== undefined ? { leido } : {}),
    ...(respondido !== undefined
      ? { respondido, respondidoEn: respondido ? new Date() : null }
      : {}),
  };

  try {
    const mensaje = await db.mensaje.update({ where: { id }, data: cambios });
    return NextResponse.json(mensaje);
  } catch {
    return NextResponse.json({ error: "Mensaje no encontrado." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await db.mensaje.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Mensaje no encontrado." }, { status: 404 });
  }
}
