"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Producto } from "@prisma/client";
import { AnimatePresence, motion } from "motion/react";
import CampoPrecio from "./CampoPrecio";
import SubidorImagen from "./SubidorImagen";
import Interruptor from "./Interruptor";
import TarjetaSeccion, { ListaTarjetas } from "./TarjetaSeccion";
import VistaPrevia from "./VistaPrevia";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";
import { COLORES_ACENTO, KILOS_BIN_REFERENCIA, PEDIDO_MINIMO_KG } from "@/lib/constantes";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";

type Datos = {
  nombre: string;
  slug: string;
  descripcion: string;
  unidad: string;
  precioBase: number | null;
  precioDescuento: number | null;
  precioCaja: number | null;
  precioBin: number | null;
  kilosPorCaja: number | null;
  kilosPorBin: number | null;
  kilosDescuento: number | null;
  mostrarCaja: boolean;
  mostrarBin: boolean;
  imagenTextura: string;
  imagenRecorte: string;
  colorAcento: string;
  activo: boolean;
  destacado: boolean;
};

const VACIO: Datos = {
  nombre: "",
  slug: "",
  descripcion: "",
  unidad: "kg",
  precioBase: null,
  precioDescuento: null,
  precioCaja: null,
  precioBin: null,
  kilosPorCaja: null,
  kilosPorBin: null,
  kilosDescuento: null,
  mostrarCaja: false,
  mostrarBin: false,
  imagenTextura: "",
  imagenRecorte: "",
  colorAcento: COLORES_ACENTO[0],
  activo: true,
  destacado: false,
};

