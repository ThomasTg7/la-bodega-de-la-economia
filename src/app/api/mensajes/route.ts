import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leerSesion } from "@/lib/sesion";
import { esquemaMensaje } from "@/lib/validaciones";

// Límite simple en memoria: 5 envíos por IP cada 10 minutos.
// Se reinicia si el servidor se reinicia — suficiente para frenar spam básico
// de un formulario de contacto de un solo local, no un sistema distribuido.
const LIMITE = 5;
const VENTANA_MS = 10 * 60 * 1000;
const envios = new Map<string, number[]>();

function limiteExcedido(ip: string) {
  const ahora = Date.now();
  const previos = (envios.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previos.push(ahora);
  envios.set(ip, previos);
  return previos.length > LIMITE;
}

export async function GET() {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const mensajes = await db.mensaje.findMany({ orderBy: { creadoEn: "desc" } });
  return NextResponse.json(mensajes);
}

export async function POST(request: NextRequest) {
  const cuerpo = await request.json().catch(() => null);
  const datos = esquemaMensaje.safeParse(cuerpo);
  if (!datos.success) {
    return NextResponse.json(
      { error: "Revisa el formulario: nombre y mensaje son obligatorios." },
      { status: 400 }
    );
  }

  // Honeypot: si el campo oculto viene lleno, es un bot. Respondemos 200
  // sin guardar nada, para no delatar que lo detectamos.
  if (datos.data.sitio_web) {
    return NextResponse.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  if (limiteExcedido(ip)) {
    return NextResponse.json(
      { error: "Enviaste varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  // sitio_web (honeypot) ya cumplió su función arriba — no se guarda.
  // El origen se fuerza acá: el endpoint es público y lo único que se guarda
  // son los mensajes del formulario. Lo de WhatsApp vive en WhatsApp.
  const { nombre, email, telefono, asunto, mensaje: texto } = datos.data;
  const mensaje = await db.mensaje.create({
    data: { nombre, email, telefono, asunto, mensaje: texto, origen: "formulario" },
  });

  return NextResponse.json(mensaje, { status: 201 });
}
