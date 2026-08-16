"""
Genera las imagenes de metadatos a partir del logo en
imagenes-bodega/logo-nuevo.png: las que ve un buscador o una preview de
WhatsApp/redes, ninguna se dibuja nunca dentro de la pagina.

  src/app/opengraph-image.png  1200x630, para preview en WhatsApp/redes
  src/app/twitter-image.png    la misma imagen, Twitter/X pide su propio archivo
  src/app/icon.png             512x512, favicon moderno / PWA, fondo transparente
  src/app/apple-icon.png       180x180, iOS enmascara en redondo y espera fondo
                               opaco (nada de transparencia: se ve mal recortado)

El fondo de la og-image es el mismo verde-700 solido que ya usan Footer y
Ubicacion como fondo de seccion — no un color nuevo. La franja de abajo es el
mismo degradado de marca (cyan/verde/limon/naranja) que corona el Footer.

Uso:  python scripts/preparar-og.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
LOGO_ORIGINAL = RAIZ / "imagenes-bodega" / "logo-nuevo.png"
APP = RAIZ / "src" / "app"

VERDE_700 = (1, 69, 43)
BLANCO = (255, 255, 255)

# Mismo degradado de marca del borde superior del Footer.
FRANJA_MARCA = [
    (48, 207, 178),   # cyan-400
    (10, 122, 84),    # verde-500
    (245, 205, 7),    # limon
    (253, 112, 5),    # naranja
]


def logo_recortado() -> Image.Image:
    """El logo original trae bastante aire alrededor; se recorta al bbox del
    contenido real para que al centrarlo en un canvas no quede chico."""
    im = Image.open(LOGO_ORIGINAL).convert("RGBA")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def centrado_en(canvas: Image.Image, logo: Image.Image, alto_logo: int) -> None:
    ancho = round(logo.width * alto_logo / logo.height)
    escalado = logo.resize((ancho, alto_logo), Image.LANCZOS)
    x = (canvas.width - ancho) // 2
    y = (canvas.height - alto_logo) // 2
    canvas.paste(escalado, (x, y), escalado)


def franja_degradada(ancho: int, alto: int) -> Image.Image:
    """Barra horizontal con los 4 colores de marca en bandas iguales."""
    franja = Image.new("RGB", (ancho, alto))
    n = len(FRANJA_MARCA)
    for x in range(ancho):
        color = FRANJA_MARCA[min(n - 1, x * n // ancho)]
        for y in range(alto):
            franja.putpixel((x, y), color)
    return franja


def generar_og(ruta: Path, ancho: int, alto: int) -> None:
    canvas = Image.new("RGB", (ancho, alto), VERDE_700)
    centrado_en(canvas, logo_recortado(), round(alto * 0.5))
    barra_alto = max(6, round(alto * 0.013))
    canvas.paste(franja_degradada(ancho, barra_alto), (0, alto - barra_alto))
    canvas.save(ruta, "PNG", optimize=True)
    print(f"  {ruta.relative_to(RAIZ)}  {canvas.size}  ({ruta.stat().st_size / 1024:.0f} KB)")


def generar_icon(ruta: Path, lado: int) -> None:
    canvas = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    centrado_en(canvas, logo_recortado(), lado)
    canvas.save(ruta, "PNG", optimize=True)
    print(f"  {ruta.relative_to(RAIZ)}  {canvas.size}  ({ruta.stat().st_size / 1024:.0f} KB)")


def generar_apple_icon(ruta: Path, lado: int) -> None:
    # iOS pone su propia mascara redonda encima: fondo opaco y logo con
    # margen, o el recorte circular se come las puntas del isotipo.
    canvas = Image.new("RGB", (lado, lado), BLANCO)
    centrado_en(canvas, logo_recortado(), round(lado * 0.72))
    canvas.save(ruta, "PNG", optimize=True)
    print(f"  {ruta.relative_to(RAIZ)}  {canvas.size}  ({ruta.stat().st_size / 1024:.0f} KB)")


generar_og(APP / "opengraph-image.png", 1200, 630)
generar_og(APP / "twitter-image.png", 1200, 630)
generar_icon(APP / "icon.png", 512)
generar_apple_icon(APP / "apple-icon.png", 180)
