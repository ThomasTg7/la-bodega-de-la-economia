"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import TarjetaSeccion, { ListaTarjetas } from "./TarjetaSeccion";
import { useToast } from "./Toast";
import { Icono } from "./Iconos";

type Props = {
  sitioUrl: string;
  linkWhatsApp: string;
  nombreNegocio: string;
};

type Destino = "sitio" | "whatsapp" | "otro";

const COLORES = [
  { nombre: "Negro", valor: "#000000" },
  { nombre: "Verde bodega", valor: "#01452B" },
  { nombre: "Verde claro", valor: "#076244" },
  { nombre: "Cyan", valor: "#146B5E" },
  { nombre: "Naranja", valor: "#C24E00" },
];

const TAMANOS = [
  { etiqueta: "1024 px", valor: 1024, ayuda: "Redes y WhatsApp" },
  { etiqueta: "2048 px", valor: 2048, ayuda: "Volantes y carteles" },
  { etiqueta: "4096 px", valor: 4096, ayuda: "Letreros grandes" },
];

/** Cuánto del ancho del QR ocupa el logo. Más de esto y deja de leerse. */
const PROPORCION_LOGO = 0.2;

/**
 * Luminancia relativa (WCAG). Sirve para avisar cuando el color elegido no
 * contrasta lo suficiente con el fondo: un QR con poco contraste lo lee la
 * cámara del que tiene buen teléfono y nadie más.
 */
function luminancia(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const canales = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function nombreArchivo(nombreNegocio: string, destino: Destino) {
  const base = nombreNegocio
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `qr-${base || "bodega"}-${destino}.png`;
}

/**
 * Dibuja el QR en un canvas al tamaño pedido y, si corresponde, le pone el
 * logo al medio. El código se genera con corrección de errores alta (H, 30%),
 * que es lo que permite tapar el centro sin que deje de leerse.
 */
async function dibujarQR(
  canvas: HTMLCanvasElement,
  {
    texto,
    tamano,
    colorQR,
    fondo,
    conLogo,
  }: { texto: string; tamano: number; colorQR: string; fondo: string; conLogo: boolean }
) {
  await QRCode.toCanvas(canvas, texto, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: tamano,
    color: { dark: colorQR, light: fondo === "transparente" ? "#0000" : fondo },
  });

  // qrcode escribe el tamaño en el style inline del canvas (720px, 4096px, el
  // que sea). Eso le gana a cualquier clase, y la vista previa terminaba con
  // 280px de ancho y 720 de alto: el QR estirado. El lienzo sigue teniendo su
  // resolución —esa vive en los atributos width/height— y el tamaño en
  // pantalla vuelve a decidirlo el CSS.
  canvas.style.removeProperty("width");
  canvas.style.removeProperty("height");

  if (!conLogo) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const logo = new Image();
  // `decode()` puede quedarse esperando cuando la pestaña no esta a la vista,
  // porque el navegador difiere el decodificado de lo que no se muestra. El
  // evento load no depende de eso y drawImage igual necesita solo eso.
  await new Promise<void>((listo, fallo) => {
    logo.onload = () => listo();
    logo.onerror = () => fallo(new Error("no se pudo cargar el logo"));
    logo.src = "/logo.webp";
  });

  const lado = canvas.width * PROPORCION_LOGO;
  const centro = canvas.width / 2;
  const x = centro - lado / 2;
  const radio = lado * 0.22;

  // Disco claro bajo el logo: sin él, los módulos oscuros del QR se mezclan
  // con el logo y las dos cosas se leen peor. Sobre fondo transparente el
  // disco va igual, en blanco, porque el logo se imprime sobre papel.
  const margen = lado * 0.12;
  ctx.save();
  ctx.fillStyle = fondo === "transparente" ? "#FFFFFF" : fondo;
  ctx.beginPath();
  ctx.roundRect(x - margen, x - margen, lado + margen * 2, lado + margen * 2, radio);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(logo, x, x, lado, lado);
}

