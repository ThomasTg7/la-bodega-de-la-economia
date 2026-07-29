import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const NOMBRE_COOKIE = "bodega_sesion";
const RUTAS_PUBLICAS = ["/admin/login", "/admin/registro"];

function obtenerSecreto() {
  const secreto = process.env.SESION_SECRETO;
  if (!secreto) throw new Error("Falta SESION_SECRETO en las variables de entorno.");
  return new TextEncoder().encode(secreto);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(NOMBRE_COOKIE)?.value;

  if (token) {
    try {
      await jwtVerify(token, obtenerSecreto());
      return NextResponse.next();
    } catch {
      // token inválido o expirado -> cae al redirect de abajo
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("siguiente", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
