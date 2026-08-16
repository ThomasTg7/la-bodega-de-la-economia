import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaUsuarioNuevo } from "@/lib/validaciones";

/**
 * Campos que salen del servidor. `hashClave` no está y no puede estar: la
 * lista se serializa entera hacia el panel.
 */
const CAMPOS = {
  id: true,
  email: true,
  usuario: true,
  nombre: true,
  rol: true,
  creadoEn: true,
  ultimoAcceso: true,
} as const;

export async function GET() {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const usuarios = await db.usuario.findMany({
    select: CAMPOS,
    orderBy: { creadoEn: "asc" },
  });
  return NextResponse.json(usuarios);
}

/**
 * Alta desde el panel: cualquiera que ya esté adentro puede crear a otro. El
 * equipo es chico y de confianza, así que no hay roles que filtren esto; la
 * cerradura del sitio es la sesión.
 */
export async function POST(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaUsuarioNuevo.safeParse(cuerpo);
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

  const { email, usuario: nombreUsuario, nombre, clave } = datos.data;
  const hashClave = await bcrypt.hash(clave, 10);

  try {
    const creado = await db.usuario.create({
      data: { email, usuario: nombreUsuario, nombre, hashClave, rol: "admin" },
      select: CAMPOS,
    });
    return NextResponse.json(creado, { status: 201 });
  } catch (error) {
    // P2002 = choque con un índice único. Se responde por el error de la base
    // y no por una consulta previa porque entre mirar y crear cabe otra alta
    // con el mismo usuario, y el índice es el único árbitro real.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const campos = (error.meta?.target as string[] | undefined) ?? [];
      return NextResponse.json(
        {
          error: campos.includes("usuario")
            ? "Ese nombre de usuario ya está tomado."
            : "Ese correo ya tiene una cuenta.",
        },
        { status: 409 }
      );
    }
    throw error;
  }
}
