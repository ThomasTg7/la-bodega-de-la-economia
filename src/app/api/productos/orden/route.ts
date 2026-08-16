import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";

const esquema = z.object({ ids: z.array(z.string()).min(1) });

export async function PATCH(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquema.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  await db.$transaction(
    datos.data.ids.map((id, index) =>
      db.producto.update({ where: { id }, data: { orden: index } })
    )
  );

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
