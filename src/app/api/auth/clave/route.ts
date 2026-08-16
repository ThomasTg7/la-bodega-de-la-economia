import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaCambioClave } from "@/lib/validaciones";

/** Cambia la clave de quien tiene la sesión abierta. Nadie cambia la de otro. */
export async function PUT(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaCambioClave.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      { error: "La clave nueva tiene que tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const usuario = await db.usuario.findUnique({ where: { id: sesion.usuarioId } });
  if (!usuario) {
    return NextResponse.json({ error: "Tu cuenta ya no existe." }, { status: 404 });
  }

  const actualValida = await bcrypt.compare(datos.data.claveActual, usuario.hashClave);
  if (!actualValida) {
    return NextResponse.json({ error: "Tu clave actual no es esa." }, { status: 403 });
  }

  await db.usuario.update({
    where: { id: usuario.id },
    data: { hashClave: await bcrypt.hash(datos.data.claveNueva, 10) },
  });

  return NextResponse.json({ ok: true });
}
