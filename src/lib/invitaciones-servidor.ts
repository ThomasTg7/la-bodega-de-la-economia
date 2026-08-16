import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { MINUTOS_VIGENCIA } from "./invitaciones";

/**
 * El token que viaja en el link. 24 bytes al azar en base64url: 192 bits, que
 * es de sobra para que no se adivine en la media hora que dura.
 */
export function crearToken() {
  return randomBytes(24).toString("base64url");
}

/**
 * En la base se guarda el sha256 del token, no el token. Así, una copia de la
 * tabla —un respaldo, un volcado como el de `npm run exportar`— no alcanza
 * para fabricarse una cuenta: el link solo existe entero en el momento de
 * crearlo, cuando se muestra una vez en pantalla.
 *
 * sha256 sin sal ni bcrypt a propósito: el token es aleatorio y de 192 bits,
 * así que no hay diccionario que lo alcance, y la búsqueda tiene que ser por
 * índice único para resolverse en una consulta.
 */
export function hashDeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function expiracionDesdeAhora() {
  return new Date(Date.now() + MINUTOS_VIGENCIA * 60_000);
}
