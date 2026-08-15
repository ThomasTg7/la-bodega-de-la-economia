"""
Normaliza los recortes entregados por el usuario y genera todas las variantes
que consume la landing.
Verificado sobre: palta-unica.png (1920x1920), limon-unico.png y
naranja-unica.png (1024x1024).
Uso:  python scripts/preparar-imagenes.py
"""
from PIL import Image, ImageFilter, ImageChops
from collections import deque
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "assets-originales"
RECORTES = RAIZ / "public" / "recortes"
TEXTURAS = RAIZ / "public" / "texturas"
RECORTES.mkdir(parents=True, exist_ok=True)
TEXTURAS.mkdir(parents=True, exist_ok=True)


def quitar_sombra_horneada(im: Image.Image) -> Image.Image:
    """
    Elimina la sombra de caida incrustada en el canal alfa, conservando
    intacto el borde antialiasado de la fruta.

    Como: el cuerpo de la fruta es alfa >= 250 (verificado en los perfiles);
    la sombra es el alfa intermedio que queda FUERA de ese cuerpo. Se dilata
    el cuerpo 2 px, se suaviza 1 px para recuperar un borde limpio, y se toma
    el minimo con el alfa original -> dentro del cuerpo manda el alfa real,
    fuera queda todo en cero.
    """
    a = im.getchannel("A")
    cuerpo = a.point(lambda p: 255 if p >= 250 else 0).convert("L")
    cuerpo = cuerpo.filter(ImageFilter.MaxFilter(5))       # dilata ~2 px
    cuerpo = cuerpo.filter(ImageFilter.GaussianBlur(1.0))  # borde antialiasado
    r = im.copy()
    r.putalpha(ImageChops.darker(a, cuerpo))               # min(original, cuerpo)
    return r


def guardar_recorte(img: Image.Image, nombre: str, alto_1x: int):
    """
    Autocrop del alfa + guardado en 1x y @2x.
    Se dimensiona por ALTO, no por ancho: la palta es retrato (0.73) y limon
    y naranja son cuadrados. Igualando el ancho quedarian de tamanos opticos
    muy distintos al ponerlos juntos en el catalogo y la calculadora.
    """
    img = img.crop(img.getbbox())
    dos = img.resize((round(img.width * alto_1x * 2 / img.height), alto_1x * 2),
                     Image.LANCZOS)
    dos.save(RECORTES / f"{nombre}@2x.png", optimize=True)
    uno = dos.resize((round(dos.width / 2), alto_1x), Image.LANCZOS)
    uno.save(RECORTES / f"{nombre}.png", optimize=True)
    kb = (RECORTES / f"{nombre}@2x.png").stat().st_size / 1024
    print(f"  {nombre}: {uno.size} / @2x {dos.size}  ({kb:.0f} KB)")


# ---------- 1. RECORTES PROTAGONISTAS ----------
# La palta ya viene sin sombra horneada (0.5 % de alfa intermedio = solo borde).
palta = Image.open(ORIG / "palta-unica.png").convert("RGBA")
guardar_recorte(palta, "palta", 620)

# Limon y naranja traen sombra de caida incrustada: se elimina.
for archivo, nombre, alto in (("limon-unico.png", "limon", 440),
                              ("naranja-unica.png", "naranja", 440)):
    im = Image.open(ORIG / archivo).convert("RGBA")
    guardar_recorte(quitar_sombra_horneada(im), nombre, alto)


