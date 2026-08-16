import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { crearSesion } from "@/lib/sesion";
import { esquemaRegistro } from "@/lib/validaciones";

/**
 * Compara dos secretos en tiempo constante. Se pasan por sha256 primero
 * porque timingSafeEqual exige buffers del mismo largo, y comparar los largos
 * a mano ya filtraría cuántos caracteres tiene la palabra clave.
 */
function coincide(recibida: string, esperada: string) {
  const a = createHash("sha256").update(recibida).digest();
  const b = createHash("sha256").update(esperada).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaRegistro.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      {
        error:
          "Revisa los datos: correo válido, usuario de 3 a 30 caracteres sin espacios, " +
          "nombre y clave de al menos 8 caracteres.",
      },
      { status: 400 }
    );
  }

  const { email, usuario: nombreUsuario, nombre, clave, palabraClave } = datos.data;

  // Dos formas de habilitar el registro, y basta con una:
  //
  //   1. La palabra clave compartida (CLAVE_REGISTRO). Es el camino normal:
  //      se la pasas a quien quieras que entre y se crea la cuenta solo.
  //   2. Que el correo esté en la lista de autorizados del panel (Accesos).
  //
  // Sin CLAVE_REGISTRO definida, el primer camino queda cerrado en vez de
  // abierto: olvidar la variable no puede dejar el registro a disposición de
  // cualquiera que llegue a la URL.
  const esperada = process.env.CLAVE_REGISTRO ?? "";
  const porPalabraClave = esperada !== "" && coincide(palabraClave, esperada);

  const acceso = porPalabraClave
    ? null
    : await db.correoAutorizado.findUnique({ where: { email } });

  if (!porPalabraClave && (!acceso || acceso.usado)) {
    return NextResponse.json(
      {
        error: acceso?.usado
          ? "Este correo ya tiene una cuenta creada."
          : "La palabra clave no es correcta. Pídesela a quien administra el sitio.",
      },
      { status: 403 }
    );
  }

  const hashClave = await bcrypt.hash(clave, 10);

  let creado;
  try {
    creado = await db.usuario.create({
      data: { email, usuario: nombreUsuario, nombre, hashClave, rol: "admin" },
    });
  } catch (error) {
    // P2002 = choque con un índice único. Se responde por el error de la base
    // y no por una consulta previa porque entre mirar y crear cabe otro
    // registro con el mismo usuario, y el índice es el único árbitro real.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const campos = (error.meta?.target as string[] | undefined) ?? [];
      return NextResponse.json(
        {
          error: campos.includes("usuario")
            ? "Ese nombre de usuario ya está tomado."
            : "Este correo ya tiene una cuenta creada.",
        },
        { status: 409 }
      );
    }
    throw error;
  }

  if (acceso) {
    await db.correoAutorizado.update({
      where: { email },
      data: { usado: true, usadoEn: new Date() },
    });
  }

  await crearSesion({ usuarioId: creado.id, email: creado.email, rol: creado.rol });

  return NextResponse.json({ ok: true });
}
