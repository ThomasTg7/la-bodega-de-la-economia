import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaProducto } from "@/lib/validaciones";

export async function GET() {
  const sesion = await leerSesion();
  const productos = await db.producto.findMany({
    where: sesion ? undefined : { activo: true },
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(productos);
}

export async function POST(request: NextRequest) {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaProducto.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", detalles: datos.error.flatten() },
      { status: 400 }
    );
  }

  const existente = await db.producto.findUnique({ where: { slug: datos.data.slug } });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un producto con ese identificador." },
      { status: 409 }
    );
  }

  const maxOrden = await db.producto.aggregate({ _max: { orden: true } });
  const producto = await db.producto.create({
    data: { ...datos.data, orden: (maxOrden._max.orden ?? -1) + 1 },
  });

  return NextResponse.json(producto, { status: 201 });
}
