"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Ajustes } from "@prisma/client";
import { AnimatePresence, motion } from "motion/react";
import TarjetaSeccion, { ListaTarjetas } from "./TarjetaSeccion";
import EditorNumerosWhatsApp from "./EditorNumerosWhatsApp";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";
import { RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { parsearNumerosWhatsapp, type NumeroWhatsApp } from "@/lib/whatsapp";

type Datos = {
  nombreNegocio: string;
  eslogan: string;
  direccion: string;
  ciudad: string;
  telefono1: string;
  telefono2: string;
  whatsapp: string;
  horario: string;
  descripcion: string;
  mapaUrl: string;
};

function parsearGaleria(json: string): string[] {
  try {
    const lista = JSON.parse(json);
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Lee la lista guardada sin caer al número único: acá vacío significa vacío. */
function parsearNumerosGuardados(json: string): NumeroWhatsApp[] {
  return parsearNumerosWhatsapp(json, "");
}

export default function PanelAjustes({ inicial }: { inicial: Ajustes }) {
  const datosIniciales: Datos = {
    nombreNegocio: inicial.nombreNegocio,
    eslogan: inicial.eslogan,
    direccion: inicial.direccion,
    ciudad: inicial.ciudad,
    telefono1: inicial.telefono1,
    telefono2: inicial.telefono2,
    whatsapp: inicial.whatsapp,
    horario: inicial.horario,
    descripcion: inicial.descripcion,
    mapaUrl: inicial.mapaUrl,
  };

  const [datos, setDatos] = useState<Datos>(datosIniciales);
  const [galeria, setGaleria] = useState<string[]>(parsearGaleria(inicial.galeria));
  const [numeros, setNumeros] = useState<NumeroWhatsApp[]>(
    parsearNumerosGuardados(inicial.numerosWhatsapp)
  );
  const [guardado, setGuardado] = useState(() =>
    JSON.stringify({
      datos: datosIniciales,
      galeria: parsearGaleria(inicial.galeria),
      numeros: parsearNumerosGuardados(inicial.numerosWhatsapp),
    })
  );

  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrandoIdx, setArrastrandoIdx] = useState<number | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const { mostrar } = useToast();
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  const actual = useMemo(
    () => JSON.stringify({ datos, galeria, numeros }),
    [datos, galeria, numeros]
  );
  const hayCambios = actual !== guardado;

  function actualizar<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    const incompletos = numeros.filter((n) => n.numero.replace(/\D/g, "").length < 8);
    if (incompletos.length > 0) {
      mostrar("Hay un número de WhatsApp incompleto. Complétalo o quítalo.", "error");
      return;
    }

    setGuardando(true);
    try {
      const resp = await fetch("/api/ajustes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          // El campo antiguo sigue siendo el respaldo cuando no hay reparto.
          whatsapp: numeros[0]?.numero || datos.whatsapp,
          numerosWhatsapp: JSON.stringify(numeros),
          galeria: JSON.stringify(galeria),
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        mostrar(err.error ?? "No se pudo guardar.", "error");
        return;
      }
      setGuardado(actual);
      mostrar("Ajustes guardados.", "exito");
    } finally {
      setGuardando(false);
    }
  }

  function agregarFotos(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    setSubiendo(true);
    Promise.all(
      Array.from(archivos).map((archivo) => {
        const formData = new FormData();
        formData.append("archivo", archivo);
        return fetch("/api/upload", { method: "POST", body: formData })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((d) => d.url as string)
          .catch(() => null);
      })
    ).then((urls) => {
      setGaleria((prev) => [...prev, ...urls.filter((u): u is string => !!u)]);
      setSubiendo(false);
    });
  }

  function quitarFoto(idx: number) {
    setGaleria((prev) => prev.filter((_, i) => i !== idx));
  }

  function soltarEn(idx: number) {
    if (arrastrandoIdx === null || arrastrandoIdx === idx) return;
    setGaleria((prev) => {
      const lista = [...prev];
      const [movido] = lista.splice(arrastrandoIdx, 1);
      lista.splice(idx, 0, movido);
      return lista;
    });
    setArrastrandoIdx(null);
  }

  return (
    <>
      <ListaTarjetas className="max-w-3xl space-y-5 pb-28">
        <TarjetaSeccion titulo="El negocio" icono="caja">
          <div className="space-y-4">
            <Campo
              etiqueta="Nombre del negocio"
              valor={datos.nombreNegocio}
              onChange={(v) => actualizar("nombreNegocio", v)}
            />
            <CampoArea
              etiqueta="Eslogan de la portada"
              valor={datos.eslogan}
              onChange={(v) => actualizar("eslogan", v)}
              filas={2}
            />
            <CampoArea
              etiqueta="Descripción del local"
              valor={datos.descripcion}
              onChange={(v) => actualizar("descripcion", v)}
              filas={3}
            />
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Reparto de la burbuja de WhatsApp"
          ayuda="Con más de un número, cada mensaje se sortea según el peso que le pongas. Quien escribe dos veces en la misma visita le sigue llegando a la misma persona."
          icono="chat"
        >
          <EditorNumerosWhatsApp numeros={numeros} onChange={setNumeros} />
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Ubicación y horario" icono="inicio">
          <div className="space-y-4">
            <Campo
              etiqueta="Dirección"
              valor={datos.direccion}
              onChange={(v) => actualizar("direccion", v)}
            />
            <Campo etiqueta="Ciudad" valor={datos.ciudad} onChange={(v) => actualizar("ciudad", v)} />
            <Campo
              etiqueta="Horario"
              valor={datos.horario}
              onChange={(v) => actualizar("horario", v)}
            />
            <Campo
              etiqueta="Link de Google Maps (opcional)"
              valor={datos.mapaUrl}
              onChange={(v) => actualizar("mapaUrl", v)}
            />
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Teléfonos de contacto"
          ayuda="Los que se muestran escritos en la página, en el pie y en la sección del local."
          icono="llave"
        >
          <div className="space-y-4">
            <Campo
              etiqueta="Teléfono 1"
              valor={datos.telefono1}
              onChange={(v) => actualizar("telefono1", v)}
            />
            <Campo
              etiqueta="Teléfono 2"
              valor={datos.telefono2}
              onChange={(v) => actualizar("telefono2", v)}
            />
            <Campo
              etiqueta="WhatsApp de respaldo"
              ayuda="Solo se usa si arriba no hay ningún número en el reparto."
              valor={datos.whatsapp}
              onChange={(v) => actualizar("whatsapp", v)}
            />
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Fotos del local"
          ayuda="Alimentan el carrusel de la sección Ubicación. Arrastra para reordenar."
          icono="imagen"
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {galeria.map((foto, i) => (
              <div
                key={foto + i}
                draggable
                onDragStart={() => setArrastrandoIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarEn(i)}
                className="relative aspect-square cursor-grab overflow-hidden rounded-xl bg-cyan-100"
              >
                <Image src={foto} alt="" fill sizes="120px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-tinta"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => inputArchivoRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-tinta/20 text-xs text-tinta-suave transition-colors hover:border-cyan-400"
            >
              <Icono nombre="subir" tam={18} />
              {subiendo ? "Subiendo…" : "Agregar"}
            </button>
            <input
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => agregarFotos(e.target.files)}
            />
          </div>
        </TarjetaSeccion>
      </ListaTarjetas>

      <AnimatePresence>
        {hayCambios && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={resorte}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-tinta/10 bg-white px-5 py-3.5 shadow-[0_-8px_24px_rgba(11,43,34,.08)] md:left-60 md:px-8"
          >
            <p className="text-sm font-medium text-tinta">
              <span className="hidden sm:inline">Tienes cambios sin guardar</span>
              <span className="sm:hidden">Sin guardar</span>
            </p>
            <motion.button
              type="button"
              onClick={guardar}
              disabled={guardando}
              whileTap={{ scale: 0.97 }}
              className="rounded-full bg-verde-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Campo({
  etiqueta,
  ayuda,
  valor,
  onChange,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-tinta">{etiqueta}</label>
      {ayuda && <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>}
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
      />
    </div>
  );
}

function CampoArea({
  etiqueta,
  valor,
  onChange,
  filas,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  filas: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-tinta">{etiqueta}</label>
      <textarea
        rows={filas}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full resize-none rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
      />
    </div>
  );
}
