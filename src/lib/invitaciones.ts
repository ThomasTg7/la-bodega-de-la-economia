/**
 * Invitaciones para crear cuenta en /admin/registro.
 *
 * Una invitación es un link con un token adentro. Sirve una sola vez y por
 * media hora: pasada esa ventana, o usado el link, no se entra por ahí. Antes
 * había una palabra clave compartida que no vencía nunca y una lista de
 * correos autorizados; las dos convivían y ninguna caducaba, así que quien
 * alguna vez supo la palabra podía crearse una cuenta meses después.
 *
 * Este archivo es el lado que también ve el navegador: solo constantes y
 * cuentas de fechas. Lo que toca crypto o la base vive en
 * `invitaciones-servidor.ts`.
 */

/** Cuánto vale un link desde que se crea. */
export const MINUTOS_VIGENCIA = 30;

export type EstadoInvitacion = "activa" | "usada" | "vencida";

export type InvitacionParaMostrar = {
  usadaEn: Date | string | null;
  expiraEn: Date | string;
};

export function estadoDe(invitacion: InvitacionParaMostrar, ahora = new Date()): EstadoInvitacion {
  if (invitacion.usadaEn) return "usada";
  return new Date(invitacion.expiraEn).getTime() > ahora.getTime() ? "activa" : "vencida";
}

/** Minutos y segundos que le quedan, para el reloj del panel. Nunca negativo. */
export function tiempoRestante(expiraEn: Date | string, ahora = new Date()) {
  const ms = Math.max(0, new Date(expiraEn).getTime() - ahora.getTime());
  const total = Math.floor(ms / 1000);
  return { minutos: Math.floor(total / 60), segundos: total % 60, agotado: ms === 0 };
}

/** El link que se le pasa a la persona. El token viaja en la query. */
export function linkDeInvitacion(origen: string, token: string) {
  return `${origen}/admin/registro?invitacion=${token}`;
}
