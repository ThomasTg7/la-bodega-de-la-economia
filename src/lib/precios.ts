export type ProductoParaCalculo = {
  precioDetalle: number | null;
  precioMayorista: number | null;
  umbralMayorista: number;
};

export type ResultadoCalculo = {
  unitario: number;
  total: number;
  usaMayorista: boolean;
  ahorro: number;
  faltan: number;
};

export function calcular(producto: ProductoParaCalculo, kilos: number): ResultadoCalculo {
  const usaMayorista =
    producto.precioMayorista != null && kilos >= producto.umbralMayorista;

  const unitario = usaMayorista
    ? producto.precioMayorista!
    : producto.precioDetalle ?? producto.precioMayorista ?? 0;

  const total = unitario * kilos;

  const ahorro =
    usaMayorista && producto.precioDetalle
      ? (producto.precioDetalle - unitario) * kilos
      : 0;

  const faltan = usaMayorista ? 0 : Math.max(0, producto.umbralMayorista - kilos);

  return { unitario, total, usaMayorista, ahorro, faltan };
}

export const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
