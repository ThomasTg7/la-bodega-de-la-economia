"""
Prepara el logo del sitio a partir de imagenes-bodega/logo-nuevo.png.

Salen dos piezas:

  public/logo.webp     cuadrado, el unico logo del sitio: nav, pie, panel y
                       el cartel de "Quienes somos"
  src/app/favicon.ico  multi-tamano, lo toma Next solo

Un solo archivo para todo porque en todos esos lugares el logo se dibuja en
una caja cuadrada con object-contain, y asi se descarga y se cachea una vez.

El cuadrado se arma con relleno transparente, no estirando: el logo es mas
ancho que alto (1375x1144) y sin el relleno saldria aplastado donde se pide
width == height.

Uso:  python scripts/preparar-logo.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGINAL = RAIZ / "imagenes-bodega" / "logo-nuevo.png"
PUBLIC = RAIZ / "public"

# El uso mas grande es el cartel de "Quienes somos": 128px de lado. Con 448
# queda cubierto hasta DPR 3 y el archivo se mantiene en ~68 KB.
LADO_CUADRADO = 448
# Solo los tamanos que se usan de verdad. Metiendo tambien 64/128/256 el .ico
# se iba a 171 KB, y es de lo primero que pide el navegador.
TAMANOS_ICO = [16, 32, 48]


def acuadrar(im: Image.Image, lado: int) -> Image.Image:
    """Encaja la imagen centrada en un lienzo cuadrado transparente."""
    copia = im.copy()
    copia.thumbnail((lado, lado), Image.LANCZOS)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(copia, ((lado - copia.width) // 2, (lado - copia.height) // 2))
    return lienzo


original = Image.open(ORIGINAL).convert("RGBA")

# WebP con alfa: el PNG de 1375px pesaba mas de 1 MB y el logo va en todas
# las pantallas del sitio. `quality` alto porque tiene texto fino en el borde.
cuadrado = acuadrar(original, LADO_CUADRADO)
cuadrado.save(PUBLIC / "logo.webp", "WEBP", quality=84, method=6)

# El .ico se arma desde el cuadrado ya centrado; Pillow guarda los tamanos
# pedidos dentro del mismo archivo.
acuadrar(original, 256).save(
    RAIZ / "src" / "app" / "favicon.ico",
    "ICO",
    sizes=[(t, t) for t in TAMANOS_ICO],
)

for ruta in [PUBLIC / "logo.webp", RAIZ / "src" / "app" / "favicon.ico"]:
    kb = ruta.stat().st_size / 1024
    print(f"  {ruta.name:<20} ({kb:.0f} KB)")
