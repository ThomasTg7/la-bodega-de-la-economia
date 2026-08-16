"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  estadoDe,
  linkDeInvitacion,
  MINUTOS_VIGENCIA,
  tiempoRestante,
  type EstadoInvitacion,
} from "@/lib/invitaciones";
import { EASE_SALIDA } from "@/lib/motion-config";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";

export type InvitacionResumen = {
  id: string;
  nota: string;
  creadaPor: string;
  creadaEn: Date | string;
  expiraEn: Date | string;
  usadaEn: Date | string | null;
  usadaPor: string;
};

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

/** Un tic por segundo, para que los relojes y los estados se muevan solos. */
function useAhora() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

const ETIQUETAS: Record<EstadoInvitacion, { texto: string; fondo: string; color: string }> = {
  activa: { texto: "Activa", fondo: "var(--color-cyan-100)", color: "var(--color-verde-700)" },
  usada: { texto: "Cuenta creada", fondo: "rgba(11,43,34,.06)", color: "var(--color-tinta-suave)" },
  vencida: { texto: "Vencida", fondo: "#FFF3D6", color: "#8A6100" },
};

export default function PanelInvitaciones({ inicial }: { inicial: InvitacionResumen[] }) {
  const [invitaciones, setInvitaciones] = useState(inicial);
  const [nota, setNota] = useState("");
  const [creando, setCreando] = useState(false);
  // El token entero solo existe en esta pantalla y hasta que se recargue: la
  // base guarda su hash. Por eso el link recién creado se muestra aparte y
  // bien grande, y no como una fila más de la lista.
  const [recienCreada, setRecienCreada] = useState<{ id: string; link: string } | null>(null);
  const { mostrar } = useToast();
  const origen = useOrigen();
  const ahora = useAhora();

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    try {
      const resp = await fetch("/api/invitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota }),
      });
      const datos = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        mostrar(datos.error ?? "No se pudo crear el link.", "error");
        return;
      }
      const { token, ...invitacion } = datos;
      setInvitaciones((prev) => [invitacion, ...prev]);
      setRecienCreada({
        id: invitacion.id,
        link: linkDeInvitacion(origen ?? "", token),
      });
      setNota("");
      mostrar("Link creado. Pásaselo ahora, dura 30 minutos.", "exito");
    } finally {
      setCreando(false);
    }
  }

  async function copiar(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      mostrar("Link copiado.", "exito");
    } catch {
      mostrar("No se pudo copiar. Selecciónalo y cópialo a mano.", "error");
    }
  }

  async function anular(invitacion: InvitacionResumen) {
    if (!window.confirm("¿Anular este link? Deja de servir en el acto.")) return;

    const resp = await fetch(`/api/invitaciones/${invitacion.id}`, { method: "DELETE" });
    if (!resp.ok) {
      mostrar("No se pudo anular.", "error");
      return;
    }
    setInvitaciones((prev) => prev.filter((i) => i.id !== invitacion.id));
    if (recienCreada?.id === invitacion.id) setRecienCreada(null);
    mostrar("Link anulado.", "exito");
  }

  return (
    <div>
      <div className="rounded-2xl bg-cyan-100 p-5 text-sm text-verde-700">
        <p>
          Cada invitación es un link distinto que sirve <strong>una sola vez</strong> y por{" "}
          <strong>{MINUTOS_VIGENCIA} minutos</strong>. Créalo cuando la persona esté lista para
          registrarse, pásaselo por WhatsApp y listo. Si se vence, creas otro.
        </p>
        <p className="mt-3 text-xs">
          El link completo se muestra una sola vez, acá, apenas lo creas: después no hay forma
          de volver a verlo.{" "}
          <Link href="/admin/usuarios" className="font-semibold underline">
            También puedes crearle la cuenta tú
          </Link>
          .
        </p>
      </div>

      <form onSubmit={crear} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="inv-nota" className="block text-sm font-semibold text-tinta">
            ¿Para quién es? (opcional)
          </label>
          <input
            id="inv-nota"
            type="text"
            placeholder="Ej: Mi hermano"
            maxLength={120}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="submit"
          disabled={creando}
          className="rounded-full bg-verde-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {creando ? "Creando…" : "Crear link"}
        </button>
      </form>

      <AnimatePresence>
        {recienCreada && (
          <motion.div
            key={recienCreada.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_SALIDA }}
            className="mt-5 rounded-2xl border-2 border-dashed border-verde-600/40 bg-white p-5"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-verde-700">
              <Icono nombre="llave" tam={16} />
              Este es el link. Cópialo ahora.
            </p>
            <p className="mt-2 break-all rounded-xl bg-cyan-100/60 px-3 py-2.5 font-mono text-[12.5px] text-verde-700">
              {recienCreada.link}
            </p>
            <button
              type="button"
              onClick={() => copiar(recienCreada.link)}
              className="mt-3 rounded-full bg-verde-600 px-5 py-2 text-xs font-semibold text-white"
            >
              Copiar link
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-3">
        {invitaciones.map((invitacion) => {
          const estado = estadoDe(invitacion, ahora);
          const etiqueta = ETIQUETAS[estado];
          const queda = tiempoRestante(invitacion.expiraEn, ahora);

          return (
            <div
              key={invitacion.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-suave)]"
            >
              <div className="min-w-0">
                <p className="font-medium text-tinta">
                  {invitacion.nota || "Invitación sin nota"}
                </p>
                <p className="text-xs text-tinta-suave">
                  Creada por {invitacion.creadaPor || "—"} ·{" "}
                  {new Date(invitacion.creadaEn).toLocaleString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {estado === "usada" && invitacion.usadaPor && ` · la usó ${invitacion.usadaPor}`}
                  {estado === "activa" &&
                    ` · le quedan ${queda.minutos}:${String(queda.segundos).padStart(2, "0")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: etiqueta.fondo, color: etiqueta.color }}
                >
                  {etiqueta.texto}
                </span>
                <button
                  type="button"
                  onClick={() => anular(invitacion)}
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-naranja-texto)" }}
                >
                  {estado === "activa" ? "Anular" : "Quitar"}
                </button>
              </div>
            </div>
          );
        })}

        {invitaciones.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-tinta-suave shadow-[var(--shadow-suave)]">
            Todavía no has creado ningún link.
          </p>
        )}
      </div>
    </div>
  );
}
