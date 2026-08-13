export type ProductoParaCalculo = {
  precioBase: number | null;
  precioDescuento: number | null;
  kilosDescuento: number;
};

export type ResultadoCalculo = {
  unitario: number;
  total: number;
  usaDescuento: boolean;
  ahorro: number;
  faltan: number;
};

export function calcular(producto: ProductoParaCalculo, kilos: number): ResultadoCalculo {
  const usaDescuento =
    producto.precioDescuento != null && kilos >= producto.kilosDescuento;

  const unitario = usaDescuento
    ? producto.precioDescuento!
    : producto.precioBase ?? producto.precioDescuento ?? 0;

  const total = unitario * kilos;

  const ahorro =
    usaDescuento && producto.precioBase
      ? (producto.precioBase - unitario) * kilos
      : 0;

  const faltan = usaDescuento ? 0 : Math.max(0, producto.kilosDescuento - kilos);

  return { unitario, total, usaDescuento, ahorro, faltan };
}

export const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
