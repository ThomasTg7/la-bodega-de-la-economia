"use client";

import { useState } from "react";

type Props = {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: number | null;
  onChange: (v: number | null) => void;
  sufijo?: string;
};

function formatear(n: number | null) {
  if (n == null) return "";
  return new Intl.NumberFormat("es-CL").format(n);
}

/** Campo de precio: prefijo $, separador de miles automático, solo dígitos. */
export default function CampoPrecio({ id, etiqueta, ayuda, valor, onChange, sufijo }: Props) {
  const [texto, setTexto] = useState(() => formatear(valor));

  // Reacciona a que `valor` cambie desde afuera (ej: "Descartar" en el
  // formulario) sin useEffect: React permite ajustar estado durante el
  // render comparando contra el valor anterior, y evita el round-trip
  // extra de un efecto para algo que es puramente sincronizar una prop.
  const [valorSincronizado, setValorSincronizado] = useState(valor);
  if (valor !== valorSincronizado) {
    setValorSincronizado(valor);
    setTexto(formatear(valor));
  }

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const soloDigitos = e.target.value.replace(/\D/g, "");
    if (soloDigitos === "") {
      setTexto("");
      onChange(null);
      return;
    }
    const n = parseInt(soloDigitos, 10);
    setTexto(new Intl.NumberFormat("es-CL").format(n));
    onChange(n);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-tinta">
        {etiqueta}
      </label>
      {ayuda && <p className="mt-0.5 text-xs text-tinta-suave">{ayuda}</p>}
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-tinta/15 bg-white px-3 py-2.5 focus-within:border-cyan-400">
        <span className="text-tinta-suave">$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={texto}
          onChange={manejarCambio}
          placeholder="Vacío = no se vende así"
          className="w-full bg-transparent text-tinta outline-none placeholder:text-tinta-suave/60"
        />
        {sufijo && <span className="text-sm text-tinta-suave">{sufijo}</span>}
      </div>
    </div>
  );
}
