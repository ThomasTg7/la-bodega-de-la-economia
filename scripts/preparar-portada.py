"""
Genera las fotos del fondo de la portada a partir de los originales de
imagenes-bodega/.

Son dos escenas que se cruzan cada 5 s. Cada una sale en dos archivos porque
el <picture> del fondo cambia de fuente bajo los 768px:

  principal        -> image-movil-y-pc.jfif   (4:3, el galpon de frente)
  principal-movil  -> Diseno sin titulo.png    (3:4, la vertical desde la calle)
  secundaria       -> imagen-movil-pc-2.jpeg  (3:4, el interior con las cajas)
  secundaria-movil -> imagen-movil-pc-2.jpeg  (la misma, sin recortar)
  tercera-movil    -> image-movil-y-pc.jfif   (la principal de escritorio,
                                               recortada a 3:4 para el telefono)

La tercera escena existe solo en movil: en escritorio esa foto ya es la
primera, y repetirla en la misma vuelta se notaria.

El recorte fino lo decide el navegador: el fondo va con object-cover, que
llena la pantalla y corta lo que sobra desde el centro. Aca solo se recorta
cuando el original es mucho mas ancho que un telefono, y siempre centrado:
es exactamente el mismo pedazo que se veria igual, guardado en su tamano util
en vez de en pixeles que el cover tira. Sin eso el navegador tiene que
agrandar la foto y se ve blanda.

Uso:  python scripts/preparar-portada.py
"""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "imagenes-bodega"
DESTINO = RAIZ / "public" / "texturas" / "portada"
DESTINO.mkdir(parents=True, exist_ok=True)

# Anchos maximos.
#
# Escritorio: el fondo ocupa 100vw y con object-cover se estira hasta llenar,
# asi que 1920 es el piso razonable para una pantalla grande.
#
# Movil: la vertical es la que sufre. En una pantalla de 375x812 el cover la
# agranda hasta ~770px de ancho logico, o sea ~1540 en DPR 2: por eso va en
# 1600 y no en los 1170 que bastarian si entrara completa. La calidad baja a
# 68 para compensar el peso; el recorte la achica tanto que no se nota.
# Las otras dos: una es vertical de fabrica y no se recorta; la tercera se
# recorta a 3:4 desde el centro y su original da 1344 de ancho, o sea que el
# tope de 1400 la deja pasar entera.
ANCHO_ESCRITORIO = 1920
ANCHO_MOVIL_VERTICAL = 1600
ANCHO_MOVIL = 1400

# nombre de salida -> (archivo original, ancho maximo, calidad, proporcion)
#
# La proporcion en None deja el original tal cual. La secundaria de escritorio
# es la unica que se recorta: la foto del interior es vertical y en una
# pantalla ancha el cover le corta casi la mitad de alto, asi que se guarda ya
# en 16:9 y esos pixeles se gastan en la franja que si se ve.
SALIDAS = {
    "principal": ("image-movil-y-pc.jfif", ANCHO_ESCRITORIO, 80, None),
    "principal-movil": ("Diseño sin título.png", ANCHO_MOVIL_VERTICAL, 68, None),
    "secundaria": ("imagen-movil-pc-2.jpeg", ANCHO_ESCRITORIO, 78, 16 / 9),
    "secundaria-movil": ("imagen-movil-pc-2.jpeg", ANCHO_MOVIL, 70, None),
    "tercera-movil": ("image-movil-y-pc.jfif", ANCHO_MOVIL, 70, 3 / 4),
}


def realzar(im: Image.Image) -> Image.Image:
    """
    Un toque de color y contraste. El velo verde apaga bastante la foto; sin
    esto el galpon queda plano detras del degradado.
    """
    im = ImageEnhance.Color(im).enhance(1.08)
    return ImageEnhance.Contrast(im).enhance(1.04)


def recortar_centrado(im: Image.Image, proporcion: float) -> Image.Image:
    """La caja mas grande con esa proporcion que entra, tomada del centro."""
    ancho, alto = im.size
    if ancho / alto > proporcion:
        nuevo = round(alto * proporcion)
        x = (ancho - nuevo) // 2
        return im.crop((x, 0, x + nuevo, alto))
    nuevo = round(ancho / proporcion)
    y = (alto - nuevo) // 2
    return im.crop((0, y, ancho, y + nuevo))


def achicar(im: Image.Image, ancho_max: int) -> Image.Image:
    """Baja al ancho pedido sin pasarse del original: no inventamos pixeles."""
    if im.width <= ancho_max:
        return im
    alto = round(im.height * ancho_max / im.width)
    return im.resize((ancho_max, alto), Image.LANCZOS)


for nombre, (archivo, ancho_max, calidad, proporcion) in SALIDAS.items():
    # exif_transpose: las fotos de telefono vienen acostadas con la rotacion
    # anotada aparte. Sin esto la del interior sale de lado.
    original = ImageOps.exif_transpose(Image.open(ORIG / archivo))
    im = realzar(original.convert("RGB"))
    if proporcion:
        im = recortar_centrado(im, proporcion)
    salida = achicar(im, ancho_max)
    ruta = DESTINO / f"{nombre}.webp"
    salida.save(ruta, "WEBP", quality=calidad, method=6)
    kb = ruta.stat().st_size / 1024
    print(f"  {ruta.name:<24} {salida.size}  ({kb:.0f} KB)")
