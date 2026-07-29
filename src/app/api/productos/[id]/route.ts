import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaProductoParcial } from "@/lib/validaciones";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Contexto) {
  const { id } = await params;
  const producto = await db.producto.findUnique({ where: { id } });
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
  return NextResponse.json(producto);
}

export async function PATCH(request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaProductoParcial.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", detalles: datos.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const producto = await db.producto.update({ where: { id }, data: datos.data });
    return NextResponse.json(producto);
  } catch {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Contexto) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await db.producto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }
}
