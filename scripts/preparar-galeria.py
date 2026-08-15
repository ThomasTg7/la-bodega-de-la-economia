"""
Deja listas para la web las fotos del carrusel de "Quienes somos".

Son las que vienen en imagenes-bodega/ numeradas (1, 2, 3...). Salen a
public/fotos-local/ en WebP, con el mismo criterio que usa el panel cuando
alguien sube una foto: sin recortar, sin agrandar y con la calidad alta,
porque estas se miran de cerca.

Estas tres van en el repo y no en Blob a proposito: son el contenido de
fabrica del carrusel, lo que se ve si nadie toca el panel. Las que se suban
despues desde /admin/ajustes si van a Blob y reemplazan a estas en la base.

Uso:  python scripts/preparar-galeria.py
"""
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "imagenes-bodega"
DESTINO = RAIZ / "public" / "fotos-local"
DESTINO.mkdir(parents=True, exist_ok=True)

# El carrusel nunca dibuja mas de ~330px de ancho, asi que 1200 cubre DPR 3
# de sobra. Calidad 82: son fotos de producto y de local, se miran de cerca.
#
# Las tres son verticales 3:4 (1792x2390, 1320x1736, 960x1280), que es lo que
# sale de un iPhone, y el marco del carrusel esta en esa misma proporcion. No
# se recortan: la diferencia con el 3:4 exacto es de un 1% en la del medio y
# el object-cover del carrusel se encarga.
ANCHO_MAXIMO = 1200
CALIDAD = 82

# nombre de salida -> archivo original
FOTOS = {
    "local-1": "1.png",
    "local-2": "2.jpeg",
    "local-3": "3.jpeg",
}

for nombre, archivo in FOTOS.items():
    # exif_transpose: las fotos de telefono vienen acostadas con la rotacion
    # anotada aparte (la 2 trae orientacion 1, pero no todas).
    im = ImageOps.exif_transpose(Image.open(ORIG / archivo)).convert("RGB")
    if im.width > ANCHO_MAXIMO:
        alto = round(im.height * ANCHO_MAXIMO / im.width)
        im = im.resize((ANCHO_MAXIMO, alto), Image.LANCZOS)

    ruta = DESTINO / f"{nombre}.webp"
    im.save(ruta, "WEBP", quality=CALIDAD, method=6)
    kb = ruta.stat().st_size / 1024
    print(f"  {ruta.name:<16} {im.size}  ({kb:.0f} KB)")

print("\nRutas para la base:")
print("  " + ", ".join(f'"/fotos-local/{n}.webp"' for n in FOTOS))
