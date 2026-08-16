"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TarjetaSeccion, { ListaTarjetas } from "./TarjetaSeccion";
import { useToast } from "./Toast";

/** Lo que el servidor manda de cada cuenta: nunca el hash de la clave. */
export type UsuarioResumen = {
  id: string;
  email: string;
  usuario: string | null;
  nombre: string;
  rol: string;
  creadoEn: Date | string;
  ultimoAcceso: Date | string | null;
};

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400";

const CLASE_BOTON =
  "rounded-full bg-verde-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-70";

function fecha(valor: Date | string | null) {
  if (!valor) return null;
  return new Date(valor).toLocaleDateString("es-CL");
}

export default function PanelUsuarios({
  sesionId,
  inicial,
}: {
  sesionId: string;
  inicial: UsuarioResumen[];
}) {
  const [usuarios, setUsuarios] = useState(inicial);
  const { mostrar } = useToast();
  const yo = usuarios.find((u) => u.id === sesionId);

  return (
    <ListaTarjetas className="space-y-5">
      {yo && (
        <FormMisDatos
          yo={yo}
          onAviso={mostrar}
          onGuardado={(actualizado) =>
            setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)))
          }
        />
      )}
      <FormClave onAviso={mostrar} />
      <FormUsuarioNuevo
        onAviso={mostrar}
        onCreado={(nuevo) => setUsuarios((prev) => [...prev, nuevo])}
      />

      <TarjetaSeccion
        titulo="Cuentas del panel"
        icono="llave"
        ayuda={`${usuarios.length} en total`}
      >
        <div className="space-y-3">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tinta/[0.07] px-4 py-3"
            >
              <div>
                <p className="font-medium text-tinta">
                  {u.nombre || u.usuario || u.email}
                  {u.id === sesionId && (
                    <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-verde-700">
                      Tú
                    </span>
                  )}
                </p>
                <p className="text-xs text-tinta-suave">
                  {u.usuario ? `${u.usuario} · ` : ""}
                  {u.email}
                </p>
              </div>
              <p className="text-xs text-tinta-suave">
                {u.ultimoAcceso
                  ? `Último acceso: ${fecha(u.ultimoAcceso)}`
                  : `Creada el ${fecha(u.creadoEn)}, sin entrar todavía`}
              </p>
            </div>
          ))}
        </div>
      </TarjetaSeccion>
    </ListaTarjetas>
  );
}

type Aviso = (mensaje: string, tipo?: "exito" | "error" | "info") => void;

/**
 * Los datos con los que entras: correo, usuario y nombre. Se editan acá y no
 * en la lista de abajo porque cada quien cambia los suyos — nadie edita los
 * de otro.
 */
