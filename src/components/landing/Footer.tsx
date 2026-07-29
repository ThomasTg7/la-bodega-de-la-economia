import Image from "next/image";
import type { Ajustes } from "@prisma/client";
import { formatearTelefonoChile } from "@/lib/whatsapp";

const ENLACES = [
  { id: "catalogo", label: "Productos" },
  { id: "calculadora", label: "Calcular" },
  { id: "nosotros", label: "Quiénes somos" },
  { id: "comprar", label: "Cómo comprar" },
  { id: "contacto", label: "Contacto" },
];

export default function Footer({ ajustes }: { ajustes: Ajustes }) {
  return (
    <footer className="relative bg-verde-700 px-6 pt-14 pb-8 text-white/85 md:px-10">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5"
        style={{
          background:
            "linear-gradient(90deg, var(--color-cyan-400), var(--color-verde-500), var(--color-limon), var(--color-naranja))",
        }}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Image
            src="/logo-titulo.png"
            width={224}
            height={224}
            alt={ajustes.nombreNegocio}
            className="h-28 w-28 object-contain"
          />
          <p className="mt-3 text-sm">{ajustes.direccion}</p>
          <p className="text-sm">{ajustes.ciudad}</p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-widest text-white/60">CONTACTO</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            <a href={`tel:${ajustes.telefono1.replace(/\s/g, "")}`} className="hover:text-white">
              {formatearTelefonoChile(ajustes.telefono1)}
            </a>
            {ajustes.telefono2 && (
              <a href={`tel:${ajustes.telefono2.replace(/\s/g, "")}`} className="hover:text-white">
                {formatearTelefonoChile(ajustes.telefono2)}
              </a>
            )}
          </div>
          <p className="mt-3 text-xs font-semibold tracking-widest text-white/60">HORARIO</p>
          <p className="mt-1 text-sm">{ajustes.horario}</p>
        </div>

        <div className="sm:col-span-2 md:col-span-2">
          <p className="text-xs font-semibold tracking-widest text-white/60">SECCIONES</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {ENLACES.map((e) => (
              <a key={e.id} href={`#${e.id}`} className="hover:text-white">
                {e.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-white/60">
        © 2026 {ajustes.nombreNegocio} · {ajustes.ciudad}
      </div>
    </footer>
  );
}
