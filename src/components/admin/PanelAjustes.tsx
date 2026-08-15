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
import { parsearSellos, SELLOS_DEFECTO } from "@/lib/portada";
import { MAX_FOTOS_GALERIA, parsearGaleria } from "@/lib/galeria";

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
  catalogoTitulo: string;
  catalogoBajada: string;
  /** Texto y no número: el input entrega string y dejar escribir "" mientras
   *  se corrige el valor es más cómodo que forzar un 0 en el medio. Se
   *  convierte al guardar. */
  pedidoMinimoKg: string;
};

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
    catalogoTitulo: inicial.catalogoTitulo,
    catalogoBajada: inicial.catalogoBajada,
    pedidoMinimoKg: String(inicial.pedidoMinimoKg),
  };

  const [datos, setDatos] = useState<Datos>(datosIniciales);
  const [galeria, setGaleria] = useState<string[]>(parsearGaleria(inicial.galeria));
  const [sellos, setSellos] = useState<string[]>(parsearSellos(inicial.portadaSellos));
  const [numeros, setNumeros] = useState<NumeroWhatsApp[]>(
    parsearNumerosGuardados(inicial.numerosWhatsapp)
  );
  const [guardado, setGuardado] = useState(() =>
    JSON.stringify({
      datos: datosIniciales,
      galeria: parsearGaleria(inicial.galeria),
      sellos: parsearSellos(inicial.portadaSellos),
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
    () => JSON.stringify({ datos, galeria, sellos, numeros }),
    [datos, galeria, sellos, numeros]
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

    const minimo = Number(datos.pedidoMinimoKg);
    if (!Number.isInteger(minimo) || minimo < 1) {
      mostrar("El pedido mínimo tiene que ser un número de kilos mayor que cero.", "error");
      return;
    }

    setGuardando(true);
    try {
      const resp = await fetch("/api/ajustes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          pedidoMinimoKg: minimo,
          // El campo antiguo sigue siendo el respaldo cuando no hay reparto.
          whatsapp: numeros[0]?.numero || datos.whatsapp,
          numerosWhatsapp: JSON.stringify(numeros),
          portadaSellos: JSON.stringify(sellos),
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

    // El corte va antes de subir: nada de gastar la subida de una foto que
    // después no cabe. Si el usuario elige seis de una y ya hay cuatro, se
    // suben las dos que entran y se le dice cuántas quedaron fuera.
    const libres = MAX_FOTOS_GALERIA - galeria.length;
    if (libres <= 0) {
      mostrar(`El carrusel ya tiene ${MAX_FOTOS_GALERIA} fotos. Quita alguna primero.`, "error");
      return;
    }
    const elegidos = Array.from(archivos);
    const entran = elegidos.slice(0, libres);
    if (elegidos.length > libres) {
      mostrar(`Solo caben ${libres} más: se subirán las primeras ${libres}.`, "error");
    }

    setSubiendo(true);
    Promise.all(
      entran.map((archivo) => {
        const formData = new FormData();
        formData.append("archivo", archivo);
        // `tipo=galeria`: son fotos del local, se miran de cerca y no llevan
        // transparencia. El perfil del catálogo las dejaba más comprimidas.
        return fetch("/api/upload?tipo=galeria", { method: "POST", body: formData })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((d) => d.url as string)
          .catch(() => null);
      })
    ).then((urls) => {
      const subidas = urls.filter((u): u is string => !!u);
      if (subidas.length < entran.length) {
        mostrar("Alguna foto no se pudo subir. Inténtalo de nuevo.", "error");
      }
      setGaleria((prev) => [...prev, ...subidas].slice(0, MAX_FOTOS_GALERIA));
      setSubiendo(false);
    });
  }

  /**
   * Descarga la foto al computador. No alcanza con un <a download>: las que
   * viven en Blob son de otro dominio y ahí el navegador ignora el atributo y
   * se limita a abrir la imagen. Por eso se baja a memoria y se guarda desde
   * una URL propia; si el fetch no pasa, se abre en otra pestaña, que es lo
   * que habría hecho el <a> de todas formas.
   */
  async function descargarFoto(foto: string, idx: number) {
    try {
      const resp = await fetch(foto);
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `foto-local-${idx + 1}.${blob.type.split("/")[1] || "webp"}`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(foto, "_blank", "noopener,noreferrer");
    }
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
              ayuda="La frase que va bajo el título grande, en la primera pantalla."
              valor={datos.eslogan}
              onChange={(v) => actualizar("eslogan", v)}
              filas={2}
            />
            <CampoArea
              etiqueta="Descripción del local"
              ayuda="El único párrafo de texto libre de la sección «Quiénes somos»."
              valor={datos.descripcion}
              onChange={(v) => actualizar("descripcion", v)}
              filas={3}
            />
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Sellos de la portada"
          ayuda="Las tres frases cortas que van bajo los botones, con su ícono fijo. Deja una vacía y vuelve a la de fábrica."
          icono="ojo"
        >
          <div className="space-y-4">
            {sellos.map((texto, i) => (
              <Campo
                key={i}
                etiqueta={`Sello ${i + 1}`}
                ayuda={`De fábrica: «${SELLOS_DEFECTO[i]}»`}
                valor={texto}
                onChange={(v) =>
                  setSellos((prev) => prev.map((t, j) => (j === i ? v : t)))
                }
              />
            ))}
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion
          titulo="Sección de productos"
          ayuda="El título y el párrafo que encabezan el catálogo, donde se explica que todo es al por mayor."
          icono="caja"
        >
          <div className="space-y-4">
            <Campo
              etiqueta="Título"
              valor={datos.catalogoTitulo}
              onChange={(v) => actualizar("catalogoTitulo", v)}
            />
            <CampoArea
              etiqueta="Párrafo"
              ayuda="Los precios y los kilos del descuento se editan en cada producto, no acá."
              valor={datos.catalogoBajada}
              onChange={(v) => actualizar("catalogoBajada", v)}
              filas={3}
            />
            <Campo
              etiqueta="Pedido mínimo (kg)"
              ayuda="Lo mínimo que se acepta por pedido. Sale en la etiqueta del catálogo, es donde parte la calculadora y va en el mensaje de WhatsApp. Siempre en kilos."
              tipo="numero"
              valor={datos.pedidoMinimoKg}
              onChange={(v) => actualizar("pedidoMinimoKg", v)}
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
              ayuda="A dónde lleva el botón «Cómo llegar». Déjalo vacío y se arma solo con la dirección de arriba. Si pegas uno, tiene que empezar con https://"
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
          ayuda={`Alimentan el carrusel de «Quiénes somos». Hasta ${MAX_FOTOS_GALERIA}; arrastra para reordenar.`}
          icono="imagen"
        >
          <p className="mb-3 text-xs text-tinta-suave">
            {galeria.length} de {MAX_FOTOS_GALERIA} fotos
            {galeria.length === 0 && " — sin fotos propias se muestran las de fábrica"}
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {galeria.map((foto, i) => (
              <div
                key={foto + i}
                draggable
                onDragStart={() => setArrastrandoIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltarEn(i)}
                className="group relative aspect-square cursor-grab overflow-hidden rounded-xl bg-cyan-100"
              >
                <Image src={foto} alt="" fill sizes="120px" className="object-cover" />

                {/* Los dos botones viven en la esquina de arriba. En un
                    teléfono no hay hover, así que se ven siempre. */}
                <button
                  type="button"
                  onClick={() => quitarFoto(i)}
                  aria-label={`Quitar la foto ${i + 1}`}
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

                <button
                  type="button"
                  onClick={() => descargarFoto(foto, i)}
                  aria-label={`Descargar la foto ${i + 1}`}
                  className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-tinta"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
                  </svg>
                </button>
              </div>
            ))}

            {galeria.length < MAX_FOTOS_GALERIA && (
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                disabled={subiendo}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-tinta/20 text-xs text-tinta-suave transition-colors hover:border-cyan-400 disabled:opacity-60"
              >
                <Icono nombre="subir" tam={18} />
                {subiendo ? "Subiendo…" : "Agregar"}
              </button>
            )}
            <input
              ref={inputArchivoRef}
              type="file"
              // Las extensiones van aparte de `image/*`: en Windows el .heic
              // no está registrado como imagen y el selector lo escondería.
              accept="image/*,.heic,.heif"
              multiple
              hidden
              onChange={(e) => {
                agregarFotos(e.target.files);
                // Sin esto, volver a elegir el mismo archivo no dispara el
                // change y la subida no ocurre.
                e.target.value = "";
              }}
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
  tipo = "texto",
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onChange: (v: string) => void;
  /** "numero" abre el teclado numérico en el teléfono y limita el ancho. */
  tipo?: "texto" | "numero";
}) {
  const esNumero = tipo === "numero";
  return (
    <div>
      <label className="block text-sm font-semibold text-tinta">{etiqueta}</label>
      {ayuda && <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>}
      <input
        type={esNumero ? "number" : "text"}
        {...(esNumero ? { min: 1, inputMode: "numeric" as const } : {})}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400 ${
          esNumero ? "w-32" : "w-full"
        }`}
      />
    </div>
  );
}

function CampoArea({
  etiqueta,
  ayuda,
  valor,
  onChange,
  filas,
}: {
  etiqueta: string;
  ayuda?: string;
  valor: string;
  onChange: (v: string) => void;
  filas: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-tinta">{etiqueta}</label>
      {ayuda && <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>}
      <textarea
        rows={filas}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full resize-none rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
      />
    </div>
  );
}
