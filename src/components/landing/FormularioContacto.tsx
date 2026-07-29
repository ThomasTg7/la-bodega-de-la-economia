"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TextoRevelado from "@/components/motion/TextoRevelado";
import SeccionEntrada from "@/components/motion/SeccionEntrada";
import { ASUNTOS_CONTACTO } from "@/lib/constantes";
import { EASE_SALIDA } from "@/lib/motion-config";

type Valores = {
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
  sitio_web: string; // honeypot
};

type Errores = Partial<Record<"nombre" | "email" | "mensaje", string>>;

const VALORES_INICIALES: Valores = {
  nombre: "",
  email: "",
  telefono: "",
  asunto: ASUNTOS_CONTACTO[0],
  mensaje: "",
  sitio_web: "",
};

function validarCampo(campo: keyof Errores, valor: string): string | undefined {
  if (campo === "nombre" && valor.trim().length < 2) {
    return "Escribe tu nombre.";
  }
  if (campo === "email" && valor.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    return "Ese correo no parece válido.";
  }
  if (campo === "mensaje" && valor.trim().length < 10) {
    return "Cuéntanos un poco más (mínimo 10 caracteres).";
  }
  return undefined;
}

export default function FormularioContacto() {
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<"normal" | "cargando" | "exito">("normal");
  const [errorEnvio, setErrorEnvio] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function actualizar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarBlur(campo: keyof Errores) {
    setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, valores[campo]) }));
  }

  function autoRedimensionar() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    const nuevosErrores: Errores = {
      nombre: validarCampo("nombre", valores.nombre),
      email: validarCampo("email", valores.email),
      mensaje: validarCampo("mensaje", valores.mensaje),
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setEstado("cargando");
    setErrorEnvio("");
    try {
      const resp = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      if (!resp.ok) {
        const datos = await resp.json().catch(() => ({}));
        setErrorEnvio(datos.error ?? "No se pudo enviar. Intenta de nuevo.");
        setEstado("normal");
        return;
      }
      setEstado("exito");
    } catch {
      setErrorEnvio("No se pudo enviar. Revisa tu conexión.");
      setEstado("normal");
    }
  }

  function reiniciar() {
    setValores(VALORES_INICIALES);
    setErrores({});
    setEstado("normal");
  }

  return (
    <section
      id="contacto"
      className="bg-white px-6 py-24 md:px-10"
    >
      <div className="mx-auto max-w-[760px]">
        <SeccionEntrada className="text-center">
          <h2
            className="font-titulo text-verde-700"
            style={{ fontSize: "var(--text-h2)", lineHeight: 1.05 }}
          >
            <TextoRevelado texto="Escríbenos" modo="palabra" as="span" />
          </h2>
          <p className="mt-3 text-tinta-suave" style={{ fontSize: "var(--text-cuerpo)" }}>
            Cuéntanos qué necesitas y te respondemos altiro.
          </p>
        </SeccionEntrada>

        <div className="relative mt-12">
          <AnimatePresence mode="wait">
            {estado === "exito" ? (
              <motion.div
                key="exito"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE_SALIDA }}
                className="flex flex-col items-center gap-4 rounded-3xl bg-verde-600 px-8 py-16 text-center text-white"
              >
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="white"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: EASE_SALIDA }}
                  />
                  <motion.path
                    d="M20 33 L28 41 L44 24"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: EASE_SALIDA, delay: 0.5 }}
                  />
                </svg>
                <p className="text-lg font-semibold">
                  ¡Listo! Recibimos tu mensaje. Te respondemos dentro del día.
                </p>
                <button
                  type="button"
                  onClick={reiniciar}
                  className="mt-2 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  Enviar otro
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="formulario"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                onSubmit={manejarEnvio}
                className="space-y-7"
                noValidate
              >
                <CampoFlotante
                  id="ctc-nombre"
                  label="Nombre"
                  valor={valores.nombre}
                  onChange={(v) => actualizar("nombre", v)}
                  onBlur={() => manejarBlur("nombre")}
                  error={errores.nombre}
                  autoComplete="name"
                  requerido
                />

                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                  <CampoFlotante
                    id="ctc-email"
                    label="Correo (opcional)"
                    tipo="email"
                    valor={valores.email}
                    onChange={(v) => actualizar("email", v)}
                    onBlur={() => manejarBlur("email")}
                    error={errores.email}
                    autoComplete="email"
                    inputMode="email"
                  />
                  <CampoFlotante
                    id="ctc-telefono"
                    label="Teléfono (opcional)"
                    tipo="tel"
                    valor={valores.telefono}
                    onChange={(v) => actualizar("telefono", v)}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="ctc-asunto"
                    className="mb-1 block text-xs font-semibold text-cyan-700"
                  >
                    Asunto
                  </label>
                  <select
                    id="ctc-asunto"
                    value={valores.asunto}
                    onChange={(e) => actualizar("asunto", e.target.value)}
                    className="w-full rounded-xl border border-tinta/15 bg-white px-3 py-3 text-tinta outline-none focus:border-cyan-400"
                  >
                    {ASUNTOS_CONTACTO.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="relative">
                    <motion.div
                      animate={errores.mensaje ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <textarea
                        ref={textareaRef}
                        id="ctc-mensaje"
                        rows={3}
                        maxLength={1000}
                        value={valores.mensaje}
                        onChange={(e) => {
                          actualizar("mensaje", e.target.value);
                          autoRedimensionar();
                        }}
                        onBlur={() => manejarBlur("mensaje")}
                        className={`peer w-full resize-none border-b-2 bg-transparent pt-6 pb-2 outline-none ${
                          errores.mensaje ? "border-naranja" : "border-tinta/15"
                        }`}
                      />
                      <label
                        htmlFor="ctc-mensaje"
                        className={`pointer-events-none absolute left-0 transition-all ${
                          valores.mensaje
                            ? "top-1 text-xs text-cyan-700"
                            : "top-6 text-base text-tinta-suave"
                        }`}
                      >
                        Mensaje
                      </label>
                    </motion.div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-tinta-suave">
                    {errores.mensaje ? (
                      <span style={{ color: "var(--color-naranja-texto)" }}>{errores.mensaje}</span>
                    ) : (
                      <span />
                    )}
                    <span>{valores.mensaje.length}/1000</span>
                  </div>
                </div>

                {/* Honeypot: invisible para personas, visible para bots */}
                <div
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                >
                  <label htmlFor="ctc-sitio-web">No completar</label>
                  <input
                    id="ctc-sitio-web"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={valores.sitio_web}
                    onChange={(e) => actualizar("sitio_web", e.target.value)}
                  />
                </div>

                {errorEnvio && (
                  <p className="text-sm" style={{ color: "var(--color-naranja-texto)" }}>
                    {errorEnvio}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={estado === "cargando"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-verde-600 py-4 font-semibold text-white transition-opacity disabled:opacity-70 sm:w-auto sm:px-10"
                >
                  {estado === "cargando" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Enviando…
                    </>
                  ) : (
                    "Enviar mensaje"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function CampoFlotante({
  id,
  label,
  tipo = "text",
  valor,
  onChange,
  onBlur,
  error,
  autoComplete,
  inputMode,
  requerido,
}: {
  id: string;
  label: string;
  tipo?: string;
  valor: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  requerido?: boolean;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const arriba = enfocado || valor.length > 0;

  return (
    <div className="relative">
      <motion.div
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          id={id}
          type={tipo}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => {
            setEnfocado(false);
            onBlur?.();
          }}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={requerido}
          className={`peer w-full border-b-2 bg-transparent pt-6 pb-2 outline-none ${
            error ? "border-naranja" : "border-tinta/15"
          }`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-0 transition-all ${
            arriba ? "top-1 text-xs text-cyan-700" : "top-6 text-base text-tinta-suave"
          }`}
        >
          {label}
        </label>
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-cyan-400"
          style={{ transformOrigin: "left", width: "100%" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: enfocado && !error ? 1 : 0 }}
          transition={{ duration: 0.35 }}
        />
      </motion.div>
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-naranja-texto)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
