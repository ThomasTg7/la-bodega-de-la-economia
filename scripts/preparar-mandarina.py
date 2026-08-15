"""
Prepara las dos imagenes del producto Mandarina, con el mismo criterio que
scripts/preparar-imagenes.py usa para palta, limon y naranja.

  imagenes-bodega/mandarinas.png      -> public/texturas/mandarinas.webp
                                         (+ el blur chico en base64)
  imagenes-bodega/mandarina-unica.png -> public/recortes/mandarina.png y @2x

El recorte NO pasa por quitar_sombra_horneada(): esa foto trae 0.42% de alfa
intermedio, o sea solo el borde antialiasado, igual que la palta. Limon y
naranja si traian sombra de caida incrustada y por eso alli hace falta.

El recorte se dimensiona por ALTO (440, el mismo de limon y naranja) para que
los tres se vean del mismo tamano optico al ponerlos juntos.

Uso:  python scripts/preparar-mandarina.py
"""
import base64
import io
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / "imagenes-bodega"
RECORTES = RAIZ / "public" / "recortes"
TEXTURAS = RAIZ / "public" / "texturas"

ALTO_RECORTE = 440

# ---------- textura del catalogo ----------
textura = Image.open(ORIG / "mandarinas.png").convert("RGB")
textura.save(TEXTURAS / "mandarinas.webp", "WEBP", quality=80, method=6)
kb = (TEXTURAS / "mandarinas.webp").stat().st_size / 1024
print(f"  mandarinas.webp  {textura.size}  ({kb:.0f} KB)")

# El blur va embebido en src/lib/blur-placeholders.ts, no como archivo: son
# 20px de ancho, pesa menos el base64 en el bundle que una peticion mas.
chico = textura.resize((20, round(20 * textura.height / textura.width)), Image.LANCZOS)
buf = io.BytesIO()
chico.save(buf, "WEBP", quality=45)
blur = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()

# ---------- recorte de la calculadora ----------
recorte = Image.open(ORIG / "mandarina-unica.png").convert("RGBA")
recorte = recorte.crop(recorte.getbbox())
dos = recorte.resize(
    (round(recorte.width * ALTO_RECORTE * 2 / recorte.height), ALTO_RECORTE * 2),
    Image.LANCZOS,
)
dos.save(RECORTES / "mandarina@2x.png", optimize=True)
uno = dos.resize((round(dos.width / 2), ALTO_RECORTE), Image.LANCZOS)
uno.save(RECORTES / "mandarina.png", optimize=True)
kb = (RECORTES / "mandarina@2x.png").stat().st_size / 1024
print(f"  mandarina.png    {uno.size} / @2x {dos.size}  ({kb:.0f} KB)")
print(f"\nDimension para DIMENSIONES_RECORTE: {{ w: {uno.width}, h: {uno.height} }}")

print("\nPega esto en BLUR_TEXTURAS, en src/lib/blur-placeholders.ts:")
print(f'  mandarinas: "{blur}",')
