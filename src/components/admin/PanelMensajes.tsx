"use client";

import { useMemo, useState } from "react";
import type { Mensaje } from "@prisma/client";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";
import { formatearTelefonoChile, normalizarTelefonoChile } from "@/lib/whatsapp";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";

type Filtro = "todos" | "sinLeer" | "sinResponder";

const FILTROS: [Filtro, string][] = [
  ["todos", "Todos"],
  ["sinLeer", "Sin leer"],
  ["sinResponder", "Sin responder"],
];

/** Texto con el que se abre la respuesta, para no partir de cero. */
function borradorRespuesta(mensaje: Mensaje) {
  return (
    `Hola ${mensaje.nombre}, te escribimos de La bodega de la economía por tu mensaje:\n\n` +
    `"${mensaje.mensaje.slice(0, 200)}${mensaje.mensaje.length > 200 ? "…" : ""}"\n\n`
  );
}

export default function PanelMensajes({ inicial }: { inicial: Mensaje[] }) {
  const [mensajes, setMensajes] = useState(inicial);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(inicial[0]?.id ?? null);
  const { mostrar } = useToast();
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  const filtrados = useMemo(() => {
    return mensajes.filter((m) => {
      if (filtro === "sinLeer") return !m.leido;
      if (filtro === "sinResponder") return !m.respondido;
      return true;
    });
  }, [mensajes, filtro]);

  const seleccionado = mensajes.find((m) => m.id === seleccionadoId) ?? null;
  const sinResponder = mensajes.filter((m) => !m.respondido).length;

  async function abrir(mensaje: Mensaje) {
    setSeleccionadoId(mensaje.id);
    if (!mensaje.leido) {
      setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, leido: true } : m)));
      await fetch(`/api/mensajes/${mensaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leido: true }),
      }).catch(() => {});
    }
  }

  async function alternarRespondido(mensaje: Mensaje) {
    const respondido = !mensaje.respondido;
    const anterior = mensajes;
    setMensajes((prev) =>
      prev.map((m) =>
        m.id === mensaje.id
          ? { ...m, respondido, respondidoEn: respondido ? new Date() : null }
          : m
      )
    );

    const resp = await fetch(`/api/mensajes/${mensaje.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respondido }),
    }).catch(() => null);

    if (!resp?.ok) {
      setMensajes(anterior);
      mostrar("No se pudo guardar el cambio.", "error");
      return;
    }
    mostrar(respondido ? "Marcado como respondido." : "Marcado como pendiente.", "exito");
  }

  async function borrar(mensaje: Mensaje) {
    if (!window.confirm(`¿Borrar el mensaje de ${mensaje.nombre}?`)) return;
    const resp = await fetch(`/api/mensajes/${mensaje.id}`, { method: "DELETE" });
    if (!resp.ok) {
      mostrar("No se pudo borrar.", "error");
      return;
    }
    setMensajes((prev) => prev.filter((m) => m.id !== mensaje.id));
    if (seleccionadoId === mensaje.id) setSeleccionadoId(null);
    mostrar("Mensaje borrado.", "exito");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(([valor, etiqueta]) => {
          const activo = filtro === valor;
          const pendientes = valor === "sinResponder" ? sinResponder : 0;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className="relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ color: activo ? "#FFFFFF" : "var(--color-tinta-suave)" }}
            >
              {activo && (
                <motion.span
                  layoutId="pastilla-filtro-mensajes"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-verde-600"
                  transition={resorte}
                />
              )}
              {!activo && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-tinta/15"
                />
              )}
              <span className="relative z-10">{etiqueta}</span>
              {pendientes > 0 && (
                <span
                  className="relative z-10 rounded-full px-1.5 text-xs font-bold"
                  style={{
                    background: activo ? "rgba(255,255,255,.25)" : "rgba(253,112,5,.14)",
                    color: activo ? "#FFFFFF" : "var(--color-naranja-texto)",
                  }}
                >
                  {pendientes}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtrados.map((m) => (
              <motion.button
                key={m.id}
                type="button"
                layout={!reducido}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.18 } }}
                transition={{ duration: 0.3, ease: EASE_SALIDA }}
                onClick={() => abrir(m)}
                className="block w-full rounded-2xl border p-4 text-left shadow-[var(--shadow-suave)] transition-colors"
                style={{
                  background: seleccionadoId === m.id ? "var(--color-cyan-100)" : "white",
                  borderColor:
                    seleccionadoId === m.id ? "var(--color-cyan-300)" : "rgba(11,43,34,.07)",
                }}
              >
                <div className="flex items-center gap-2">
                  {!m.leido && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "var(--color-cyan-500)" }}
                    />
                  )}
                  <span
                    className="truncate"
                    style={{ fontWeight: m.leido ? 500 : 700, color: "var(--color-tinta)" }}
                  >
                    {m.nombre}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-tinta-suave">
                    {new Date(m.creadoEn).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-tinta-suave">
                  {m.asunto} · {m.mensaje}
                </p>
                {m.respondido && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-verde-600/10 px-2 py-0.5 text-[10.5px] font-semibold text-verde-600">
                    <Icono nombre="visto" tam={11} />
                    Respondido
                  </span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>

          {filtrados.length === 0 && (
            <p className="rounded-2xl border border-tinta/[0.07] bg-white p-6 text-center text-sm text-tinta-suave shadow-[var(--shadow-suave)]">
              No hay mensajes aquí.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-tinta/[0.07] bg-white p-6 shadow-[var(--shadow-suave)]">
          {!seleccionado ? (
            <p className="text-tinta-suave">Elige un mensaje para verlo.</p>
          ) : (
            <motion.div
              key={seleccionado.id}
              initial={reducido ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SALIDA }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-titulo text-verde-700" style={{ fontSize: 20 }}>
                    {seleccionado.nombre}
                  </p>
                  <p className="text-xs text-tinta-suave">
                    {seleccionado.asunto} ·{" "}
                    {new Date(seleccionado.creadoEn).toLocaleString("es-CL")}
                    {/* Los mensajes de WhatsApp ya no se guardan; esto solo
                        aparece en los que quedaron de antes. */}
                    {seleccionado.origen === "whatsapp" && (
                      <>
                        {" · vía WhatsApp"}
                        {seleccionado.destino
                          ? ` a ${formatearTelefonoChile(seleccionado.destino)}`
                          : ""}
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => borrar(seleccionado)}
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: "var(--color-naranja-texto)" }}
                >
                  Borrar
                </button>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-tinta">{seleccionado.mensaje}</p>

              <AccionesRespuesta mensaje={seleccionado} />

              <BotonRespondido
                mensaje={seleccionado}
                onAlternar={() => alternarRespondido(seleccionado)}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Llamar · WhatsApp · Correo, según los datos que dejó la persona. */
function AccionesRespuesta({ mensaje }: { mensaje: Mensaje }) {
  const { mostrar } = useToast();
  const hayTelefono = Boolean(mensaje.telefono.trim());
  const hayCorreo = Boolean(mensaje.email.trim());

  if (!hayTelefono && !hayCorreo) {
    return (
      <p className="mt-5 flex items-center gap-1.5 rounded-xl bg-tinta/[0.04] px-3.5 py-3 text-xs text-tinta-suave">
        <Icono nombre="alerta" tam={14} />
        No dejó teléfono ni correo, así que no hay por dónde responderle.
      </p>
    );
  }

  const telefonoWa = normalizarTelefonoChile(mensaje.telefono);
  const cuerpo = borradorRespuesta(mensaje);
  const asunto = "Respuesta a tu mensaje · La bodega de la economía";

  // `mailto:` depende de que el sistema tenga una app de correo asociada, y
  // en un PC sin Outlook configurado el clic no hace absolutamente nada. Por
  // eso el botón principal abre Gmail en el navegador, que siempre funciona,
  // y el mailto queda como alternativa explícita más abajo.
  const enlaceGmail =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(mensaje.email)}` +
    `&su=${encodeURIComponent(asunto)}` +
    `&body=${encodeURIComponent(cuerpo)}`;
  const enlaceMailto =
    `mailto:${mensaje.email}` +
    `?subject=${encodeURIComponent(asunto)}` +
    `&body=${encodeURIComponent(cuerpo)}`;

  async function copiarCorreo() {
    try {
      await navigator.clipboard.writeText(mensaje.email);
      mostrar("Correo copiado.", "exito");
    } catch {
      mostrar("No se pudo copiar. Selecciónalo a mano.", "error");
    }
  }

  return (
    <>
      <div className="mt-5 space-y-1 text-sm text-tinta-suave">
        {hayCorreo && <p>Correo: {mensaje.email}</p>}
        {hayTelefono && <p>Teléfono: {mensaje.telefono}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {hayTelefono && (
          <>
            <BotonAccion
              href={`tel:+${telefonoWa}`}
              icono="telefono"
              texto="Llamar"
              fondo="var(--color-cyan-400)"
              color="var(--color-verde-700)"
            />
            <BotonAccion
              href={`https://wa.me/${telefonoWa}?text=${encodeURIComponent(cuerpo)}`}
              externo
              icono="whatsapp"
              texto="Responder por WhatsApp"
              fondo="#25D366"
              color="#FFFFFF"
            />
          </>
        )}
        {hayCorreo && (
          <BotonAccion
            href={enlaceGmail}
            externo
            icono="correo"
            texto="Responder por correo"
            fondo="var(--color-verde-700)"
            color="#FFFFFF"
          />
        )}
      </div>

      {hayCorreo && (
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-suave">
          <span>Se abre Gmail. ¿Usas otro?</span>
          <a href={enlaceMailto} className="font-semibold text-cyan-700 hover:underline">
            Abrir en tu app de correo
          </a>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={copiarCorreo}
            className="font-semibold text-cyan-700 hover:underline"
          >
            Copiar la dirección
          </button>
        </p>
      )}
    </>
  );
}

function BotonAccion({
  href,
  texto,
  icono,
  fondo,
  color,
  externo,
}: {
  href: string;
  texto: string;
  icono: string;
  fondo: string;
  color: string;
  externo?: boolean;
}) {
  return (
    <motion.a
      href={href}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noopener noreferrer" : undefined}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      style={{ background: fondo, color }}
    >
      <IconoContacto nombre={icono} />
      {texto}
    </motion.a>
  );
}

/** Iconos propios de los canales de respuesta. */
function IconoContacto({ nombre }: { nombre: string }) {
  if (nombre === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39c1.44.79 3.07 1.2 4.72 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {nombre === "telefono" ? (
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
      ) : (
        <>
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
          <path d="m3 7 8.1 5.6a1.6 1.6 0 0 0 1.8 0L21 7" />
        </>
      )}
    </svg>
  );
}

function BotonRespondido({
  mensaje,
  onAlternar,
}: {
  mensaje: Mensaje;
  onAlternar: () => void;
}) {
  const reducido = useMovimientoReducido();

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-tinta/10 pt-5">
      <motion.button
        type="button"
        onClick={onAlternar}
        aria-pressed={mensaje.respondido}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        style={
          mensaje.respondido
            ? {
                background: "var(--color-verde-600)",
                borderColor: "var(--color-verde-600)",
                color: "#FFFFFF",
              }
            : {
                background: "#FFFFFF",
                borderColor: "rgba(11,43,34,.15)",
                color: "var(--color-tinta)",
              }
        }
      >
        <motion.span
          animate={reducido ? undefined : { scale: mensaje.respondido ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.35 }}
          className="flex"
        >
          <Icono nombre="visto" tam={16} />
        </motion.span>
        {mensaje.respondido ? "Respondido" : "Marcar como respondido"}
      </motion.button>

      <AnimatePresence>
        {mensaje.respondido && mensaje.respondidoEn && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-tinta-suave"
          >
            el {new Date(mensaje.respondidoEn).toLocaleString("es-CL")}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
