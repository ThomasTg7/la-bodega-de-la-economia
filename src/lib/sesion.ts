import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const NOMBRE_COOKIE = "bodega_sesion";
const DURACION = "7d";
const DURACION_SEGUNDOS = 60 * 60 * 24 * 7;

function obtenerSecreto() {
  const secreto = process.env.SESION_SECRETO;
  if (!secreto) {
    throw new Error("Falta SESION_SECRETO en las variables de entorno.");
  }
  return new TextEncoder().encode(secreto);
}

export type PayloadSesion = {
  usuarioId: string;
  email: string;
  rol: string;
};

export async function crearSesion(payload: PayloadSesion) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(obtenerSecreto());

  const store = await cookies();
  store.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function leerSesion(): Promise<PayloadSesion | null> {
  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    return {
      usuarioId: payload.usuarioId as string,
      email: payload.email as string,
      rol: payload.rol as string,
    };
  } catch {
    return null;
  }
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(NOMBRE_COOKIE);
}

export async function requerirSesion(): Promise<PayloadSesion> {
  const sesion = await leerSesion();
  if (!sesion) {
    redirect("/admin/login");
  }
  return sesion;
}

export { NOMBRE_COOKIE };
