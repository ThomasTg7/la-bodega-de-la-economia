"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";
import { FOTOS_BODEGA } from "@/lib/constantes";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";

type Tipo = "catalogo" | "recorte";

type Props = {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onChange: (url: string) => void;
  /** "catalogo" = foto de varias frutas · "recorte" = una fruta con fondo transparente. */
  tipo: Tipo;
};

/** Cuadros grises que dejan ver dónde termina la fruta y empieza el vacío. */
const TABLERO =
  "repeating-conic-gradient(#EDF3F1 0% 25%, #FFFFFF 0% 50%) 50% / 16px 16px";

function pesoLegible(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubidorImagen({ etiqueta, ayuda, valor, onChange, tipo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [avisoAlfa, setAvisoAlfa] = useState(false);
  const [ahorro, setAhorro] = useState<{ antes: number; despues: number } | null>(null);
  const { mostrar } = useToast();
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };

  const esRecorte = tipo === "recorte";
  const presets = esRecorte ? FOTOS_BODEGA.recorte : FOTOS_BODEGA.catalogo;

  function subir(archivo: File) {
    setProgreso(0);
    setAvisoAlfa(false);
    setAhorro(null);
    const formData = new FormData();
    formData.append("archivo", archivo);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload${esRecorte ? "?tipo=recorte" : ""}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgreso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgreso(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const datos = JSON.parse(xhr.responseText);
          onChange(datos.url);
          if (esRecorte && datos.tieneAlfa === false) setAvisoAlfa(true);
          if (typeof datos.peso === "number" && typeof datos.pesoOriginal === "number") {
            setAhorro({ antes: datos.pesoOriginal, despues: datos.peso });
          }
        } catch {
          mostrar("No se pudo subir la imagen.", "error");
        }
      } else {
        try {
          const datos = JSON.parse(xhr.responseText);
          mostrar(datos.error ?? "No se pudo subir la imagen.", "error");
        } catch {
          mostrar("No se pudo subir la imagen.", "error");
        }
      }
    };
    xhr.onerror = () => {
      setProgreso(null);
      mostrar("No se pudo subir la imagen. Revisa tu conexión.", "error");
    };
    xhr.send(formData);
  }

  function manejarArchivos(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (archivo) subir(archivo);
  }

  function elegirPreset(url: string) {
    setAvisoAlfa(false);
    setAhorro(null);
    onChange(url);
  }

  return (
    <div>
      <p className="text-sm font-semibold text-tinta">{etiqueta}</p>
      {ayuda && <p className="mt-1 text-xs leading-relaxed text-tinta-suave">{ayuda}</p>}

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          manejarArchivos(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`${valor ? "Cambiar" : "Subir"} ${etiqueta.toLowerCase()}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        animate={{ scale: arrastrando && !reducido ? 1.02 : 1 }}
        transition={resorte}
        className="group relative mt-3 flex aspect-[16/11] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors"
        style={{
          borderColor: arrastrando ? "var(--color-cyan-400)" : "rgba(11,43,34,.16)",
          background: esRecorte ? TABLERO : arrastrando ? "var(--color-cyan-100)" : "#FFFFFF",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => manejarArchivos(e.target.files)}
        />

        <AnimatePresence mode="wait">
          {valor ? (
            <motion.img
              key={valor}
              src={valor}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_SALIDA }}
              className={
                esRecorte
                  ? "h-[86%] w-auto object-contain"
                  : "absolute inset-0 h-full w-full object-cover"
              }
            />
          ) : (
            <motion.div
              key="vacio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 px-4 text-center text-tinta-suave"
            >
              <Icono nombre="subir" tam={22} />
              <span className="text-xs font-medium">Arrastra una foto o haz clic</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Velo con la acción, solo cuando ya hay foto */}
        {valor && (
          <div className="absolute inset-0 flex items-center justify-center bg-tinta/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-tinta">
              <Icono nombre="imagen" tam={15} />
              Cambiar foto
            </span>
          </div>
        )}

        <AnimatePresence>
          {progreso !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/85"
            >
              <span className="text-xs font-semibold text-cyan-700">Subiendo… {progreso}%</span>
              <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-cyan-100">
                <motion.div
                  className="h-full rounded-full bg-cyan-400"
                  animate={{ width: `${progreso}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {ahorro && ahorro.antes > ahorro.despues && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden text-xs text-tinta-suave"
          >
            Optimizada: {pesoLegible(ahorro.antes)} → {pesoLegible(ahorro.despues)}{" "}
            <span className="font-semibold text-verde-600">
              ({Math.round((1 - ahorro.despues / ahorro.antes) * 100)}% menos)
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {avisoAlfa && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-start gap-1.5 overflow-hidden text-xs font-medium"
            style={{ color: "var(--color-naranja-texto)" }}
          >
            <Icono nombre="alerta" tam={14} className="mt-px" />
            Esta foto no tiene el fondo transparente, así que se verá con un recuadro detrás.
            Usa un PNG recortado.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const puesta = valor === preset.url;
          return (
            <motion.button
              key={preset.url}
              type="button"
              onClick={() => elegirPreset(preset.url)}
              whileHover={reducido ? undefined : { y: -2 }}
              whileTap={{ scale: 0.95 }}
              title={`Usar ${preset.nombre} de la bodega`}
              className="relative h-11 w-11 overflow-hidden rounded-lg border-2"
              style={{
                borderColor: puesta ? "var(--color-cyan-400)" : "rgba(11,43,34,.12)",
                background: esRecorte ? TABLERO : "#FFF",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.url}
                alt={preset.nombre}
                className={esRecorte ? "h-full w-full object-contain p-1" : "h-full w-full object-cover"}
              />
            </motion.button>
          );
        })}

        {valor && (
          <button
            type="button"
            onClick={() => {
              setAvisoAlfa(false);
              onChange("");
            }}
            className="ml-auto text-xs font-semibold"
            style={{ color: "var(--color-naranja-texto)" }}
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