function FormMisDatos({
  yo,
  onAviso,
  onGuardado,
}: {
  yo: UsuarioResumen;
  onAviso: Aviso;
  onGuardado: (usuario: UsuarioResumen) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(yo.email);
  const [usuario, setUsuario] = useState(yo.usuario ?? "");
  const [nombre, setNombre] = useState(yo.nombre);
  const [enviando, setEnviando] = useState(false);

  const hayCambios =
    email !== yo.email || usuario !== (yo.usuario ?? "") || nombre !== yo.nombre;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resp = await fetch("/api/usuarios/mi-cuenta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usuario, nombre }),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onAviso(datos.error ?? "No se pudo guardar.", "error");
        return;
      }
      onGuardado(datos);
      onAviso("Datos guardados. Con esos entras la próxima vez.", "exito");
      // La cabecera del panel muestra el correo de la sesión: sin esto
      // seguiría mostrando el viejo hasta recargar a mano.
      router.refresh();
    } catch {
      onAviso("No se pudo conectar. Revisa tu internet.", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TarjetaSeccion
      titulo="Mis datos"
      icono="persona"
      ayuda="Con el usuario o el correo entras al panel, cualquiera de los dos."
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mi-nombre" className="block text-sm font-semibold text-tinta">
              Nombre
            </label>
            <input
              id="mi-nombre"
              type="text"
              required
              minLength={2}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="mi-usuario" className="block text-sm font-semibold text-tinta">
              Usuario
            </label>
            <input
              id="mi-usuario"
              type="text"
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={CLASE_CAMPO}
            />
            <p className="mt-1 text-xs text-tinta-suave">Sin espacios ni arroba.</p>
          </div>
        </div>
        <div>
          <label htmlFor="mi-email" className="block text-sm font-semibold text-tinta">
            Correo
          </label>
          <input
            id="mi-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
        <button type="submit" disabled={enviando || !hayCambios} className={CLASE_BOTON}>
          {enviando ? "Guardando…" : "Guardar mis datos"}
        </button>
      </form>
    </TarjetaSeccion>
  );
}


function FormClave({ onAviso }: { onAviso: Aviso }) {
  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    // La confirmación se revisa acá y no en el servidor: el segundo campo
    // existe para atajar un dedazo, no para autorizar nada.
    if (claveNueva !== repetida) {
      onAviso("Las dos claves nuevas no son iguales.", "error");
      return;
    }

    setEnviando(true);
    try {
      const resp = await fetch("/api/auth/clave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveActual, claveNueva }),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onAviso(datos.error ?? "No se pudo cambiar la clave.", "error");
        return;
      }
      setClaveActual("");
      setClaveNueva("");
      setRepetida("");
      onAviso("Clave cambiada.", "exito");
    } catch {
      onAviso("No se pudo conectar. Revisa tu internet.", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TarjetaSeccion
      titulo="Cambiar mi clave"
      icono="llave"
      ayuda="Solo cambia la tuya, la de la sesión abierta."
    >
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label htmlFor="cl-actual" className="block text-sm font-semibold text-tinta">
            Clave actual
          </label>
          <input
            id="cl-actual"
            type="password"
            required
            autoComplete="current-password"
            value={claveActual}
            onChange={(e) => setClaveActual(e.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cl-nueva" className="block text-sm font-semibold text-tinta">
              Clave nueva
            </label>
            <input
              id="cl-nueva"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
              className={CLASE_CAMPO}
            />
            <p className="mt-1 text-xs text-tinta-suave">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <label htmlFor="cl-repetir" className="block text-sm font-semibold text-tinta">
              Repite la clave nueva
            </label>
            <input
              id="cl-repetir"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
        </div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? "Guardando…" : "Cambiar clave"}
        </button>
      </form>
    </TarjetaSeccion>
  );
}

function FormUsuarioNuevo({
  onAviso,
  onCreado,
}: {
  onAviso: Aviso;
  onCreado: (usuario: UsuarioResumen) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resp = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, usuario, email, clave }),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        onAviso(datos.error ?? "No se pudo crear la cuenta.", "error");
        return;
      }
      onCreado(datos);
      setNombre("");
      setUsuario("");
      setEmail("");
      setClave("");
      onAviso("Cuenta creada. Pásale la clave a esa persona.", "exito");
    } catch {
      onAviso("No se pudo conectar. Revisa tu internet.", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TarjetaSeccion
      titulo="Crear un usuario"
      icono="mas"
      ayuda="La persona entra con el usuario o el correo y la clave que le pongas acá."
    >
      <form onSubmit={crear} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nu-nombre" className="block text-sm font-semibold text-tinta">
              Nombre
            </label>
            <input
              id="nu-nombre"
              type="text"
              required
              minLength={2}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="nu-usuario" className="block text-sm font-semibold text-tinta">
              Usuario
            </label>
            <input
              id="nu-usuario"
              type="text"
              required
              minLength={3}
              maxLength={30}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={CLASE_CAMPO}
            />
            <p className="mt-1 text-xs text-tinta-suave">Sin espacios ni arroba.</p>
          </div>
          <div>
            <label htmlFor="nu-email" className="block text-sm font-semibold text-tinta">
              Correo
            </label>
            <input
              id="nu-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CLASE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="nu-clave" className="block text-sm font-semibold text-tinta">
              Clave inicial
            </label>
            <input
              id="nu-clave"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={CLASE_CAMPO}
            />
            <p className="mt-1 text-xs text-tinta-suave">
              Mínimo 8 caracteres. Después la puede cambiar acá mismo.
            </p>
          </div>
        </div>
        <button type="submit" disabled={enviando} className={CLASE_BOTON}>
          {enviando ? "Creando…" : "Crear usuario"}
        </button>
      </form>
    </TarjetaSeccion>
  );
}