# ---------- 2. ENJAMBRE DE PALTAS DEL HERO ----------
# Paltas pequenas extraidas de la textura, para las capas de fondo del hero.
def componente_semilla(binaria, semilla):
    w, h = binaria.size
    px = binaria.load()
    if not px[semilla[0], semilla[1]]:
        return Image.new("L", (w, h), 0)
    visto = bytearray(w * h)
    comp, cola = [], deque([semilla])
    visto[semilla[1] * w + semilla[0]] = 1
    while cola:
        x, y = cola.popleft()
        comp.append((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visto[ny * w + nx] and px[nx, ny]:
                visto[ny * w + nx] = 1
                cola.append((nx, ny))
    m = Image.new("L", (w, h), 0)
    mp = m.load()
    for x, y in comp:
        mp[x, y] = 255
    return m


def extraer_de_textura(archivo, caja, umbral, cierre=5):
    """Segmenta la fruta central separandola por las grietas oscuras."""
    im = Image.open(ORIG / archivo).convert("RGB").crop(caja)
    w, h = im.size
    g = im.convert("L").filter(ImageFilter.GaussianBlur(1.2))
    b = g.point(lambda p: 255 if p > umbral else 0).convert("L")
    b = b.filter(ImageFilter.MinFilter(cierre))            # erosionar: corta puentes
    m = componente_semilla(b, (w // 2, h // 2))
    m = m.filter(ImageFilter.MaxFilter(cierre + 2))        # dilatar: recuperar borde
    m = m.filter(ImageFilter.GaussianBlur(2.0))            # borde suave
    r = im.convert("RGBA")
    r.putalpha(m)
    return r.crop(r.getbbox())


# Cajas sobre paltas.png (1672x941). Solo las dos mitades abiertas tienen
# contraste suficiente (pulpa clara vs piel oscura) para segmentar por
# luminancia: las paltas enteras son oscuras sobre fondo oscuro y no separan
# (verificado: da mascaras casi vacias). El tercer elemento del enjambre del
# hero se resuelve reutilizando palta.png espejado/rotado por CSS, no con un
# tercer crop de la textura.
minis = [((345, 190, 560, 475), 78),   # primera mitad abierta
         ((1090, 530, 1350, 840), 70)]  # segunda mitad abierta
for i, (caja, umbral) in enumerate(minis, start=1):
    try:
        mini = extraer_de_textura("paltas.png", caja, umbral)
        if mini.width < 60 or mini.height < 60:
            raise ValueError("mascara demasiado chica")
        mini.resize((180, round(mini.height * 180 / mini.width)), Image.LANCZOS)\
            .save(RECORTES / f"palta-mini-{i}.png", optimize=True)
        print(f"  palta-mini-{i}: ok")
    except Exception as e:
        # El hero funciona con 1 mini + el recorte principal reutilizado.
        print(f"  palta-mini-{i}: descartada ({e})")


# ---------- 3. TEXTURAS DE FONDO ----------
for nombre in ("paltas", "limones", "naranjas"):
    im = Image.open(ORIG / f"{nombre}.png").convert("RGB")
    im.save(TEXTURAS / f"{nombre}.webp", "WEBP", quality=80, method=6)
    im.resize((40, 23), Image.LANCZOS).save(
        TEXTURAS / f"{nombre}-blur.webp", "WEBP", quality=50)
    print(f"  textura {nombre}.webp")

# Version movil del fondo del hero, YA desenfocada en el archivo: en movil
# no se aplica blur() en tiempo real (mata el rendimiento en gama media).
im = Image.open(ORIG / "paltas.png").convert("RGB")
angosta = im.resize((800, 450), Image.LANCZOS)
angosta = angosta.filter(ImageFilter.GaussianBlur(10))
from PIL import ImageEnhance
angosta = ImageEnhance.Color(angosta).enhance(1.15)
angosta = ImageEnhance.Brightness(angosta).enhance(1.06)
angosta.save(TEXTURAS / "paltas-movil.webp", "WEBP", quality=70, method=6)
print("  textura paltas-movil.webp (pre-desenfocada)")


# ---------- 4. LOGOS ----------
# Los hacia este script, escribiendo public/logo.png y public/logo-titulo.png.
# Ese logo ya no se usa: ahora es uno solo, en WebP, y lo genera
# scripts/preparar-logo.py desde imagenes-bodega/logo-nuevo.png. Correr esto
# de nuevo resucitaba los dos PNG viejos en public/.
print("Listo.")
