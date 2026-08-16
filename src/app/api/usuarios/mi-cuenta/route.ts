import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { crearSesion, leerSesion } from "@/lib/sesion";
import { esquemaMiCuenta } from "@/lib/validaciones";

/**
 * Cambia los datos de quien tiene la sesión abierta: su correo, su nombre de
 * usuario y su nombre. La clave va por otra ruta (/api/auth/clave) porque
 * pide la actual para dejarla cambiar.
 */
export async function PUT(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaMiCuenta.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      {
        error:
          "Revisa los datos: correo válido, usuario de 3 a 30 caracteres sin espacios " +
          "y nombre de al menos 2.",
      },
      { status: 400 }
    );
  }

  let actualizado;
  try {
    actualizado = await db.usuario.update({
      where: { id: sesion.usuarioId },
      data: datos.data,
      select: {
        id: true,
        email: true,
        usuario: true,
        nombre: true,
        rol: true,
        creadoEn: true,
        ultimoAcceso: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = choque con un índice único; P2025 = la fila ya no está.
      if (error.code === "P2002") {
        const campos = (error.meta?.target as string[] | undefined) ?? [];
        return NextResponse.json(
          {
            error: campos.includes("usuario")
              ? "Ese nombre de usuario ya está tomado."
              : "Ese correo ya lo usa otra cuenta.",
          },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Tu cuenta ya no existe." }, { status: 404 });
      }
    }
    throw error;
  }

  // La cookie lleva el correo adentro y es lo que la cabecera del panel
  // muestra. Sin volver a firmarla, quien cambia su correo sigue viendo el
  // viejo hasta que la sesión venza.
  await crearSesion({
    usuarioId: actualizado.id,
    email: actualizado.email,
    rol: actualizado.rol,
  });

  return NextResponse.json(actualizado);
}
