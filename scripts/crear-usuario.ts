/**
 * Crea o repone una cuenta del panel, desde la terminal del hosting.
 *
 * Sirve para dos cosas que el formulario no cubre: dar de alta una cuenta sin
 * pasar por /admin/registro, y recuperar el acceso cuando se olvidó la clave.
 * No hay recuperación por correo porque el sitio no manda mails, así que esta
 * es la única salida si nadie puede entrar.
 *
 *   npm run usuario -- --usuario DonCarlos --email don@ejemplo.cl
 *   npm run usuario -- --usuario DonCarlos --email don@ejemplo.cl --aplicar
 *
 * El primero es un informe y no escribe nada, igual que `importar` y
 * `limpiar`.
 *
 * La clave nunca viaja como argumento: quedaría en ~/.bash_history y a la
 * vista de cualquier `ps` mientras corre. Se lee de la entrada estándar:
 *
 *   read -rsp "Clave: " CLAVE && echo
 *   printf '%s' "$CLAVE" | npm run usuario -- --usuario DonCarlos \
 *     --email don@ejemplo.cl --nombre "Don Carlos" --aplicar
 *
 * Busca la cuenta por correo y por nombre de usuario. Si alguno de los dos ya
 * existe, actualiza esa fila en vez de crear otra: eso es lo que lo convierte
 * en "reponer la clave".
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const args = process.argv.slice(2);
const aplicar = args.includes("--aplicar");

function opcion(nombre: string) {
  const i = args.indexOf(`--${nombre}`);
  const valor = i >= 0 ? args[i + 1] : undefined;
  return valor && !valor.startsWith("--") ? valor.trim() : undefined;
}

/** Mismo formato que acepta el formulario de registro (src/lib/validaciones.ts). */
const FORMATO_USUARIO = /^[a-zA-Z0-9._-]{3,30}$/;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lee la clave de la entrada estándar. Si la terminal está conectada de forma
 * interactiva no hay nada que leer y esperaría para siempre, así que ahí corta
 * y muestra cómo pasarla.
 */
async function leerClave(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error(
      "Falta la clave por la entrada estándar. Córrelo así:\n\n" +
        '  read -rsp "Clave: " CLAVE && echo\n' +
        "  printf '%s' \"$CLAVE\" | npm run usuario -- " +
        [...args, "--aplicar"].filter((a) => a !== "--aplicar").join(" ") +
        " --aplicar\n"
    );
  }
  const trozos: Buffer[] = [];
  for await (const trozo of process.stdin) trozos.push(trozo as Buffer);
  return Buffer.concat(trozos).toString("utf8").replace(/\r?\n$/, "");
}

async function main() {
  const email = opcion("email")?.toLowerCase();
  const usuario = opcion("usuario");
  const nombre = opcion("nombre");

  if (!email || !FORMATO_EMAIL.test(email)) {
    throw new Error("Falta --email, o no parece un correo.");
  }
  if (!usuario || !FORMATO_USUARIO.test(usuario)) {
    throw new Error(
      "Falta --usuario, o no cumple el formato: de 3 a 30 caracteres, solo " +
        "letras, números, punto, guion y guion bajo."
    );
  }

  const [porEmail, porUsuario] = await Promise.all([
    db.usuario.findUnique({ where: { email } }),
    db.usuario.findFirst({ where: { usuario } }),
  ]);

  // Dos cuentas distintas, una con ese correo y otra con ese usuario: no hay
  // forma de saber cuál se quiso tocar, y elegir una sería pisarle la clave a
  // alguien por adivinanza.
  if (porEmail && porUsuario && porEmail.id !== porUsuario.id) {
    throw new Error(
      `El correo ${email} y el usuario ${usuario} son de dos cuentas distintas. ` +
        "Usa los datos de una sola."
    );
  }

  const existente = porEmail ?? porUsuario;

  console.log(
    aplicar
      ? "Cuentas · MODO REAL: esto escribe en la base."
      : "Cuentas · modo informe: no se escribe nada todavía."
  );
  console.log(`\n  ${existente ? "REPONER la cuenta que ya existe" : "CREAR una cuenta nueva"}`);
  console.log(`  correo   ${email}${existente && existente.email !== email ? `  (antes: ${existente.email})` : ""}`);
  console.log(`  usuario  ${usuario}${existente && existente.usuario !== usuario ? `  (antes: ${existente.usuario ?? "sin usuario"})` : ""}`);
  console.log(`  nombre   ${nombre ?? existente?.nombre ?? usuario}`);
  console.log(`  clave    se reemplaza por la que entregues`);

  if (!aplicar) {
    console.log("\nAgrega --aplicar y pásale la clave por la entrada estándar.\n");
    return;
  }

  const clave = await leerClave();
  if (clave.length < 8 || clave.length > 72) {
    throw new Error(`La clave tiene ${clave.length} caracteres y necesita entre 8 y 72.`);
  }

  const hashClave = await bcrypt.hash(clave, 10);

  if (existente) {
    await db.usuario.update({
      where: { id: existente.id },
      data: { email, usuario, nombre: nombre ?? existente.nombre, hashClave },
    });
    console.log(`\nListo. La cuenta ${usuario} quedó con la clave nueva.\n`);
  } else {
    await db.usuario.create({
      data: { email, usuario, nombre: nombre ?? usuario, hashClave, rol: "admin" },
    });
    console.log(`\nListo. Cuenta ${usuario} creada. Entra en /admin/login.\n`);
  }
}

main()
  .catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
