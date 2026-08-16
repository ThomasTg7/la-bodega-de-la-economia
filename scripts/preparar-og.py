"""
Genera las imagenes de metadatos: las que ve un buscador o una preview de
WhatsApp/redes, ninguna se dibuja nunca dentro de la pagina.

  src/app/opengraph-image.jpg  1200x630, preview al pegar el link
  src/app/twitter-image.jpg    la misma imagen, Twitter/X pide su propio archivo
  src/app/icon.png             512x512, favicon moderno / PWA, fondo transparente
  src/app/apple-icon.png       180x180, iOS enmascara en redondo y espera fondo
                               opaco (nada de transparencia: se ve mal recortado)

Las dos primeras salen de la foto de la bodega con el titular
(imagenes-bodega/og image.png); los iconos, del logo. Son fuentes distintas a
proposito: la preview de un link se mira grande y conviene que muestre el local
de verdad, mientras que un favicon de 512 px no da para mas que el isotipo.

Uso:  python scripts/preparar-og.py
"""
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
LOGO_ORIGINAL = RAIZ / "imagenes-bodega" / "logo-nuevo.png"
OG_ORIGINAL = RAIZ / "imagenes-bodega" / "og image.png"
APP = RAIZ / "src" / "app"

BLANCO = (255, 255, 255)


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


def informe(ruta: Path, imagen: Image.Image) -> None:
    print(f"  {ruta.relative_to(RAIZ)}  {imagen.size}  ({ruta.stat().st_size / 1024:.0f} KB)")


def generar_og(ruta: Path, ancho: int, alto: int) -> None:
    """1200x630 es el 1.91:1 que piden las previews. El original ya viene casi
    en esa proporcion, asi que el recorte al centro se lleva unos pocos pixeles
    de los lados y no toca ni el titular ni el logo de la esquina.

    Sale en JPEG y no en PNG porque es una foto: la misma imagen en PNG pesa
    1,5 MB contra los ~200 KB de aca, y un scraper que tarda en bajarla termina
    mostrando el link pelado.
    """
    original = Image.open(OG_ORIGINAL).convert("RGB")
    imagen = ImageOps.fit(original, (ancho, alto), Image.LANCZOS, centering=(0.5, 0.5))
    # subsampling=0 es 4:4:4. El titular es texto blanco y amarillo sobre verde
    # oscuro, y con el 4:2:0 por defecto los bordes de las letras salen con
    # halo de color.
    imagen.save(ruta, "JPEG", quality=84, subsampling=0, optimize=True, progressive=True)
    informe(ruta, imagen)


def generar_icon(ruta: Path, lado: int) -> None:
    canvas = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    centrado_en(canvas, logo_recortado(), lado)
    canvas.save(ruta, "PNG", optimize=True)
    informe(ruta, canvas)


def generar_apple_icon(ruta: Path, lado: int) -> None:
    # iOS pone su propia mascara redonda encima: fondo opaco y logo con
    # margen, o el recorte circular se come las puntas del isotipo.
    canvas = Image.new("RGB", (lado, lado), BLANCO)
    centrado_en(canvas, logo_recortado(), round(lado * 0.72))
    canvas.save(ruta, "PNG", optimize=True)
    informe(ruta, canvas)


generar_og(APP / "opengraph-image.jpg", 1200, 630)
generar_og(APP / "twitter-image.jpg", 1200, 630)
generar_icon(APP / "icon.png", 512)
generar_apple_icon(APP / "apple-icon.png", 180)
