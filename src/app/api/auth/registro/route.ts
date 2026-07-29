import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { crearSesion } from "@/lib/sesion";
import { esquemaRegistro } from "@/lib/validaciones";

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaRegistro.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      { error: "Revisa los datos: correo válido, nombre y clave de al menos 8 caracteres." },
      { status: 400 }
    );
  }

  const { email, nombre, clave } = datos.data;

  const acceso = await db.correoAutorizado.findUnique({ where: { email } });
  if (!acceso) {
    return NextResponse.json(
      { error: "Este correo no está autorizado. Pídele al dueño que lo agregue en el panel." },
      { status: 403 }
    );
  }
  if (acceso.usado) {
    return NextResponse.json(
      { error: "Este correo ya tiene una cuenta creada." },
      { status: 409 }
    );
  }

  const existente = await db.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json(
      { error: "Este correo ya tiene una cuenta creada." },
      { status: 409 }
    );
  }

  const hashClave = await bcrypt.hash(clave, 10);
  const usuario = await db.usuario.create({
    data: { email, nombre, hashClave, rol: "admin" },
  });

  await db.correoAutorizado.update({
    where: { email },
    data: { usado: true, usadoEn: new Date() },
  });

  await crearSesion({ usuarioId: usuario.id, email: usuario.email, rol: usuario.rol });

  return NextResponse.json({ ok: true });
}
