"use client";

import { useState, useSyncExternalStore } from "react";
import type { CorreoAutorizado } from "@prisma/client";
import { useToast } from "./Toast";

// El origen (dominio) no existe en el servidor y no cambia una vez cargada
// la página, así que no necesita suscripción real — solo un snapshot de
// servidor distinto al del cliente, que es justo lo que useSyncExternalStore
// está pensado para dar sin desajustar el HTML hidratado.
function sinSuscripcion() {
  return () => {};
}

function useOrigen(): string | null {
  return useSyncExternalStore(
    sinSuscripcion,
    () => window.location.origin,
    () => null
  );
}

export default function PanelAccesos({ inicial }: { inicial: CorreoAutorizado[] }) {
  const [accesos, setAccesos] = useState(inicial);
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { mostrar } = useToast();

  const origen = useOrigen();
  const linkRegistro = `${origen ?? ""}/admin/registro`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkRegistro);
      mostrar("Link copiado.", "exito");
    } catch {
      mostrar("No se pudo copiar. Copia el link manualmente.", "error");
    }
  }

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resp = await fetch("/api/accesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nota }),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        mostrar(datos.error ?? "No se pudo invitar.", "error");
        return;
      }
      setAccesos((prev) => [datos, ...prev]);
      setEmail("");
      setNota("");
      mostrar("Invitación creada.", "exito");
    } finally {
      setEnviando(false);
    }
  }

  async function revocar(acceso: CorreoAutorizado) {
    const mensaje = acceso.usado
      ? `¿Quitar el acceso de ${acceso.email}? Esto también elimina su cuenta.`
      : `¿Quitar la invitación de ${acceso.email}?`;
    if (!window.confirm(mensaje)) return;

    const resp = await fetch(`/api/accesos/${acceso.id}`, { method: "DELETE" });
    if (!resp.ok) {
      mostrar("No se pudo quitar el acceso.", "error");
      return;
    }
    setAccesos((prev) => prev.filter((a) => a.id !== acceso.id));
    mostrar("Acceso eliminado.", "exito");
  }

  return (
    <div>
      <div className="rounded-2xl bg-cyan-100 p-5 text-sm text-verde-700">
        <p>
          Cuando agregas un correo aquí, esa persona puede entrar a{" "}
          <strong>{linkRegistro}</strong> y crearse su cuenta con ese mismo correo. Nadie más
          puede.
        </p>
        <button
          type="button"
          onClick={copiarLink}
          className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-verde-700 shadow-sm"
        >
          Copiar link de registro
        </button>
      </div>

      <form onSubmit={invitar} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="acc-email" className="block text-sm font-semibold text-tinta">
            Correo
          </label>
          <input
            id="acc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="acc-nota" className="block text-sm font-semibold text-tinta">
            Nota (opcional)
          </label>
          <input
            id="acc-nota"
            type="text"
            placeholder="Ej: Mi hermano"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-verde-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          Invitar
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {accesos.map((acceso) => (
          <div
            key={acceso.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-suave)]"
          >
            <div>
              <p className="font-medium text-tinta">{acceso.email}</p>
              <p className="text-xs text-tinta-suave">
                {acceso.nota && `${acceso.nota} · `}
                Invitado por {acceso.invitadoPor || "—"} ·{" "}
                {new Date(acceso.creadoEn).toLocaleDateString("es-CL")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: acceso.usado ? "var(--color-cyan-100)" : "#FFF3D6",
                  color: acceso.usado ? "var(--color-verde-700)" : "#8A6100",
                }}
              >
                {acceso.usado ? "Cuenta creada" : "Pendiente"}
              </span>
              <button
                type="button"
                onClick={() => revocar(acceso)}
                className="text-sm font-semibold"
                style={{ color: "var(--color-naranja-texto)" }}
              >
                Revocar
              </button>
            </div>
          </div>
        ))}

        {accesos.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-tinta-suave shadow-[var(--shadow-suave)]">
            Todavía no has invitado a nadie.
          </p>
        )}
      </div>
    </div>
  );
}
