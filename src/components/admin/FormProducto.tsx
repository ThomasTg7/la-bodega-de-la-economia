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
import { COLORES_ACENTO } from "@/lib/constantes";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";

type Datos = {
  nombre: string;
  slug: string;
  descripcion: string;
  unidad: string;
  precioDetalle: number | null;
  precioMayorista: number | null;
  precioCaja: number | null;
  precioBin: number | null;
  kilosPorCaja: number | null;
  kilosPorBin: number | null;
  umbralMayorista: number;
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
  precioDetalle: null,
  precioMayorista: null,
  precioCaja: null,
  precioBin: null,
  kilosPorCaja: null,
  kilosPorBin: null,
  umbralMayorista: 10,
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

export default function FormProducto({ productoExistente }: { productoExistente?: Producto }) {
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
        precioDetalle: productoExistente.precioDetalle,
        precioMayorista: productoExistente.precioMayorista,
        precioCaja: productoExistente.precioCaja,
        precioBin: productoExistente.precioBin,
        kilosPorCaja: productoExistente.kilosPorCaja,
        kilosPorBin: productoExistente.kilosPorBin,
        umbralMayorista: productoExistente.umbralMayorista,
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
              id="p-detalle"
              etiqueta="Precio al detalle"
              ayuda="Lo que paga alguien que lleva poca cantidad."
              valor={datos.precioDetalle}
              onChange={(v) => actualizar("precioDetalle", v)}
              sufijo={`/${datos.unidad}`}
            />
            <CampoPrecio
              id="p-mayorista"
              etiqueta="Precio al por mayor"
              ayuda="Precio rebajado cuando llevan harto."
              valor={datos.precioMayorista}
              onChange={(v) => actualizar("precioMayorista", v)}
              sufijo={`/${datos.unidad}`}
            />

            <div>
              <CampoPrecio
                id="p-caja"
                etiqueta="Precio por caja"
                valor={datos.precioCaja}
                onChange={(v) => actualizar("precioCaja", v)}
              />
              <label htmlFor="p-kg-caja" className="mt-2 block text-xs text-tinta-suave">
                ¿Cuántos kilos trae la caja?
              </label>
              <input
                id="p-kg-caja"
                type="number"
                min={0}
                value={datos.kilosPorCaja ?? ""}
                onChange={(e) =>
                  actualizar("kilosPorCaja", e.target.value === "" ? null : Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-tinta/15 px-3 py-2 text-sm outline-none transition-colors focus:border-cyan-400"
              />
            </div>

            <div>
              <CampoPrecio
                id="p-bin"
                etiqueta="Precio por bin"
                valor={datos.precioBin}
                onChange={(v) => actualizar("precioBin", v)}
              />
              <label htmlFor="p-kg-bin" className="mt-2 block text-xs text-tinta-suave">
                ¿Cuántos kilos trae el bin?
              </label>
              <input
                id="p-kg-bin"
                type="number"
                min={0}
                value={datos.kilosPorBin ?? ""}
                onChange={(e) =>
                  actualizar("kilosPorBin", e.target.value === "" ? null : Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-tinta/15 px-3 py-2 text-sm outline-none transition-colors focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-tinta/10 pt-5">
            <label htmlFor="p-umbral" className="block text-sm font-semibold text-tinta">
              El precio por mayor se aplica desde
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="p-umbral"
                type="number"
                min={1}
                value={datos.umbralMayorista}
                onChange={(e) => actualizar("umbralMayorista", Number(e.target.value) || 1)}
                className="w-24 rounded-xl border border-tinta/15 px-3 py-2 outline-none transition-colors focus:border-cyan-400"
              />
              <span className="text-tinta-suave">{datos.unidad}</span>
            </div>
            <p className="mt-1.5 text-xs text-tinta-suave">
              En la calculadora de la página, al pasar esta cantidad se activa solo el precio
              rebajado.
            </p>
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

/** Chip que dice en qué parte de la página termina esta foto. */
function EtiquetaUso({ texto, icono }: { texto: string; icono: string }) {
  return (
    <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-cyan-700 uppercase">
      <Icono nombre={icono} tam={12} />
      {texto}
    </span>
  );
}