export default function PanelQR({ sitioUrl, linkWhatsApp, nombreNegocio }: Props) {
  const [destino, setDestino] = useState<Destino>("sitio");
  const [textoLibre, setTextoLibre] = useState("");
  const [colorQR, setColorQR] = useState(COLORES[0].valor);
  const [fondo, setFondo] = useState<"#FFFFFF" | "transparente">("#FFFFFF");
  const [conLogo, setConLogo] = useState(true);
  const [tamano, setTamano] = useState(2048);
  const [descargando, setDescargando] = useState(false);
  const vista = useRef<HTMLCanvasElement>(null);
  const { mostrar } = useToast();

  const contenido =
    destino === "sitio" ? sitioUrl : destino === "whatsapp" ? linkWhatsApp : textoLibre.trim();

  const pobreContraste = fondo !== "transparente" && contraste(colorQR, fondo) < 4;

  const pintar = useCallback(async () => {
    if (!vista.current) return;

    // Sin contenido no hay QR que dibujar, pero el lienzo tiene que quedar
    // limpio y cuadrado igual: si se deja con lo anterior, muestra un codigo
    // que ya no corresponde a lo que dice el formulario.
    if (!contenido) {
      const ctx = vista.current.getContext("2d");
      ctx?.clearRect(0, 0, vista.current.width, vista.current.height);
      return;
    }

    try {
      await dibujarQR(vista.current, {
        texto: contenido,
        // La vista previa se dibuja a 720px y se muestra escalada: alcanza
        // para ver el resultado sin gastar en cada tecla el tamaño final.
        tamano: 720,
        colorQR,
        fondo,
        conLogo,
      });
    } catch {
      mostrar("Ese contenido es demasiado largo para un QR.", "error");
    }
  }, [contenido, colorQR, fondo, conLogo, mostrar]);

  useEffect(() => {
    pintar();
  }, [pintar]);

  async function descargar() {
    if (!contenido) return;
    setDescargando(true);
    try {
      const lienzo = document.createElement("canvas");
      await dibujarQR(lienzo, { texto: contenido, tamano, colorQR, fondo, conLogo });

      const blob = await new Promise<Blob | null>((resolver) =>
        lienzo.toBlob(resolver, "image/png")
      );
      if (!blob) {
        mostrar("No se pudo generar la imagen.", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo(nombreNegocio, destino);
      enlace.click();
      URL.revokeObjectURL(url);
      mostrar("QR descargado.", "exito");
    } catch {
      mostrar("No se pudo generar el QR.", "error");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ListaTarjetas className="min-w-0 space-y-5">
        <TarjetaSeccion
          titulo="¿Qué abre el QR?"
          icono="chat"
          ayuda="Lo que ve quien lo escanea con la cámara."
        >
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "sitio", texto: "La página web" },
                { id: "whatsapp", texto: "WhatsApp" },
                { id: "otro", texto: "Otra cosa" },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => setDestino(opcion.id)}
                className={
                  destino === opcion.id
                    ? "rounded-full bg-verde-600 px-5 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-tinta/15 px-5 py-2 text-sm font-semibold text-tinta-suave hover:border-tinta/30"
                }
              >
                {opcion.texto}
              </button>
            ))}
          </div>

          {destino === "otro" ? (
            <div className="mt-4">
              <label htmlFor="qr-texto" className="block text-sm font-semibold text-tinta">
                Link o texto
              </label>
              <input
                id="qr-texto"
                type="text"
                value={textoLibre}
                onChange={(e) => setTextoLibre(e.target.value)}
                placeholder="https://… o el texto que quieras"
                className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
              />
              <p className="mt-1 text-xs text-tinta-suave">
                Si es una dirección web, escríbela completa con https:// — si no, el teléfono la
                muestra como texto y no la abre.
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-cyan-100/60 px-3 py-2.5 break-all font-mono text-[12.5px] text-verde-700">
              {contenido}
            </p>
          )}
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Color" icono="imagen" ayuda="El negro es el que mejor lee siempre.">
          <div className="flex flex-wrap items-center gap-2">
            {COLORES.map((c) => (
              <button
                key={c.valor}
                type="button"
                onClick={() => setColorQR(c.valor)}
                aria-label={c.nombre}
                className="h-9 w-9 rounded-full"
                style={{
                  background: c.valor,
                  outline: colorQR === c.valor ? "2px solid var(--color-tinta)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
            <input
              type="color"
              aria-label="Elegir otro color"
              value={colorQR}
              onChange={(e) => setColorQR(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-full border border-tinta/15"
            />
          </div>

          {pobreContraste && (
            <p className="mt-3 text-xs" style={{ color: "var(--color-naranja-texto)" }}>
              Ese color contrasta poco con el fondo: puede costarle a las cámaras. Para imprimir,
              el negro es lo seguro.
            </p>
          )}

          <div className="mt-5 border-t border-tinta/10 pt-5">
            <p className="text-sm font-semibold text-tinta">Fondo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFondo("#FFFFFF")}
                className={
                  fondo === "#FFFFFF"
                    ? "rounded-full bg-verde-600 px-5 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-tinta/15 px-5 py-2 text-sm font-semibold text-tinta-suave"
                }
              >
                Blanco
              </button>
              <button
                type="button"
                onClick={() => setFondo("transparente")}
                className={
                  fondo === "transparente"
                    ? "rounded-full bg-verde-600 px-5 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-tinta/15 px-5 py-2 text-sm font-semibold text-tinta-suave"
                }
              >
                Transparente
              </button>
            </div>
            <p className="mt-1.5 text-xs text-tinta-suave">
              Transparente sirve para pegarlo sobre un diseño de color. Ojo: el QR necesita
              quedar sobre algo claro para leerse.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-tinta/10 pt-5">
            <div>
              <p className="text-sm font-semibold text-tinta">Logo al centro</p>
              <p className="text-xs text-tinta-suave">
                El código se genera con corrección alta, así que el logo no impide leerlo.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-tinta">
              <input
                type="checkbox"
                checked={conLogo}
                onChange={(e) => setConLogo(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-verde-600)]"
              />
              Ponerlo
            </label>
          </div>
        </TarjetaSeccion>

        <TarjetaSeccion titulo="Tamaño de la descarga" icono="subir">
          <div className="flex flex-wrap gap-2">
            {TAMANOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTamano(t.valor)}
                className={
                  tamano === t.valor
                    ? "rounded-xl bg-verde-600 px-4 py-2.5 text-left text-sm font-semibold text-white"
                    : "rounded-xl border border-tinta/15 px-4 py-2.5 text-left text-sm font-semibold text-tinta-suave hover:border-tinta/30"
                }
              >
                {t.etiqueta}
                <span className="block text-[11px] font-medium opacity-80">{t.ayuda}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-tinta-suave">
            Un QR es un dibujo de cuadrados: se genera al tamaño que elijas, sin agrandar ninguna
            foto, así que sale nítido para imprimir por grande que sea el cartel.
          </p>
        </TarjetaSeccion>
      </ListaTarjetas>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-semibold text-tinta">Vista previa</p>
        <div
          className="mt-3 flex items-center justify-center rounded-2xl border border-tinta/[0.07] p-5 shadow-[var(--shadow-suave)]"
          style={{
            // El damero deja ver cuándo el fondo es transparente de verdad.
            background:
              fondo === "transparente"
                ? "repeating-conic-gradient(#EDF3F1 0% 25%, #FFFFFF 0% 50%) 50% / 18px 18px"
                : "#FFFFFF",
          }}
        >
          {/* Tres cosas para que nunca se vea estirado: los atributos width y
              height dan el lienzo cuadrado desde el primer frame (sin ellos
              mide 300x150 hasta que se dibuja); `h-auto` suelta el alto, que
              en un canvas el atributo fija como si fuera CSS; y
              `aspect-square` lo mantiene cuadrado al escalar. */}
          <canvas
            ref={vista}
            width={720}
            height={720}
            className="aspect-square h-auto w-full max-w-[280px] rounded-lg"
          />
        </div>

        <button
          type="button"
          onClick={descargar}
          disabled={descargando || !contenido}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-verde-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Icono nombre="subir" tam={16} />
          {descargando ? "Generando…" : `Descargar PNG de ${tamano} px`}
        </button>
        {!contenido && (
          <p className="mt-2 text-center text-xs text-tinta-suave">
            Escribe qué debe abrir el QR para poder descargarlo.
          </p>
        )}
      </div>
    </div>
  );
}