function slugificar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FormProducto({
  productoExistente,
  // El mínimo vive en Ajustes y esta pantalla solo lo menciona en la ayuda del
  // umbral de descuento. Llega por prop desde la página, que ya consulta la
  // base; el respaldo es el mismo default de la columna.
  pedidoMinimo = PEDIDO_MINIMO_KG,
}: {
  productoExistente?: Producto;
  pedidoMinimo?: number;
}) {
  const router = useRouter();
  const { mostrar } = useToast();
  const reducido = useMovimientoReducido();
  const resorte = reducido ? { duration: 0 } : { type: "spring" as const, ...RESORTE_UI };
  const esNuevo = !productoExistente;

  const inicial: Datos = productoExistente
    ? {
        nombre: productoExistente.nombre,
        slug: productoExistente.slug,
        descripcion: productoExistente.descripcion,
        unidad: productoExistente.unidad,
        precioBase: productoExistente.precioBase,
        precioDescuento: productoExistente.precioDescuento,
        precioCaja: productoExistente.precioCaja,
        precioBin: productoExistente.precioBin,
        kilosPorCaja: productoExistente.kilosPorCaja,
        kilosPorBin: productoExistente.kilosPorBin,
        kilosDescuento: productoExistente.kilosDescuento,
        mostrarCaja: productoExistente.mostrarCaja,
        mostrarBin: productoExistente.mostrarBin,
        imagenTextura: productoExistente.imagenTextura,
        imagenRecorte: productoExistente.imagenRecorte,
        colorAcento: productoExistente.colorAcento,
        activo: productoExistente.activo,
        destacado: productoExistente.destacado,
      }
    : VACIO;

  const [datos, setDatos] = useState<Datos>(inicial);
  const [guardado, setGuardado] = useState<Datos>(inicial);
  // No hay campo para editar el slug a mano: en modo edición, nunca se
  // regenera desde el nombre; en modo creación, siempre se regenera.
  const slugTocado = !esNuevo;
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const hayCambios = useMemo(
    () => JSON.stringify(datos) !== JSON.stringify(guardado),
    [datos, guardado]
  );

  useEffect(() => {
    function avisar(e: BeforeUnloadEvent) {
      if (!hayCambios) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [hayCambios]);

  function actualizar<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarCambioNombre(nombre: string) {
    setDatos((prev) => ({
      ...prev,
      nombre,
      slug: slugTocado ? prev.slug : slugificar(nombre),
    }));
  }

  async function guardar() {
    setGuardando(true);
    try {
      const resp = await fetch(
        esNuevo ? "/api/productos" : `/api/productos/${productoExistente!.id}`,
        {
          method: esNuevo ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        mostrar(err.error ?? "No se pudo guardar.", "error");
        setGuardando(false);
        return;
      }
      const producto = await resp.json();
      mostrar("Guardado.", "exito");
      setGuardado(datos);
      if (esNuevo) {
        router.push(`/admin/productos/${producto.id}`);
      } else {
        router.refresh();
      }
    } catch {
      mostrar("No se pudo conectar. Intenta de nuevo.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!productoExistente) return;
    const resp = await fetch(`/api/productos/${productoExistente.id}`, { method: "DELETE" });
    if (!resp.ok) {
      mostrar("No se pudo eliminar.", "error");
      return;
    }
    mostrar("Producto eliminado.", "exito");
    router.push("/admin/productos");
    router.refresh();
  }

  function descartar() {
    setDatos(guardado);
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ListaTarjetas className="min-w-0 space-y-5">
        <TarjetaSeccion titulo="Lo básico" icono="caja">
          <div>
            <label htmlFor="p-nombre" className="block text-sm font-semibold text-tinta">
              Nombre
            </label>
            <input
              id="p-nombre"
              type="text"
              value={datos.nombre}
              onChange={(e) => manejarCambioNombre(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
              placeholder="Ej: Palta Hass"
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="p-desc" className="block text-sm font-semibold text-tinta">
                Descripción corta
              </label>
              <span
                className="text-xs"
                style={{
                  color:
                    datos.descripcion.length > 120
                      ? "var(--color-naranja-texto)"
                      : "var(--color-tinta-suave)",
                }}
              >
                {datos.descripcion.length}/120 recomendado
              </span>
            </div>
            <textarea
              id="p-desc"
              rows={2}
              value={datos.descripcion}
              onChange={(e) => actualizar("descripcion", e.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="p-unidad" className="block text-sm font-semibold text-tinta">
              Unidad de venta
            </label>
            <select
              id="p-unidad"
              value={datos.unidad}
              onChange={(e) => actualizar("unidad", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none transition-colors focus:border-cyan-400"
            >
              <option value="kg">Kilo</option>
              <option value="unidad">Unidad</option>
              <option value="malla">Malla</option>
            </select>
          </div>
        </TarjetaSeccion>

        {/* Las dos fotos: cada una tiene su lugar en la página */}
        <TarjetaSeccion
          titulo="Las dos fotos del producto"
          ayuda="Una para el catálogo y otra para la calculadora. No se reemplazan entre sí."
          icono="imagen"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <EtiquetaUso texto="Sale en el catálogo" icono="imagen" />
              <SubidorImagen
                tipo="catalogo"
                etiqueta="Foto de varias frutas"
                ayuda="La foto que llena la tarjeta del catálogo. Se ve mejor con harta fruta junta: un cajón de paltas, un montón de limones."
                valor={datos.imagenTextura}
                onChange={(url) => actualizar("imagenTextura", url)}
              />
            </div>
            <div>
              <EtiquetaUso texto="Sale en la calculadora" icono="calculadora" />
              <SubidorImagen
                tipo="recorte"
                etiqueta="Foto de una sola fruta"
                ayuda="Una fruta sola, recortada, que flota en la calculadora y en la portada. Tiene que ser PNG con fondo transparente."
                valor={datos.imagenRecorte}
                onChange={(url) => actualizar("imagenRecorte", url)}
              />
            </div>
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Precios" icono="calculadora">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <CampoPrecio
              id="p-base"
              etiqueta="Precio por mayor"
              ayuda="El precio de la lista. Es el que ve cualquiera, lleve lo que lleve."
              valor={datos.precioBase}
              onChange={(v) => actualizar("precioBase", v)}
              sufijo={`/${datos.unidad}`}
            />
            <CampoPrecio
              id="p-descuento"
              etiqueta="Precio con descuento"
              ayuda="El precio rebajado que se activa al pasar los kilos de más abajo. Vacío = este producto no tiene descuento por volumen."
              valor={datos.precioDescuento}
              onChange={(v) => actualizar("precioDescuento", v)}
              sufijo={`/${datos.unidad}`}
            />

            <FormatoConCasilla
              id="caja"
              etiquetaPrecio="Precio por caja"
              etiquetaKilos="¿Cuántos kilos trae la caja?"
              marcado={datos.mostrarCaja}
              onMarcar={(v) => actualizar("mostrarCaja", v)}
              precio={datos.precioCaja}
              onPrecio={(v) => actualizar("precioCaja", v)}
              kilos={datos.kilosPorCaja}
              onKilos={(v) => actualizar("kilosPorCaja", v)}
            />

            <FormatoConCasilla
              id="bin"
              etiquetaPrecio="Precio por bin"
              etiquetaKilos={`¿Cuántos kilos trae el bin? Son aprox. ${KILOS_BIN_REFERENCIA} kg de fruta.`}
              marcado={datos.mostrarBin}
              onMarcar={(v) => actualizar("mostrarBin", v)}
              precio={datos.precioBin}
              onPrecio={(v) => actualizar("precioBin", v)}
              kilos={datos.kilosPorBin}
              onKilos={(v) => actualizar("kilosPorBin", v)}
            />
          </div>

          <div className="mt-5 border-t border-tinta/10 pt-5">
            <label htmlFor="p-kilos-descuento" className="block text-sm font-semibold text-tinta">
              El descuento se aplica desde
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="p-kilos-descuento"
                type="number"
                min={1}
                value={datos.kilosDescuento ?? ""}
                placeholder="Vacío"
                onChange={(e) =>
                  actualizar(
                    "kilosDescuento",
                    e.target.value === "" ? null : Math.max(1, Number(e.target.value))
                  )
                }
                className="w-28 rounded-xl border border-tinta/15 px-3 py-2 outline-none transition-colors focus:border-cyan-400"
              />
              <span className="text-tinta-suave">{datos.unidad}</span>
            </div>
            <p className="mt-1.5 text-xs text-tinta-suave">
              Es la línea donde cambia el precio: sobre esta cantidad, la página y la
              calculadora pasan solas al precio con descuento. Vacío significa que este
              producto no tiene descuento por volumen. El pedido más chico que se acepta
              es de {pedidoMinimo} kg, así que poner menos que eso no cambia nada — el
              descuento saldría siempre.
            </p>
            {datos.precioDescuento != null && datos.kilosDescuento == null && (
              <p className="mt-2 text-xs" style={{ color: "var(--color-naranja-texto)" }}>
                Pusiste un precio con descuento pero no desde cuántos {datos.unidad} se
                aplica, así que nadie lo va a ver. Llena los dos campos o deja los dos
                vacíos.
              </p>
            )}
            {datos.precioDescuento == null && datos.kilosDescuento != null && (
              <p className="mt-2 text-xs" style={{ color: "var(--color-naranja-texto)" }}>
                Marcaste desde cuántos {datos.unidad} aplica el descuento, pero falta el
                precio rebajado.
              </p>
            )}
          </div>

          <p className="mt-4 text-xs text-tinta-suave">
            Dejar un campo de precio vacío significa &ldquo;no lo vendo así&rdquo; y ese formato
            simplemente no aparece en la página.
          </p>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Cómo se muestra" icono="ojo">
          <div>
            <p className="text-sm font-semibold text-tinta">Color de acento</p>
            <p className="mt-0.5 text-xs text-tinta-suave">
              Tiñe el halo detrás de la fruta en la calculadora.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {COLORES_ACENTO.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => actualizar("colorAcento", c)}
                  whileHover={reducido ? undefined : { scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                  transition={resorte}
                  className="h-8 w-8 rounded-full"
                  style={{
                    background: c,
                    outline: datos.colorAcento === c ? "2px solid var(--color-tinta)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
              <input
                type="color"
                aria-label="Elegir otro color"
                value={datos.colorAcento}
                onChange={(e) => actualizar("colorAcento", e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-full border border-tinta/15"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-tinta/10 pt-5">
            <div>
              <p className="text-sm font-semibold text-tinta">Destacado en la portada</p>
              <p className="text-xs text-tinta-suave">Aparece con precio en la primera pantalla.</p>
            </div>
            <Interruptor
              activo={datos.destacado}
              onChange={(v) => actualizar("destacado", v)}
              etiqueta="Destacado en la portada"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-tinta">Activo</p>
              <p className="text-xs text-tinta-suave">Se ve en la página.</p>
            </div>
            <Interruptor
              activo={datos.activo}
              onChange={(v) => actualizar("activo", v)}
              etiqueta="Activo"
            />
          </div>
        </TarjetaSeccion>

        {!esNuevo && (
          <TarjetaSeccion>
            <AnimatePresence mode="wait" initial={false}>
              {confirmandoBorrado ? (
                <motion.div
                  key="confirmar"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_SALIDA }}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <p className="text-sm font-medium text-tinta">
                    Se borra para siempre, junto con su lugar en el catálogo. ¿Seguro?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmandoBorrado(false)}
                      className="rounded-full border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={eliminar}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: "var(--color-naranja-texto)" }}
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="pedir"
                  type="button"
                  onClick={() => setConfirmandoBorrado(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-naranja-texto)" }}
                >
                  Eliminar este producto
                </motion.button>
              )}
            </AnimatePresence>
          </TarjetaSeccion>
        )}
      </ListaTarjetas>

      {/* Panel lateral: cómo queda en la página */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <VistaPrevia datos={datos} />
      </div>

      {/* Barra de guardado */}
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
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={descartar}
                className="rounded-full border border-tinta/15 px-5 py-2.5 text-sm font-semibold text-tinta"
              >
                Descartar
              </button>
              <motion.button
                type="button"
                onClick={guardar}
                disabled={guardando}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-verde-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Un formato de venta (caja o bin): la casilla manda si sale en el detalle del
 * producto, y el precio queda guardado aunque la casilla esté apagada, así que
 * volver a mostrarlo no obliga a escribirlo de nuevo.
 */
function FormatoConCasilla({
  id,
  etiquetaPrecio,
  etiquetaKilos,
  marcado,
  onMarcar,
  precio,
  onPrecio,
  kilos,
  onKilos,
}: {
  id: string;
  etiquetaPrecio: string;
  etiquetaKilos: string;
  marcado: boolean;
  onMarcar: (v: boolean) => void;
  precio: number | null;
  onPrecio: (v: number | null) => void;
  kilos: number | null;
  onKilos: (v: number | null) => void;
}) {
  return (
    <div className="rounded-xl border border-tinta/10 p-4">
      <label className="flex items-center gap-2.5 text-sm font-semibold text-tinta">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => onMarcar(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-verde-600)]"
        />
        Mostrar en el detalle
      </label>
      <p className="mt-1 text-xs text-tinta-suave">
        {marcado
          ? "Sale en “Más detalles”, en la tarjeta del producto."
          : "Queda guardado, pero no se muestra en la página."}
      </p>

      <div className="mt-3" style={{ opacity: marcado ? 1 : 0.55 }}>
        <CampoPrecio id={`p-${id}`} etiqueta={etiquetaPrecio} valor={precio} onChange={onPrecio} />
        <label htmlFor={`p-kg-${id}`} className="mt-2 block text-xs text-tinta-suave">
          {etiquetaKilos}
        </label>
        <input
          id={`p-kg-${id}`}
          type="number"
          min={0}
          value={kilos ?? ""}
          onChange={(e) => onKilos(e.target.value === "" ? null : Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-tinta/15 px-3 py-2 text-sm outline-none transition-colors focus:border-cyan-400"
        />
      </div>

      {marcado && precio == null && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-naranja-texto)" }}>
          Marcado pero sin precio: no va a salir hasta que le pongas uno.
        </p>
      )}
    </div>
  );
}

/** Chip que dice en qué parte de la página termina esta foto. */
function EtiquetaUso({ texto, icono }: { texto: string; icono: string }) {
  return (
    <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-cyan-700 uppercase">
      <Icono nombre={icono} tam={12} />
      {texto}
    </span>
  );
}
