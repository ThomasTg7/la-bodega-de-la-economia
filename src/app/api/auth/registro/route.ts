import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { crearSesion } from "@/lib/sesion";
import { esquemaRegistro } from "@/lib/validaciones";
import { hashDeToken } from "@/lib/invitaciones-servidor";

const ERROR_INVITACION =
  "Este link de invitación ya no sirve: se usó o se venció. Pide uno nuevo a quien administra el sitio.";

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

  const { email, usuario: nombreUsuario, nombre, clave, token } = datos.data;

  const invitacion = await db.invitacion.findUnique({
    where: { hashToken: hashDeToken(token) },
  });
  if (!invitacion || invitacion.usadaEn || invitacion.expiraEn.getTime() <= Date.now()) {
    return NextResponse.json({ error: ERROR_INVITACION }, { status: 403 });
  }

  // Se marca usada ANTES de crear la cuenta, y solo si seguía sin usar. Esa
  // condición en el where es lo que hace que dos personas apretando "Crear
  // cuenta" con el mismo link al mismo tiempo no pasen las dos: la segunda
  // actualiza cero filas. Si después falla la creación, se suelta la marca
  // para no quemar el link por un correo repetido.
  const reserva = await db.invitacion.updateMany({
    where: { id: invitacion.id, usadaEn: null },
    data: { usadaEn: new Date(), usadaPor: email },
  });
  if (reserva.count !== 1) {
    return NextResponse.json({ error: ERROR_INVITACION }, { status: 403 });
  }

  const hashClave = await bcrypt.hash(clave, 10);

  let creado;
  try {
    creado = await db.usuario.create({
      data: { email, usuario: nombreUsuario, nombre, hashClave, rol: "admin" },
    });
  } catch (error) {
    await db.invitacion.update({
      where: { id: invitacion.id },
      data: { usadaEn: null, usadaPor: "" },
    });

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

  await crearSesion({ usuarioId: creado.id, email: creado.email, rol: creado.rol });

  return NextResponse.json({ ok: true });
}
