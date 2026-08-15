/**
 * `heic-convert` no trae tipos ni existe un @types publicado. Solo se usa la
 * forma de Node (buffer entra, buffer sale), así que se declara nada más eso.
 */
declare module "heic-convert" {
  type Opciones = {
    buffer: Buffer | ArrayBuffer | Uint8Array;
    format: "JPEG" | "PNG";
    /** 0 a 1. Solo aplica a JPEG. */
    quality?: number;
  };

  export default function convert(opciones: Opciones): Promise<ArrayBuffer>;
}
