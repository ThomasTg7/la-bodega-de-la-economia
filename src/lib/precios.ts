export type ProductoParaCalculo = {
  precioBase: number | null;
  precioDescuento: number | null;
  /** Vacio (null) = el producto no tiene descuento por volumen. */
  kilosDescuento: number | null;
};

export type ResultadoCalculo = {
  unitario: number;
  total: number;
  usaDescuento: boolean;
  ahorro: number;
  faltan: number;
};

/**
 * Un descuento por volumen necesita las dos mitades: el precio rebajado y los
 * kilos desde donde empieza a correr. Con una sola no hay escalon que aplicar,
 * asi que el producto se cobra siempre a precio de lista.
 */
export function hayDescuento(producto: ProductoParaCalculo) {
  return producto.precioDescuento != null && producto.kilosDescuento != null;
}

export function calcular(producto: ProductoParaCalculo, kilos: number): ResultadoCalculo {
  const usaDescuento = hayDescuento(producto) && kilos >= producto.kilosDescuento!;

  const unitario = usaDescuento
    ? producto.precioDescuento!
    : producto.precioBase ?? producto.precioDescuento ?? 0;

  const total = unitario * kilos;

  const ahorro =
    usaDescuento && producto.precioBase
      ? (producto.precioBase - unitario) * kilos
      : 0;

  const faltan =
    usaDescuento || !hayDescuento(producto)
      ? 0
      : Math.max(0, producto.kilosDescuento! - kilos);

  return { unitario, total, usaDescuento, ahorro, faltan };
}

export const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
