import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { crearSesion } from "@/lib/sesion";
import { esquemaLogin } from "@/lib/validaciones";

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaLogin.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const mensajeGenerico = "Correo o clave incorrectos.";
  const usuario = await db.usuario.findUnique({ where: { email: datos.data.email } });
  if (!usuario) {
    return NextResponse.json({ error: mensajeGenerico }, { status: 401 });
  }

  const claveValida = await bcrypt.compare(datos.data.clave, usuario.hashClave);
  if (!claveValida) {
    return NextResponse.json({ error: mensajeGenerico }, { status: 401 });
  }

  await crearSesion({ usuarioId: usuario.id, email: usuario.email, rol: usuario.rol });
  await db.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() },
  });

  return NextResponse.json({ ok: true });
}
