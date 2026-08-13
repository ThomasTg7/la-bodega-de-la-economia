"use client";

import { useState } from "react";
import Link from "next/link";
import type { Producto } from "@prisma/client";
import { Reorder, motion, useDragControls } from "motion/react";
import Interruptor from "./Interruptor";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";
import { clp } from "@/lib/precios";
import { EASE_SALIDA, RESORTE_UI, useMovimientoReducido } from "@/lib/motion-config";

export default function ListaProductos({ inicial }: { inicial: Producto[] }) {
  const [productos, setProductos] = useState(inicial);
  const { mostrar } = useToast();

  // Reorder trabaja con los ids: el objeto del producto cambia de identidad
  // cada vez que se alterna "activo", y eso confundiría al seguimiento.
  const ids = productos.map((p) => p.id);

  function alReordenar(nuevosIds: string[]) {
    setProductos((prev) => nuevosIds.map((id) => prev.find((p) => p.id === id)!));
  }

  // Se llama al soltar. El handler que recibe cada fila se vuelve a pasar en
  // cada render, así que `ids` acá ya es el orden nuevo.
  async function guardarOrden() {
    const resp = await fetch("/api/productos/orden", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (resp.ok) mostrar("Orden guardado.", "exito");
    else mostrar("No se pudo guardar el orden.", "error");
  }

  async function alternarActivo(id: string, activo: boolean) {
    const anterior = productos;
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));

    const resp = await fetch(`/api/productos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });

    if (!resp.ok) {
      setProductos(anterior);
      mostrar("No se pudo guardar el cambio.", "error");
      return;
    }
    mostrar(activo ? "Producto visible en la página." : "Producto oculto de la página.", "exito");
  }

  if (productos.length === 0) {
    return (
      <p className="rounded-2xl border border-tinta/[0.07] bg-white p-8 text-center text-tinta-suave shadow-[var(--shadow-suave)]">
        Todavía no tienes productos. Agrega el primero.
      </p>
    );
  }

  return (
    <Reorder.Group axis="y" values={ids} onReorder={alReordenar} className="space-y-3">
      {productos.map((producto, i) => (
        <FilaProducto
          key={producto.id}
          producto={producto}
          indice={i}
          onSoltar={guardarOrden}
          onAlternar={alternarActivo}
        />
      ))}
    </Reorder.Group>
  );
}

function FilaProducto({
  producto,
  indice,
  onSoltar,
  onAlternar,
}: {
  producto: Producto;
  indice: number;
  onSoltar: () => void;
  onAlternar: (id: string, activo: boolean) => void;
}) {
  const controles = useDragControls();
  const reducido = useMovimientoReducido();
  const [arrastrando, setArrastrando] = useState(false);

  const faltaCatalogo = !producto.imagenTextura;
  const faltaCalculadora = !producto.imagenRecorte;
  const miniatura = producto.imagenTextura || producto.imagenRecorte;

  return (
    <Reorder.Item
      value={producto.id}
      dragListener={false}
      dragControls={controles}
      onDragStart={() => setArrastrando(true)}
      onDragEnd={() => {
        setArrastrando(false);
        onSoltar();
      }}
      initial={reducido ? false : { opacity: 0, y: 14 }}
      animate={{
        opacity: producto.activo ? 1 : 0.6,
        y: 0,
        transition: { duration: 0.45, ease: EASE_SALIDA, delay: reducido ? 0 : indice * 0.05 },
      }}
      whileDrag={{ scale: 1.015, boxShadow: "var(--shadow-flotante)", zIndex: 10 }}
      transition={reducido ? { duration: 0 } : { type: "spring", ...RESORTE_UI }}
      className="flex items-center gap-3 rounded-2xl border border-tinta/[0.07] bg-white p-3.5 shadow-[var(--shadow-suave)] sm:gap-4 sm:p-4"
      style={{ cursor: arrastrando ? "grabbing" : "default" }}
    >
      <button
        type="button"
        onPointerDown={(e) => controles.start(e)}
        aria-label={`Mover ${producto.nombre}`}
        className="cursor-grab touch-none text-tinta-suave/60 transition-colors hover:text-tinta-suave active:cursor-grabbing"
      >
        <Icono nombre="arrastrar" tam={18} />
      </button>

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cyan-100">
        {miniatura ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={miniatura} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-cyan-700">
            <Icono nombre="imagen" tam={18} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/productos/${producto.id}`}
          className="font-semibold text-tinta transition-colors hover:text-verde-700"
        >
          {producto.nombre}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {!producto.activo && (
            <Etiqueta tono="aviso" texto="No se ve en la página" />
          )}
          {producto.destacado && <Etiqueta tono="marca" texto="Destacado" />}
          {faltaCatalogo && <Etiqueta tono="aviso" texto="Sin foto de catálogo" />}
          {faltaCalculadora && <Etiqueta tono="aviso" texto="Sin foto de calculadora" />}
        </div>
      </div>

      <div className="hidden text-right text-sm sm:block">
        <p className="text-tinta-suave">
          Por mayor{" "}
          <span className="font-semibold text-tinta">
            {producto.precioBase != null ? clp(producto.precioBase) : "—"}
          </span>
        </p>
        <p className="text-tinta-suave">
          Desde {producto.kilosDescuento} {producto.unidad}{" "}
          <span className="font-semibold text-tinta">
            {producto.precioDescuento != null ? clp(producto.precioDescuento) : "—"}
          </span>
        </p>
      </div>

      <Interruptor
        activo={producto.activo}
        onChange={(v) => onAlternar(producto.id, v)}
        etiqueta={`Mostrar ${producto.nombre} en la página`}
      />
    </Reorder.Item>
  );
}

function Etiqueta({ texto, tono }: { texto: string; tono: "aviso" | "marca" }) {
  const esAviso = tono === "aviso";
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={
        esAviso
          ? { background: "rgba(253,112,5,.12)", color: "var(--color-naranja-texto)" }
          : { background: "var(--color-cyan-100)", color: "var(--color-cyan-700)" }
      }
    >
      {texto}
    </motion.span>
  );
}
