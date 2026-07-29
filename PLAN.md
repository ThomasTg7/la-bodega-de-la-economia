# PLAN DE EJECUCIÓN — La Bodega de la Economía

> **Este documento es la especificación completa. Está escrito para ser ejecutado paso a paso por un agente (Sonnet). No requiere decisiones adicionales: cada valor, coordenada, color, texto y comando ya está definido y verificado.**

**Directorio del proyecto:** `C:\Users\thoma\Documents\Proyectos\la-bodega-de-la-economia`
**Sistema:** Windows 11, PowerShell. Node v24.6.0, npm 11.5.1, Python 3.10.3 (Pillow 12.3.0 ya instalado), git 2.52.

---

## 0. RESUMEN EJECUTIVO

Construir un proyecto **Next.js 15 (App Router) full-stack** con:

1. **Landing pública** (`/`) — una sola página con scroll narrativo, fotografías recortadas en capas de profundidad, parallax, paneo/zoom/tilt, máscaras suaves y transiciones fluidas entre secciones. Mobile-first (el público objetivo es móvil).
2. **Panel de administración** (`/admin`) — CRUD de productos, precios multi-nivel, imágenes, activar/desactivar, whitelist de correos, bandeja de mensajes y ajustes del sitio. Sin inventario, sin stock.
3. **Burbuja de WhatsApp** flotante con mini-formulario que genera un deeplink `wa.me`.

**Estado actual del directorio (antes de empezar):**

```
la-bodega-de-la-economia/
├── palta-unica.png      1920×1920  3.9 MB  ← RECORTE con alfa (protagonista)
├── limon-unico.png      1024×1024  1.7 MB  ← RECORTE con alfa
├── naranja-unica.png    1024×1024  1.6 MB  ← RECORTE con alfa
├── paltas.png           1672×941   3.4 MB  ← textura de fondo
├── limones.png          1672×941   2.3 MB  ← textura de fondo
├── naranjas.png         1672×941   2.4 MB  ← textura de fondo
├── logo-con-titulo.png  1920×1920  5.1 MB  (PNG con transparencia)
├── logo-limpio.png      1920×1920  4.8 MB  (PNG con transparencia, sin banner)
└── PLAN.md              (este archivo)
```

---

## 1. ANÁLISIS DE LOS ACTIVOS (ya realizado — no repetir)

### 1.1 `logo-con-titulo.png` / `logo-limpio.png`
Sticker vectorial-ilustrado con borde blanco grueso y contorno negro. Composición: galpón/bodega **cyan-turquesa** con techo a dos aguas, camión blanco de frente saliendo del galpón, cajones de madera a los lados — naranjas a la izquierda, limones amarillos a la derecha, paltas Hass (enteras y partidas) en primer plano. `logo-con-titulo.png` añade un banner verde oscuro con borde crema y el texto **"LA BODEGA DE LA ECONOMÍA"** en blanco, tipografía condensada tipo *slab/gothic* con contorno.

**Implicancia de diseño:** el logo ya define el lenguaje visual — turquesa dominante, blanco como respiro, verde profundo para texto/UI seria, amarillo y naranja SOLO como acentos puntuales (badges, precios, hover).

### 1.2 Recortes de producto (los tres protagonistas)

El usuario entregó **tres PNG con canal alfa real, ya recortados y de calidad de estudio**. Son los objetos que van a flotar en todas las capas de profundidad. Verificados píxel a píxel:

| Archivo | Lienzo | Contenido real (bbox) | Alfa | Sombra horneada |
|---|---|---|---|---|
| `palta-unica.png` | 1920×1920 | `(433,131,1558,1674)` = **1125×1543** | 65.6 % transparente, solo 0.5 % intermedio | **No** — recorte limpio de borde duro |
| `limon-unico.png` | 1024×1024 | `(87,102,965,991)` = **878×889** | 15.2 % intermedio | **Sí** — sombra suave inferior-centro |
| `naranja-unica.png` | 1024×1024 | `(87,130,864,974)` = **777×844** | 13.7 % intermedio | **Sí** — sombra suave inferior-centro |

Descripción visual:
- **Palta** — media palta Hass vertical, ligeramente inclinada hacia la izquierda (~12°), piel oscura rugosa a la izquierda, pulpa verde-amarilla degradada y carozo café brillante. Proporción **retrato 0.73 (ancho/alto)** — mucho más alta que ancha.
- **Limón** — medio limón cortado de frente, gajos definidos, con el cuerpo entero visible detrás. Casi cuadrado (0.97).
- **Naranja** — media naranja cortada de frente, gajos muy marcados y albedo blanco. Cuadrado (1.00).

**Tres hallazgos que condicionan la implementación:**

1. **Cuerpo sólido, sombra separable.** El perfil de alfa confirma que el cuerpo de la fruta es alfa 255 uniforme; el alfa intermedio está concentrado **bajo** la fruta (limón: ramp `255 → 103 → 46 → 19 → 6 → 0` en el eje vertical). Es una sombra de caída, no una fruta semitransparente.
2. **Hay que quitar esa sombra horneada.** El plan usa una sombra de contacto **dinámica** que se achica y aclara cuando el objeto flota hacia arriba (ver «Fase 1 · 1.3 Cómo se construye la sensación de profundidad»). Con la sombra horneada, la sombra subiría junto con la fruta y el efecto de flotación se rompe; además al aplicar `tilt` la sombra se inclinaría con el objeto. Se elimina en la Fase 1 con una operación verificada (`min(alfa, dilatación del cuerpo sólido)`) que **no toca el borde antialiasado de la fruta**. Resultado comprobado: recorte puro y limpio en los tres.
3. **Compuestos sobre el fondo real, se ven correctos.** Verificado sobre blanco y sobre `#E6FAF5` (el cyan del hero): sin halo turbio, sin borde gris. No hace falta ningún retoque de color.

**Consecuencia de layout:** la palta es de proporción retrato y las otras dos cuadradas. **En el hero y la calculadora la palta se dimensiona por ALTO, no por ancho** — si no, queda desproporcionada frente al limón y la naranja. Ver §6.2 y §6.5.

### 1.3 Fotografías de textura (fondos)
Las tres restantes son **texturas full-bleed** (patrón repetido de fruta llenando el encuadre), 1672×941 px, ~16:9. Se usan como fondo desenfocado del hero y de las tarjetas del catálogo, nunca como objeto.

- `paltas.png` — paltas Hass oscuras apretadas con dos mitades abiertas. Alto contraste pulpa/piel → sirve además para extraer las paltas pequeñas del enjambre del hero (§Fase 1.2).
- `limones.png` — limones amarillos saturados, muy homogéneo.
- `naranjas.png` — naranjas con cinco mitades cortadas.

### 1.4 Paleta extraída del logo (valores muestreados píxel a píxel — usar exactamente estos)

| Rol | Hex | Origen en el logo |
|---|---|---|
| Cyan claro (primario) | `#30CFB2` | techo del galpón |
| Cyan medio | `#1DA38C` | parabrisas del camión |
| Cyan profundo | `#1C8B7A` | pared en sombra |
| Verde banner (texto/UI) | `#076244` | banner del título |
| Verde profundo | `#01452B` | borde del banner |
| Verde palta | `#224621` | piel de palta |
| Amarillo limón (acento) | `#F5CD07` | limones del cajón |
| Naranja (acento) | `#FD7005` | naranjas del cajón |
| Crema | `#FCF79D` | borde del banner |
| Blanco | `#FFFFFF` | dominante |

**Regla de proporción cromática (obligatoria):** blanco ≥ 60 % de la superficie · cyan 20 % · verde 12 % · amarillo + naranja ≤ 8 % combinados, únicamente en badges de precio, estados hover y el sello mayorista.

---

## 2. STACK Y DEPENDENCIAS

### 2.1 Decisiones tomadas
- **Framework:** Next.js 15 App Router + TypeScript + React 19.
- **Estilos:** Tailwind CSS v4 (config con `@theme` en CSS, sin `tailwind.config.js`) + CSS custom para keyframes complejos.
- **Animación:** `motion` (Framer Motion v12) para scroll-linked + `lenis` para smooth scroll.
- **Base de datos:** SQLite vía Prisma 6 (archivo `prisma/dev.db`). Imágenes subidas a `public/uploads/`.
- **Auth:** sesión propia con `jose` (JWT en cookie httpOnly) + `bcryptjs`. Sin NextAuth — menos superficie de fallo y más fácil de leer.
- **Validación:** `zod`.
- **Procesamiento de imágenes en runtime:** `sharp` (redimensionar y convertir a WebP al subir desde el admin).
- **Recorte de fotos (una sola vez, en build-time manual):** Python + Pillow.

### 2.2 Comando de instalación exacto

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

> Si `create-next-app` se niega por directorio no vacío: mover primero los 8 PNG y el `PLAN.md` a una carpeta temporal, crear el proyecto, y luego devolverlos (los PNG a `assets-originales/`, el plan al root). Ver Fase 0.

```bash
npm i motion lenis @prisma/client zod bcryptjs jose sharp clsx
```

```bash
npm i -D prisma @types/bcryptjs
```

---

## 3. ESTRUCTURA DE CARPETAS OBJETIVO

```
la-bodega-de-la-economia/
├── assets-originales/              # los 8 PNG originales, fuera de public (no se sirven)
│   ├── palta-unica.png  limon-unico.png  naranja-unica.png   # recortes del usuario
│   ├── paltas.png  limones.png  naranjas.png                 # texturas
│   └── logo-con-titulo.png  logo-limpio.png
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db                      # generado, en .gitignore
├── scripts/
│   └── preparar-imagenes.py        # normaliza recortes + texturas (Fase 1)
├── public/
│   ├── logo.png                    # logo-limpio optimizado 512px
│   ├── logo-titulo.png             # logo-con-titulo optimizado 1024px
│   ├── texturas/
│   │   ├── paltas.webp  limones.webp  naranjas.webp          # 1672×941 q80
│   │   └── paltas-blur.webp  limones-blur.webp  naranjas-blur.webp  # 40px, placeholders
│   ├── recortes/
│   │   ├── palta.png  limon.png  naranja.png                 # 1x, alfa puro
│   │   ├── palta@2x.png  limon@2x.png  naranja@2x.png        # 2x
│   │   └── palta-mini-1.png  palta-mini-2.png  palta-mini-3.png  # enjambre del hero
│   └── uploads/                    # imágenes subidas desde el admin (gitignored salvo .gitkeep)
├── src/
│   ├── app/
│   │   ├── layout.tsx  page.tsx  globals.css  not-found.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx  page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   ├── productos/page.tsx
│   │   │   ├── productos/[id]/page.tsx
│   │   │   ├── productos/nuevo/page.tsx
│   │   │   ├── accesos/page.tsx
│   │   │   ├── mensajes/page.tsx
│   │   │   └── ajustes/page.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/registro/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── productos/route.ts
│   │       ├── productos/[id]/route.ts
│   │       ├── productos/orden/route.ts
│   │       ├── upload/route.ts
│   │       ├── accesos/route.ts
│   │       ├── accesos/[id]/route.ts
│   │       ├── mensajes/route.ts
│   │       ├── mensajes/[id]/route.ts
│   │       └── ajustes/route.ts
│   ├── components/
│   │   ├── landing/
│   │   │   ├── IntroOverlay.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Catalogo.tsx
│   │   │   ├── TarjetaProducto.tsx
│   │   │   ├── Calculadora.tsx
│   │   │   ├── Ubicacion.tsx
│   │   │   ├── CarruselFotos.tsx
│   │   │   ├── FormularioContacto.tsx
│   │   │   ├── BurbujaWhatsApp.tsx
│   │   │   ├── NavFlotante.tsx
│   │   │   └── Footer.tsx
│   │   ├── motion/
│   │   │   ├── SmoothScroll.tsx
│   │   │   ├── CapaParallax.tsx
│   │   │   ├── TextoRevelado.tsx
│   │   │   ├── ObjetoFlotante.tsx
│   │   │   ├── TiltMouse.tsx
│   │   │   └── SeccionEntrada.tsx
│   │   └── admin/
│   │       ├── BarraLateral.tsx
│   │       ├── FormProducto.tsx
│   │       ├── SubidorImagen.tsx
│   │       ├── CampoPrecio.tsx
│   │       ├── Interruptor.tsx
│   │       └── Toast.tsx
│   └── lib/
│       ├── db.ts  auth.ts  sesion.ts  precios.ts  whatsapp.ts
│       ├── validaciones.ts  constantes.ts  motion-config.ts
├── middleware.ts
├── .env  .env.example
└── README.md
```

---

## 4. DESIGN SYSTEM

### 4.1 Tokens — `src/app/globals.css` (Tailwind v4)

```css
@import "tailwindcss";

@theme {
  /* Marca */
  --color-cyan-100: #E6FAF5;
  --color-cyan-200: #B8F0E4;
  --color-cyan-300: #7FE3CE;
  --color-cyan-400: #30CFB2;
  --color-cyan-500: #1DA38C;
  --color-cyan-600: #1C8B7A;
  --color-cyan-700: #146B5E;

  --color-verde-400: #12946A;
  --color-verde-500: #0A7A54;
  --color-verde-600: #076244;
  --color-verde-700: #01452B;
  --color-verde-palta: #224621;

  --color-limon: #F5CD07;
  --color-naranja: #FD7005;
  --color-crema: #FCF79D;

  --color-tinta: #0B2B22;      /* texto principal, NO negro puro */
  --color-tinta-suave: #4A6A60;

  /* Tipografía */
  --font-titulo: "Archivo Black", "Arial Black", system-ui, sans-serif;
  --font-cuerpo: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;

  /* Sombras — nunca negro puro, siempre teñidas de verde */
  --shadow-suave: 0 2px 8px rgba(11,43,34,.06), 0 8px 24px rgba(11,43,34,.06);
  --shadow-media: 0 4px 16px rgba(11,43,34,.08), 0 16px 48px rgba(11,43,34,.10);
  --shadow-flotante: 0 24px 64px rgba(11,43,34,.18), 0 8px 20px rgba(11,43,34,.10);
  /* Sombra de contacto para recortes: elipse difusa bajo el objeto */
  --shadow-recorte: drop-shadow(0 24px 28px rgba(11,43,34,.28));

  /* Curvas de easing — usar SIEMPRE estas, nunca `ease` por defecto */
  --ease-salida: cubic-bezier(.16,1,.3,1);        /* expo-out: entradas */
  --ease-suave:  cubic-bezier(.65,0,.35,1);       /* in-out: transiciones */
  --ease-rebote: cubic-bezier(.34,1.56,.64,1);    /* back-out: badges, sellos */
}
```

**Tipografías:** cargar con `next/font/google` en `layout.tsx`:
- Títulos: `Archivo_Black` (peso 400 único) — condensada, pesada, hace juego con el banner del logo.
- Cuerpo: `Plus_Jakarta_Sans` (400/500/600/800).
- Números de precio: `Plus Jakarta Sans` 800 con `font-variant-numeric: tabular-nums` para que no bailen al animar.

### 4.2 Escala tipográfica fluida
Usar `clamp()` en todos los tamaños grandes:

```css
--texto-hero: clamp(2.75rem, 11vw, 8rem);
--texto-h2:   clamp(2rem, 6vw, 4.5rem);
--texto-h3:   clamp(1.25rem, 3vw, 2rem);
--texto-cuerpo: clamp(1rem, 1.6vw, 1.125rem);
```

### 4.3 Reglas de movimiento (no negociables)
1. **Solo `transform` y `opacity`** en animaciones de scroll. Prohibido animar `top/left/width/height/margin`.
2. Toda capa parallax lleva `will-change: transform` y `transform: translate3d(...)`.
3. **Todo valor de scroll pasa por `useSpring`** (`{ stiffness: 90, damping: 26, mass: .5 }`) — esto es lo que produce la sensación "realista" que pide el brief: el movimiento tiene inercia, no sigue el scroll pegado 1:1.
4. **Fondo siempre más lento que el frente.** Factores de profundidad fijos: fondo `0.10`, medio `0.28`, frente `0.55`, sujeto `0.75`.
5. `prefers-reduced-motion: reduce` → desactivar Lenis, poner todas las duraciones en `0.01s`, dejar solo fades de opacidad. Implementado en `motion-config.ts` como hook `usaMovimientoReducido()`.
6. En móvil (`< 768px`): reducir factores de parallax a la mitad y **desactivar tilt por mouse** (no existe hover táctil).

---

## FASE 0 — Preparación del repositorio

1. Crear `assets-originales/` y mover ahí los 8 PNG del root.
2. Ejecutar `create-next-app` (comando de §2.2) e instalar dependencias.
3. `git init` + primer commit.
4. Crear `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   SESION_SECRETO="<generar: openssl rand -base64 32>"
   ADMIN_EMAIL_INICIAL="thomasgomeztg7@gmail.com"
   ADMIN_PASS_INICIAL="cambiar-esto-123"
   ```
   Duplicar como `.env.example` sin valores reales. Añadir `.env`, `prisma/dev.db`, `public/uploads/*` (excepto `.gitkeep`) al `.gitignore`.
5. Borrar el boilerplate de `page.tsx` y `globals.css`; escribir `globals.css` con los tokens de §4.1.

---

## FASE 1 — Pipeline de imágenes: normalizar recortes y generar capas

**Los tres recortes protagonistas ya existen y son de buena calidad** (`palta-unica.png`, `limon-unico.png`, `naranja-unica.png`). Esta fase **no los recorta**: los normaliza para que puedan funcionar como objeto físico dentro de las capas de parallax.

**Qué hace el script, y por qué cada paso:**

| Paso | Por qué |
|---|---|
| **Quitar la sombra horneada** (solo limón y naranja) | El plan aplica una sombra de contacto dinámica que se achica cuando el objeto flota y se inclina con el `tilt`. Una sombra pegada al PNG flotaría junto con la fruta y rompería la ilusión física, y con `tilt` se inclinaría con el objeto. Además deja las tres consistentes: la palta ya viene sin sombra. |
| **Autocrop del alfa** | La palta trae un lienzo de 1920×1920 para 1125×1543 de contenido, y la naranja está descentrada (160 px vacíos a la derecha). Sin autocrop, el centrado por CSS queda torcido y se transportan megabytes de píxeles vacíos. |
| **Generar `@2x` y `1x`** | El original de la palta pesa 3.9 MB. Servido tal cual arruina el LCP en móvil. |
| **Texturas a WebP + miniatura desenfocada** | Fondos del hero y de las tarjetas, más el `placeholder="blur"` de `next/image`. |

### 1.1 Crear `scripts/preparar-imagenes.py`

```python
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


# Cajas sobre paltas.png (1672x941). La primera esta verificada.
minis = [((1090, 530, 1350, 840), 70),   # segunda mitad abierta
         ((760, 60, 960, 300), 55),      # palta entera
         ((1400, 620, 1620, 880), 55)]   # palta entera
for i, (caja, umbral) in enumerate(minis, start=1):
    try:
        mini = extraer_de_textura("paltas.png", caja, umbral)
        if mini.width < 60 or mini.height < 60:
            raise ValueError("mascara demasiado chica")
        mini.resize((180, round(mini.height * 180 / mini.width)), Image.LANCZOS)\
            .save(RECORTES / f"palta-mini-{i}.png", optimize=True)
        print(f"  palta-mini-{i}: ok")
    except Exception as e:
        # El hero funciona con 2 minis. No bloquear por esto.
        print(f"  palta-mini-{i}: descartada ({e})")


# ---------- 3. TEXTURAS DE FONDO ----------
for nombre in ("paltas", "limones", "naranjas"):
    im = Image.open(ORIG / f"{nombre}.png").convert("RGB")
    im.save(TEXTURAS / f"{nombre}.webp", "WEBP", quality=80, method=6)
    im.resize((40, 23), Image.LANCZOS).save(
        TEXTURAS / f"{nombre}-blur.webp", "WEBP", quality=50)
    print(f"  textura {nombre}.webp")


# ---------- 4. LOGOS ----------
pub = RAIZ / "public"
Image.open(ORIG / "logo-limpio.png").resize((512, 512), Image.LANCZOS)\
    .save(pub / "logo.png", optimize=True)
Image.open(ORIG / "logo-con-titulo.png").resize((1024, 1024), Image.LANCZOS)\
    .save(pub / "logo-titulo.png", optimize=True)
print("Listo.")
```

### 1.2 Verificación obligatoria tras ejecutar

1. Abrir `public/recortes/limon.png` y `naranja.png` **compuestos sobre blanco** y confirmar que **no queda sombra ni halo gris** bajo la fruta. Esta operación ya se probó durante la preparación del plan: el resultado es un recorte puro con el borde intacto.
2. Confirmar que `palta.png` conserva su inclinación natural y el borde rugoso de la piel, sin comerse píxeles.
3. Tamaños de salida esperados: `palta.png` ≈ 452×620, `limon.png` ≈ 427×440, `naranja.png` ≈ 440×440.
4. `palta@2x.png` debe pesar **menos de 600 KB**. Si se pasa, bajar `alto_1x` de la palta a 560.
5. Revisar las tres `palta-mini-*.png`. Las que salgan sucias o vacías se descartan sin drama — el enjambre del hero funciona con dos.

> **Si algún recorte se degrada al quitar la sombra** (borde comido o dentado), subir el umbral de `cuerpo` de `250` a `254` y la dilatación de `MaxFilter(5)` a `MaxFilter(7)`. En el peor caso, usar el PNG original tal cual y desactivar la sombra de contacto dinámica **solo para esa fruta** — nunca dejar sombra doble.

### 1.3 Cómo se construye la sensación de profundidad
Cada capa se compone con tres recursos combinados:

| Recurso | Implementación |
|---|---|
| **Separación figura-fondo** | El recorte PNG tiene alfa real → se sitúa sobre la textura desenfocada. |
| **Desenfoque por distancia** | Fondo: `filter: blur(14px) saturate(1.15)`. Capa media: `blur(4px)`. Sujeto: `blur(0)`. |
| **Sombra de contacto** | `filter: var(--shadow-recorte)` sobre el `<img>` del recorte + un `<div>` elipse `radial-gradient(ellipse, rgba(11,43,34,.22), transparent 70%)` bajo él, que se **escala inversamente** al eje Y del objeto flotante (cuando el objeto sube, la sombra se achica y aclara). Esto es lo que hace que se lea como un objeto físico y no como un sticker. |
| **Escala por profundidad** | Fondo `scale(1.18)` fijo (evita bordes vacíos al desplazarse), capas frontales `scale(1.0)`. |
| **Máscara suave de sección** | `mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)` en cada fondo fotográfico → las fotos nunca cortan en seco. |

---

## FASE 2 — Base de datos

### 2.1 `prisma/schema.prisma`

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model Producto {
  id            String   @id @default(cuid())
  nombre        String                      // "Palta Hass"
  slug          String   @unique            // "palta-hass"
  descripcion   String   @default("")       // texto corto del catálogo
  emoji         String   @default("")       // fallback si no hay imagen
  unidad        String   @default("kg")     // kg | unidad | malla

  // Precios en CLP enteros. null = "no se vende en ese formato" -> no se muestra.
  precioDetalle    Int?
  precioMayorista  Int?
  precioCaja       Int?
  precioBin        Int?

  // Metadatos de formato, se muestran junto al precio
  kilosPorCaja     Int?     // 10 -> "Caja 10 kg"
  kilosPorBin      Int?     // 400 -> "Bin 400 kg"
  umbralMayorista  Int      @default(10)   // kg desde los que aplica precio mayorista

  imagenTextura String   @default("")   // fondo full-bleed de la tarjeta
  imagenRecorte String   @default("")   // PNG con alfa que flota sobre la tarjeta
  colorAcento   String   @default("#30CFB2")

  activo        Boolean  @default(true)
  destacado     Boolean  @default(false)  // aparece en el hero
  orden         Int      @default(0)

  creadoEn      DateTime @default(now())
  actualizadoEn DateTime @updatedAt
}

model Usuario {
  id           String   @id @default(cuid())
  email        String   @unique
  nombre       String   @default("")
  hashClave    String
  rol          String   @default("admin")   // admin | editor
  creadoEn     DateTime @default(now())
  ultimoAcceso DateTime?
}

/// Correos autorizados a crearse una cuenta en /admin/registro.
model CorreoAutorizado {
  id         String    @id @default(cuid())
  email      String    @unique
  nota       String    @default("")
  usado      Boolean   @default(false)
  invitadoPor String   @default("")
  creadoEn   DateTime  @default(now())
  usadoEn    DateTime?
}

model Mensaje {
  id       String   @id @default(cuid())
  nombre   String
  email    String   @default("")
  telefono String   @default("")
  asunto   String   @default("Consulta")
  mensaje  String
  origen   String   @default("formulario")  // formulario | whatsapp
  leido    Boolean  @default(false)
  creadoEn DateTime @default(now())
}

/// Fila única (id = "sitio") con los textos y datos editables del sitio.
model Ajustes {
  id            String @id @default("sitio")
  nombreNegocio String @default("La bodega de la economía")
  eslogan       String @default("Un emprendimiento local para locales, donde ahorrar es la única opción. Visítanos y encarga cuando quieras.")
  direccion     String @default("Cooperativa La Cruz, Malleco #4, Rancagua")
  ciudad        String @default("Rancagua")
  telefono1     String @default("+56995415039")
  telefono2     String @default("+56941877683")
  whatsapp      String @default("+56995415039")
  horario       String @default("Lunes a sábado · 08:00 a 20:00")
  descripcion   String @default("Vendemos paltas, limones y naranjas al por mayor y al detalle. Traemos la fruta directo del productor y la dejamos al precio más conveniente de Rancagua, en cajas, bins o por kilo, para ferias, almacenes, restaurantes y para tu casa.")
  mapaUrl       String @default("")
  galeria       String @default("[]")   // JSON array de rutas de imagen
  actualizadoEn DateTime @updatedAt
}
```

### 2.2 `prisma/seed.ts` — datos iniciales

Precios de ejemplo (placeholders realistas para Rancagua, **editables desde el admin**):

| Producto | Detalle | Mayorista | Caja | Bin | Umbral |
|---|---|---|---|---|---|
| Palta Hass | $4.990/kg | $3.490/kg | $33.900 (10 kg) | $1.180.000 (400 kg) | 10 kg |
| Limón | $1.790/kg | $1.190/kg | $19.900 (18 kg) | $420.000 (400 kg) | 15 kg |
| Naranja | $1.490/kg | $990/kg | $16.900 (18 kg) | $360.000 (400 kg) | 15 kg |

Resto de campos por producto:

| Campo | Palta Hass | Limón | Naranja |
|---|---|---|---|
| `slug` | `palta-hass` | `limon` | `naranja` |
| `descripcion` | "Palta Hass de primera, cremosa y en su punto. La misma que llega a las ferias, directo a tu mesa." | "Limón de pulpa jugosa y cáscara firme. Ideal para local, cocina o reventa." | "Naranja dulce de jugo, cosechada a la semana. Rinde y no decepciona." |
| `imagenRecorte` | `/recortes/palta.png` | `/recortes/limon.png` | `/recortes/naranja.png` |
| `imagenTextura` | `/texturas/paltas.webp` | `/texturas/limones.webp` | `/texturas/naranjas.webp` |
| `colorAcento` | `#224621` | `#F5CD07` | `#FD7005` |
| `destacado` | `true` | `false` | `false` |
| `orden` | `0` | `1` | `2` |

> La palta es la única `destacado: true` — es la que aparece en el hero con la etiqueta de precio mayorista, tal como pidió el usuario.

El seed también:
- Crea el usuario admin inicial desde `ADMIN_EMAIL_INICIAL` / `ADMIN_PASS_INICIAL` (hash con bcrypt, 10 rondas).
- Inserta ese mismo correo en `CorreoAutorizado` con `usado: true`.
- Crea la fila `Ajustes` con id `"sitio"` (todos los defaults ya llevan los datos reales del negocio).

Añadir a `package.json`:
```json
"prisma": { "seed": "npx tsx prisma/seed.ts" },
"scripts": {
  "db:push": "prisma db push",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "imagenes": "python scripts/preparar-imagenes.py"
}
```
(instalar `tsx` como devDependency).

### 2.3 `src/lib/db.ts`
Singleton de PrismaClient con el patrón `globalThis` para evitar múltiples instancias en dev con HMR.

---

## FASE 3 — Autenticación y whitelist

### 3.1 `src/lib/sesion.ts`
- `crearSesion(usuarioId, email, rol)` → firma un JWT HS256 con `jose`, expira en 7 días, lo escribe en la cookie `bodega_sesion` (`httpOnly`, `sameSite: "lax"`, `secure` en producción, `path: "/"`).
- `leerSesion()` → lee y verifica la cookie; devuelve el payload o `null`.
- `cerrarSesion()` → borra la cookie.
- `requerirSesion()` → helper de server component: si no hay sesión, `redirect("/admin/login")`.

### 3.2 `middleware.ts`
Matcher `["/admin/:path*"]`. Deja pasar `/admin/login` y `/admin/registro`. Para el resto, verifica el JWT; si falla, redirige a `/admin/login?siguiente=<ruta>`.

### 3.3 Flujo de whitelist (esto es lo que pidió el usuario)
1. Un admin ya autenticado entra a **`/admin/accesos`** y escribe un correo + una nota opcional ("Contador", "Mi hermano"). Se crea un `CorreoAutorizado`.
2. La persona invitada entra a **`/admin/registro`**, escribe **ese mismo correo**, su nombre y una clave.
3. `POST /api/auth/registro` valida:
   - existe `CorreoAutorizado` con ese email → si no: `403` con mensaje **"Este correo no está autorizado. Pídele al dueño que lo agregue en el panel."**
   - `usado === false` → si ya se usó: `409` **"Este correo ya tiene una cuenta creada."**
   - clave ≥ 8 caracteres.
4. Se crea el `Usuario`, se marca `usado: true` + `usadoEn: now()`, se inicia sesión y se redirige a `/admin`.
5. En `/admin/accesos` cada fila muestra estado: **Pendiente** (ámbar) o **Cuenta creada** (verde), con botón para revocar. Revocar un correo pendiente lo borra; revocar uno usado también elimina al `Usuario` asociado (con diálogo de confirmación explícito que nombra el correo).

**Nunca se permite auto-registro sin invitación previa.** No hay pantalla de "olvidé mi clave" en esta versión: el admin revoca y vuelve a invitar.

---

## FASE 4 — API routes

Todas devuelven JSON. Todas las de escritura verifican sesión con `leerSesion()` y responden `401` si falta. Validación de cuerpo con `zod` en `src/lib/validaciones.ts`.

| Ruta | Métodos | Descripción |
|---|---|---|
| `/api/auth/login` | POST | `{email, clave}` → compara bcrypt, crea sesión, actualiza `ultimoAcceso`. Respuesta genérica ante credencial inválida ("Correo o clave incorrectos") para no filtrar qué correos existen. |
| `/api/auth/registro` | POST | Flujo de §3.3. |
| `/api/auth/logout` | POST | Borra cookie. |
| `/api/productos` | GET, POST | GET público devuelve solo `activo: true` ordenados por `orden`. GET con sesión devuelve todos. |
| `/api/productos/[id]` | GET, PATCH, DELETE | PATCH acepta actualización parcial (permite el toggle de activo con un solo campo). |
| `/api/productos/orden` | PATCH | `{ids: string[]}` → reescribe el campo `orden` según la posición del array (drag & drop). |
| `/api/upload` | POST | `multipart/form-data`. Valida MIME (`image/jpeg\|png\|webp\|avif`) y tamaño ≤ 8 MB. Con `sharp`: redimensiona a máx 1600 px de ancho, convierte a WebP q82, nombre `${slug}-${Date.now()}.webp`, guarda en `public/uploads/`. Devuelve `{url}`. Acepta `?tipo=recorte` para conservar el canal alfa (PNG q90 en vez de WebP). |
| `/api/accesos` | GET, POST | Listar / crear correo autorizado. |
| `/api/accesos/[id]` | DELETE | Revocar. |
| `/api/mensajes` | GET, POST | POST es **público** (formulario de contacto), con honeypot + límite de 5 envíos por IP cada 10 minutos en memoria. GET requiere sesión. |
| `/api/mensajes/[id]` | PATCH, DELETE | Marcar leído / borrar. |
| `/api/ajustes` | GET, PATCH | Fila única. |

---

## FASE 5 — Panel de administración (`/admin`)

**Principio rector: el dueño del local no es técnico.** Nada de jerga, nada de campos crípticos, todo en español chileno neutro, botones grandes, feedback inmediato.

### 5.1 Layout
- Barra lateral fija (colapsa a barra inferior con iconos en móvil): **Productos · Accesos · Mensajes · Ajustes · Salir**.
- Cabecera con el logo, el nombre del usuario y un badge con la cantidad de mensajes sin leer.
- Fondo `#F7FBFA`, tarjetas blancas con `--shadow-suave`, acento cyan. Sin modo oscuro.

### 5.2 `/admin` — inicio
Tres tarjetas-resumen grandes y clicables: *N productos activos* · *N mensajes sin leer* · *N accesos pendientes*. Debajo, accesos directos: "Agregar producto", "Cambiar precios", "Invitar a alguien".

### 5.3 `/admin/productos` — lista
- Filas arrastrables (drag handle) → guarda orden con `PATCH /api/productos/orden`, con toast "Orden guardado".
- Cada fila: miniatura, nombre, precio detalle, precio mayorista, **interruptor Activo/Oculto** que guarda al instante (optimistic UI + rollback si falla).
- Los productos ocultos se muestran con opacidad 55 % y la etiqueta **"No se ve en la página"** — que quede obvio qué significa el interruptor.
- Botón primario grande arriba a la derecha: **"+ Agregar producto"**.

### 5.4 `/admin/productos/[id]` — editor
Un solo formulario en tarjetas apiladas, con **barra de guardado fija abajo** que aparece solo cuando hay cambios sin guardar ("Tienes cambios sin guardar · Guardar / Descartar"). Aviso al salir con cambios pendientes.

**Tarjeta 1 — Lo básico:** Nombre · Descripción corta (contador de caracteres, recomendado ≤ 120) · Unidad de venta (selector: Kilo / Unidad / Malla).

**Tarjeta 2 — Precios.** Cuatro campos `CampoPrecio` con prefijo `$` visible, separador de miles automático mientras se escribe, y solo dígitos aceptados. Cada uno con un subtítulo que explica en palabras qué es:
- **Precio al detalle** — "Lo que paga alguien que lleva poca cantidad."
- **Precio al por mayor** — "Precio rebajado cuando llevan harto."
- **Precio por caja** — junto a un campo "¿Cuántos kilos trae la caja?".
- **Precio por bin** — junto a "¿Cuántos kilos trae el bin?".
- **"El precio por mayor se aplica desde"** `[__] kg` — es el `umbralMayorista`, y el texto de ayuda dice: *"En la calculadora de la página, al pasar esta cantidad se activa solo el precio rebajado."*

> **Dejar un campo de precio vacío significa "no lo vendo así"** y ese formato simplemente no aparece en la página. Este comportamiento debe estar escrito bajo los campos, en gris.

**Tarjeta 3 — Imágenes.** Dos `SubidorImagen` lado a lado con vista previa grande:
- *Foto de fondo* — "La foto que llena la tarjeta. Se ve mejor si es una foto de muchas frutas juntas."
- *Foto recortada (fondo transparente)* — "Esta es la fruta sola que flota sobre la tarjeta. Debe ser PNG con fondo transparente."
  Ambos: arrastrar-y-soltar, clic para elegir, barra de progreso, botón "Quitar". Si aún no hay imagen, muestra un botón "Usar la de la bodega" que asigna el recorte por defecto (`/recortes/palta.png`, etc.).

**Tarjeta 4 — Cómo se muestra.** Color de acento (paleta de 6 muestras predefinidas de la marca + selector libre) · Interruptor **Destacado en la portada** · Interruptor **Activo**.

**Panel lateral pegajoso: vista previa en vivo** de la tarjeta del catálogo tal como se verá en la página, actualizándose con cada tecla. Esto es lo que hace el panel realmente intuitivo — el dueño ve el resultado sin salir del formulario.

### 5.5 `/admin/accesos`
Campo de correo + nota + botón **"Invitar"**. Tabla con estado (Pendiente / Cuenta creada), fecha, quién invitó y botón revocar. Arriba, un recuadro explicativo cyan: *"Cuando agregas un correo aquí, esa persona puede entrar a **tudominio.cl/admin/registro** y crearse su cuenta con ese mismo correo. Nadie más puede."* con un botón "Copiar link de registro".

### 5.6 `/admin/mensajes`
Lista tipo bandeja de entrada. No leídos en negrita con punto cyan. Al abrir uno: datos del remitente y, si dejó teléfono, dos botones directos: **Llamar** (`tel:`) y **Responder por WhatsApp** (`wa.me` con un saludo prellenado citando su consulta). Filtros: Todos / Sin leer / Formulario / WhatsApp.

### 5.7 `/admin/ajustes`
Edita la fila `Ajustes`: nombre del negocio, eslogan del hero, dirección, ciudad, los dos teléfonos, el número de WhatsApp de la burbuja, horario, descripción del local, URL de Google Maps, y la **galería de fotos del local** (subida múltiple con reordenamiento por arrastre — alimenta el carrusel de la sección Ubicación).

---

## FASE 6 — Landing pública: sección por sección

### 6.0 Infraestructura de movimiento

**`SmoothScroll.tsx`** — envuelve el `children` del layout. Inicializa Lenis (`lerp: 0.085`, `wheelMultiplier: 1`, `smoothWheel: true`, `syncTouch: false` — en táctil se deja el scroll nativo, que se siente mejor y no rompe el pull-to-refresh). Conecta `lenis.raf` al `requestAnimationFrame` global. Se desactiva por completo bajo `prefers-reduced-motion`.

**`CapaParallax.tsx`** — props `{ profundidad: number; direccion?: "y"|"x"; escala?: [number,number]; rotacion?: number; children }`.
```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const suave = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: .5 });
const y = useTransform(suave, [0, 1], [`${profundidad * -100}px`, `${profundidad * 100}px`]);
```
Aplica también `scale` y `rotate` si vienen. En móvil multiplica `profundidad` por `0.5`.

**`TextoRevelado.tsx`** — divide el texto en palabras (y opcionalmente en caracteres). Cada unidad se envuelve en un `<span>` con `overflow: hidden` y el interior anima:
```
inicial: { y: "115%", opacity: 0, filter: "blur(10px)", rotateX: -35 }
final:   { y: "0%",   opacity: 1, filter: "blur(0px)",  rotateX: 0 }
transición: { duration: .9, ease: [.16,1,.3,1], delay: i * 0.045 }
```
Con `perspective: 800px` en el contenedor. Cada palabra debe conservar su espacio (`&nbsp;` entre spans) para que el texto siga siendo seleccionable y legible por lectores de pantalla — el texto completo va en un `<span class="sr-only">` y la versión animada lleva `aria-hidden`.

**`ObjetoFlotante.tsx`** — animación en bucle independiente del scroll, para los recortes:
```
animate: { y: [0, -18, 0], rotate: [-2, 2, -2] }
transition: { duration: 7 + indice * 1.3, repeat: Infinity, ease: "easeInOut" }
```
Duraciones **primas entre sí** (7, 8.3, 9.6, 11.1 s) para que nunca se sincronicen y el conjunto se vea orgánico. Incluye el `<div>` de sombra que se escala en contrafase.

**`TiltMouse.tsx`** — `useMotionValue` + `useSpring` sobre `rotateX/rotateY` (±10°) y traslación paralela (±14 px) según la posición del cursor normalizada respecto al centro del contenedor. **Solo se monta si `window.matchMedia("(hover: hover) and (pointer: fine)").matches`.** En móvil, opcionalmente, `DeviceOrientationEvent` con permiso explícito — si no hay permiso, el componente no hace nada y no muestra ningún prompt.

**`SeccionEntrada.tsx`** — wrapper con `whileInView`, `viewport={{ once: true, margin: "-15% 0px -15% 0px" }}`, que aplica el fade+rise estándar (`opacity 0→1`, `y 40→0`, `duration .8`).

---

### 6.1 Intro de entrada (`IntroOverlay.tsx`)

Overlay `position: fixed; inset: 0; z-index: 100`, fondo cyan `#1DA38C`. Secuencia total **1.9 s**:

| t | Evento |
|---|---|
| 0.0 s | `logo.png` centrado, `scale .82`, `opacity 0`, `blur(14px)`. |
| 0.0–0.7 s | Logo entra: `scale → 1`, `opacity → 1`, `blur → 0`. Ease `--ease-salida`. |
| 0.5–1.2 s | Aparece "LA BODEGA DE LA ECONOMÍA" bajo el logo, letra por letra (stagger 30 ms). |
| 1.2–1.9 s | **Cortina de máscara**: el overlay se retira con `clip-path: circle(140% at 50% 50%)` → `circle(0% at 50% 50%)`, revelando el hero por debajo. Simultáneamente el logo hace `scale 1 → 1.25` y `opacity → 0`. |
| 1.9 s | Se desmonta. Se libera el scroll (`document.body.style.overflow = ""` y `lenis.start()`). |

Durante el intro el scroll está bloqueado. Se guarda `sessionStorage["intro-vista"]` → **en recargas dentro de la misma sesión el intro no se repite** (solo un fade de 250 ms). Bajo `prefers-reduced-motion`, el intro dura 300 ms y es solo un fade.

---

### 6.2 Portada / Hero (`Hero.tsx`)

`min-height: 100svh` (unidad `svh`, no `vh` — evita el salto por la barra del navegador móvil). `position: relative; overflow: hidden`.

**Pila de capas, de atrás hacia adelante:**

| z | Capa | Contenido | Movimiento |
|---|---|---|---|
| 0 | Gradiente base | `linear-gradient(170deg, #E6FAF5 0%, #FFFFFF 55%, #F2FCF9 100%)` | estático |
| 1 | **Textura de paltas** | `/texturas/paltas.webp`, `object-fit: cover`, `scale(1.18)`, `filter: blur(14px) saturate(1.15) brightness(1.06)`, `opacity: .55` | parallax `profundidad .10` + `scale 1.18 → 1.26` con el scroll. Máscara: `radial-gradient(ellipse 120% 90% at 50% 20%, #000 30%, transparent 78%)` |
| 2 | Velo blanco | `linear-gradient(to bottom, rgba(255,255,255,.35), rgba(255,255,255,.85) 70%, #fff)` | estático — es lo que garantiza que el blanco domine y el texto sea legible |
| 3 | **Enjambre de paltas mini** | 4 recortes (`palta-mini-*.png` + `palta.png` pequeña) esparcidos: `(8%, 22%)` 120 px, `(88%, 16%)` 90 px, `(15%, 78%)` 100 px, `(80%, 72%)` 140 px | cada uno en `CapaParallax` con profundidad `.18 / .26 / .34 / .42` + `ObjetoFlotante` con duración distinta. `blur(2px)` los dos más lejanos. |
| 4 | Halo | Círculo `radial-gradient(circle, rgba(48,207,178,.32), transparent 65%)`, 520 px, detrás de la palta principal | `scale [1, 1.12]` en bucle de 6 s, `blur(40px)` |
| 5 | **Palta protagonista** | `/recortes/palta@2x.png`. **Dimensionar por ALTO** (`height: clamp(320px, 52svh, 620px); width: auto`) — la palta es retrato 0.73, si se fija el ancho queda enana o desbordada. Desktop: columna derecha. Móvil: centrada, detrás del texto con `opacity .92`, desplazada abajo. | `TiltMouse` (±10°) + `CapaParallax` profundidad `.55` + rotación `-6° → 4°` con el scroll. Entrada: `scale .7 → 1`, `y 60 → 0`, `rotate -14 → -4`, `duration 1.1`, delay 0.25 s tras el intro.<br>**Ojo:** el recorte ya viene inclinado ~12° a la izquierda. Las rotaciones del plan se suman a esa inclinación natural — no compensarla, se ve bien; solo no pasar de `-14°` o queda acostada. |
| 5b | **Etiqueta de precio** | Píldora blanca con `--shadow-flotante`, borde `--color-limon` 2 px, anclada al borde superior-izquierdo de la palta (`position: absolute; top: 12%; left: -18%`). Texto: `POR MAYOR` (10 px, tracking amplio, `--color-verde-600`) sobre `$3.490` (32 px, 800) + `/kg` (14 px). | Entra a los 1.1 s con `--ease-rebote`: `scale 0 → 1.08 → 1`, `rotate -12° → -6°`. Luego bucle sutil `rotate [-6, -4, -6]` 5 s. En móvil se ancla arriba-derecha con tamaño reducido. El precio viene del producto marcado `destacado`. |
| 6 | **Bloque de texto** | ver abajo | |
| 7 | Indicador de scroll | Línea vertical de 40 px con un punto que baja en bucle + "Desliza" | `opacity → 0` cuando `scrollY > 120` |

**Contenido del bloque de texto (textos exactos):**

- **Kicker** (sobre el título): píldora cyan translúcida — `Rancagua · Al por mayor y al detalle`
- **Título:** `La bodega de la economía`
  Renderizado con `TextoRevelado` en modo carácter, `--font-titulo`, `--texto-hero`, `line-height: .92`, `letter-spacing: -.03em`, color `--color-verde-700`. **"economía" va en `--color-cyan-500`** para partir la masa de texto. Salto de línea forzado: `La bodega` / `de la economía`.
- **Subtítulo** (aparece 0.5 s después del título, fade + y 20→0):
  > Un emprendimiento local para locales, donde ahorrar es la única opción. Visítanos y encarga cuando quieras.

  Máximo `52ch` de ancho, `--color-tinta-suave`, `--texto-cuerpo`, `line-height: 1.6`.
- **Botones** (aparecen 0.75 s después, stagger 80 ms):
  1. Primario: **"Ver precios"** — fondo `--color-verde-600`, texto blanco, radio completo, `padding: 18px 34px`. Hover: `translateY(-3px)` + sombra crece + un brillo diagonal que barre el botón. Ancla a `#catalogo` (scroll suave vía Lenis).
  2. Secundario: **"Escríbenos por WhatsApp"** — borde `--color-cyan-500` 2 px, texto `--color-cyan-600`, ícono de WhatsApp. Abre la burbuja.

**Transición de salida del hero:** al hacer scroll, todo el bloque de texto se desplaza `y: 0 → -80px` y `opacity: 1 → 0` en el rango `scrollYProgress [0, .6]`, mientras la palta protagonista sale más lento (`y: 0 → -30px`) — la diferencia de velocidad es la que produce la profundidad.

---

### 6.3 Transición Hero → Catálogo

Un `<div>` de 180 px de alto entre secciones con una **onda SVG** (`viewBox="0 0 1440 180"`, path suave) rellena de `--color-cyan-100`, que se desplaza horizontalmente `x: -60px → 60px` con el scroll. Sobre ella, 3 recortes pequeños de fruta "rodando" (`rotate: 0 → 180°` ligado al scroll). Esto elimina el corte seco entre secciones.

---

### 6.4 Catálogo (`Catalogo.tsx` + `TarjetaProducto.tsx`)

`id="catalogo"`, fondo blanco con un `radial-gradient` cyan muy tenue arriba.

**Encabezado:** kicker `Nuestros productos` · h2 **"Precios que se notan en el bolsillo"** (`TextoRevelado` por palabras) · bajada: *"Al detalle o al por mayor. Los mismos precios que le damos a las ferias, también para ti."*

**Grid:** `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`, `gap: 32px`. En móvil: 1 columna. Las tarjetas entran con stagger de 120 ms.

**Anatomía de `TarjetaProducto`** (alto ~460 px, radio 28 px, `overflow: hidden`, `position: relative`):

| Capa | Detalle |
|---|---|
| Fondo | `producto.imagenTextura` (o `/texturas/{slug}.webp`), `object-fit: cover`, `scale(1.08)`. **Zoom lento ligado al scroll:** `scale 1.08 → 1.16`. |
| Velo | `linear-gradient(to top, rgba(255,255,255,.97) 32%, rgba(255,255,255,.55) 62%, rgba(255,255,255,.15))` — la mitad inferior queda blanca y legible, la superior deja ver la textura. |
| Recorte flotante | `producto.imagenRecorte`, **alto 46 % de la tarjeta** (`height: 46%; width: auto`), centrado horizontal, `top: 8%`. `ObjetoFlotante` + sombra de contacto elíptica. Dimensionar por alto y no por ancho es lo que mantiene a las tres frutas del mismo tamaño óptico en el grid. |
| Contenido | Nombre (`--font-titulo`, 26 px, `--color-verde-700`) · descripción (14 px, `--color-tinta-suave`, 2 líneas máx con `line-clamp`) · **bloque de precios**. |

**Bloque de precios** — dos filas separadas por una línea de 1 px:
```
Al detalle          $4.990 /kg
Por mayor  🏷️       $3.490 /kg     ← fondo cyan-100, radio 12px, precio en verde-600
                    desde 10 kg    ← 11px, tinta-suave
```
Si hay `precioCaja` o `precioBin`, se añade una tercera línea compacta: `Caja 10 kg $33.900 · Bin 400 kg $1.180.000`.
**Sin botones "Agregar", sin carrito, sin cantidades** — es un catálogo de consulta, tal como se pidió.

**Interacciones de la tarjeta (solo desktop, `hover: hover`):**
- La tarjeta rota en 3D hacia el cursor: `rotateX/rotateY` ±6°, `perspective: 1000px`.
- El recorte se eleva: `translateY(-14px) scale(1.06)`, la sombra se difumina y aclara.
- La textura de fondo hace `scale(1.16)` y `saturate(1.12)`.
- Aparece un borde interior de 1 px con el `colorAcento` del producto.
- Duración 0.45 s, ease `--ease-salida`.

**Móvil:** sin hover; en su lugar, cuando la tarjeta entra en viewport, el recorte hace un rebote de asentamiento (`y: -20 → 0` con `--ease-rebote`).

---

### 6.5 Calculadora (`Calculadora.tsx`)

**Restricción del brief: "un apartado no muy alto"** → `padding-block: 72px`, altura total ≈ 420 px en desktop. Fondo `linear-gradient(120deg, #E6FAF5, #FFFFFF)` con una franja diagonal sutil.

**Layout desktop:** grid `.42fr / .58fr`. **Móvil:** columna única, la fruta arriba a 180 px.

**Columna izquierda — la fruta:**
- El recorte del producto seleccionado, **dimensionado por alto** `height: clamp(150px, 24svh, 260px); width: auto` (mismo motivo que en el hero: la palta es retrato y las otras dos cuadradas; igualando el ancho, la palta se vería el doble de grande). Con `ObjetoFlotante` suave.
- Debajo, tres botones-pastilla para elegir: **Palta · Limón · Naranja** (se generan desde los productos activos). El activo lleva fondo `--color-verde-600` y texto blanco; los otros, borde gris.
- **Transición al cambiar de fruta:** la saliente hace `scale .8, opacity 0, rotate -18°, blur(8px)` (0.35 s) y la entrante `scale .8 → 1, opacity 0 → 1, rotate 18° → 0, blur(8px) → 0` (0.45 s, `--ease-rebote`). Usar `<AnimatePresence mode="wait">` con `key={producto.slug}`.
- El halo radial detrás cambia de color al `colorAcento` del producto con una transición de 0.6 s.

**Columna derecha — el cálculo:**
1. Etiqueta: **"¿Cuántos kilos te llevas?"**
2. **Slider** (`<input type="range">` con estilos propios) de 1 a 100 kg, paso 1. Pista de 8 px de alto: el tramo recorrido se rellena con un gradiente `verde-600 → cyan-400`; **al superar el umbral mayorista el tramo pasado cambia a `--color-limon`**. El pulgar es un círculo blanco de 30 px con `--shadow-media` que crece a 34 px al arrastrar.
   - Bajo la pista, una **marca vertical en la posición del umbral** con la etiqueta `10 kg` — para que se vea a dónde hay que llegar.
   - `touch-action: none` en el pulgar y `height: 44px` de área táctil.
3. Junto al slider, un **campo numérico** sincronizado (permite escribir 250 kg, más allá del rango del slider; el slider se satura en 100).
4. **Resultado**, en una tarjeta blanca con `--shadow-media`:
   ```
   25 kg · Palta Hass
   Precio por kilo        $3.490
   ─────────────────────────────
   Total                  $87.250     ← 44px, 800, tabular-nums
                          [🏷️ PRECIO MAYORISTA]
   ```
   - El total **cuenta hacia el nuevo valor** con una animación de 0.4 s (`useSpring` sobre el número + `Intl.NumberFormat("es-CL")`), no salta de golpe.
   - Si `kilos < umbral`, bajo el total aparece: *"Te faltan 4 kg para el precio por mayor"* en `--color-naranja`, con el número animado.

5. **El sello de precio mayorista** (esto es lo que el usuario pidió explícitamente):
   - Aparece **solo** cuando `kilos >= umbralMayorista`.
   - Es una insignia rotada `-8°` junto al total: fondo `--color-limon`, texto `--color-verde-700` en `--font-titulo` 13 px con tracking `.12em`, borde punteado blanco de 2 px por dentro, radio 10 px, ícono 🏷️.
   - **Animación de estampado** (`--ease-rebote`, 0.5 s): `scale 2.4 → .92 → 1`, `rotate -22° → -8°`, `opacity 0 → 1`, y un anillo que se expande y desvanece desde el centro (`box-shadow: 0 0 0 0 rgba(245,205,7,.6)` → `0 0 0 24px transparent`). Al desaparecer: `scale → .6, opacity → 0` en 0.2 s.
   - Un `<span aria-live="polite" class="sr-only">` anuncia "Precio mayorista aplicado" para lectores de pantalla.

**Lógica de precio — `src/lib/precios.ts`:**
```ts
export function calcular(producto: Producto, kilos: number) {
  const usaMayorista =
    producto.precioMayorista != null && kilos >= producto.umbralMayorista;
  const unitario = usaMayorista
    ? producto.precioMayorista!
    : (producto.precioDetalle ?? producto.precioMayorista ?? 0);
  const total = unitario * kilos;
  const ahorro = usaMayorista && producto.precioDetalle
    ? (producto.precioDetalle - unitario) * kilos : 0;
  const faltan = usaMayorista ? 0 : Math.max(0, producto.umbralMayorista - kilos);
  return { unitario, total, usaMayorista, ahorro, faltan };
}
export const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP",
    maximumFractionDigits: 0 }).format(n);
```

Cuando `usaMayorista` y hay ahorro, mostrar una línea verde: *"Estás ahorrando $37.500"*.

**Nota:** la calculadora es **informativa**. Bajo el resultado, un botón secundario **"Encargar estos 25 kg por WhatsApp"** que abre la burbuja con el mensaje ya redactado.

---

### 6.6 Ubicación y contacto del local (`Ubicacion.tsx` + `CarruselFotos.tsx`)

Fondo `--color-verde-700` (verde profundo) con textura de paltas al 8 % de opacidad y `mix-blend-mode: overlay`. Texto en blanco/crema — corta el blanco dominante y da peso al cierre de la página.

**Layout:** grid `.45fr / .55fr`, gap 56 px. Móvil: apilado, carrusel primero.

**Izquierda:**
- h2 **"Ven a vernos"** (blanco, `TextoRevelado`).
- Dirección en un bloque destacado con ícono de pin:
  ```
  La bodega de la economía
  Cooperativa La Cruz, Malleco #4
  Rancagua
  ```
- **Descripción del negocio** (viene de `Ajustes.descripcion`, editable):
  > Vendemos paltas, limones y naranjas al por mayor y al detalle. Traemos la fruta directo del productor y la dejamos al precio más conveniente de Rancagua, en cajas, bins o por kilo, para ferias, almacenes, restaurantes y para tu casa.
- Horario con ícono de reloj.
- **Dos botones de llamada directa** — grandes, mínimo 56 px de alto (dedo pulgar), lado a lado en desktop y apilados en móvil:
  ```html
  <a href="tel:+56995415039">📞 +56 9 9541 5039</a>
  <a href="tel:+56941877683">📞 +56 9 4187 7683</a>
  ```
  Estilo: fondo `--color-cyan-400`, texto `--color-verde-700`, radio completo. Al presionar: `scale .97` y un anillo que se expande. Los números se muestran formateados con espacios (`+56 9 9541 5039`) pero el `href` va sin espacios.
- Un tercer botón fantasma: **"Cómo llegar"** → abre Google Maps con la dirección.

**Derecha — carrusel arrastrable:**
- Alto 460 px (desktop) / 320 px (móvil), radio 28 px.
- Fuente: `Ajustes.galeria` (JSON de rutas). **Si está vacía**, usa como respaldo las 3 texturas + el logo, para que nunca se vea roto.
- Implementación: `motion.div` con `drag="x"`, `dragConstraints` calculados sobre el ancho real del track, `dragElastic: .12`, `dragMomentum` activo. **Snap** al soltar: calcula el índice más cercano y anima con `useSpring`.
- Flechas circulares (solo desktop, aparecen al hacer hover) + puntos indicadores abajo (siempre visibles, área táctil de 44 px).
- La foto activa está a `scale(1)`; las vecinas a `scale(.92)` con `opacity .6` → sensación de profundidad dentro del carrusel.
- Autoplay cada 5 s, que **se detiene permanentemente** en cuanto el usuario arrastra o presiona una flecha.
- Cada slide hace un micro-paneo `x: -12px → 12px` ligado al scroll de la página (efecto Ken Burns).
- `cursor: grab` / `grabbing`. Navegación por teclado con flechas ← →.

---

### 6.7 Formulario de contacto (`FormularioContacto.tsx`)

Sección blanca, `max-width: 760px`, centrada. h2 **"Escríbenos"**, bajada: *"Cuéntanos qué necesitas y te respondemos altiro."*

Campos (todos con **label flotante** animada, no `placeholder` como etiqueta):
| Campo | Tipo | Reglas |
|---|---|---|
| Nombre | text | requerido, 2–60 |
| Correo | email | opcional, formato válido si viene |
| Teléfono | tel | opcional, `inputMode="tel"` |
| Asunto | select | Compra al detalle · Compra al por mayor · Cotización · Sugerencia · Reclamo · Otro |
| Mensaje | textarea | requerido, 10–1000, auto-resize, contador |
| `sitio_web` | text | **honeypot**, oculto con CSS, `tabindex="-1"`, `autocomplete="off"`. Si viene lleno → responder 200 sin guardar. |

**Detalles de interacción:**
- Al enfocar: el borde inferior se dibuja de izquierda a derecha en `--color-cyan-400` (0.35 s) y la label sube y encoge.
- Validación **al salir del campo** (blur), no mientras escribe. Error en `--color-naranja` con un shake horizontal de 0.3 s.
- Botón **"Enviar mensaje"** ancho completo en móvil. Estados: normal → cargando (spinner + "Enviando…") → éxito.
- **Éxito:** el formulario hace `scale .96 + opacity 0` y en su lugar entra una tarjeta verde con un check dibujado con SVG (`stroke-dasharray` animado) y el texto *"¡Listo! Recibimos tu mensaje. Te respondemos dentro del día."* + botón "Enviar otro".
- Envía a `POST /api/mensajes` con `origen: "formulario"`.
- `autocomplete` correcto en cada campo (`name`, `email`, `tel`) e `inputMode` apropiado — en móvil esto cambia el teclado que aparece.

---

### 6.8 Navegación flotante (`NavFlotante.tsx`) y footer

**Nav:** píldora `position: fixed; top: 20px`, centrada, `backdrop-filter: blur(16px)`, fondo `rgba(255,255,255,.78)`, borde 1 px `rgba(11,43,34,.08)`.
- **Oculta durante el hero**; entra desde arriba (`y: -80 → 0`) cuando `scrollY > 70svh`.
- Se oculta al bajar y reaparece al subir (patrón de dirección de scroll).
- Contenido: logo 32 px · enlaces *Productos · Calcular · Ubicación · Contacto* con un indicador que se desliza a la sección activa (`IntersectionObserver` + `layoutId` de Framer Motion) · botón WhatsApp.
- **Móvil:** solo logo + botón WhatsApp + un menú hamburguesa que despliega una hoja a pantalla completa con los enlaces (stagger de entrada 60 ms).

**Footer:** fondo `--color-verde-700`, logo, dirección, teléfonos, horario, enlaces de sección y `© 2026 La bodega de la economía · Rancagua`. Una franja superior de 6 px con el gradiente completo de la marca (cyan → verde → limón → naranja) — es el único lugar donde los cuatro colores conviven.

---

## FASE 7 — Burbuja de WhatsApp (`BurbujaWhatsApp.tsx`)

**Botón flotante (FAB):**
- `position: fixed; right: 20px; bottom: 20px; z-index: 60` (respetar `env(safe-area-inset-bottom)` en iOS).
- 62 px de diámetro, fondo `#25D366`, ícono oficial de WhatsApp en SVG blanco, `--shadow-flotante`.
- **Animación en reposo:** anillo de pulso cada 3.5 s (`box-shadow: 0 0 0 0 rgba(37,211,102,.5)` → `0 0 0 20px transparent`, 2 s).
- Entra 2.5 s después de cargar la página: `scale 0 → 1.15 → 1`, `--ease-rebote`.
- Tras 8 s sin interacción, aparece **una sola vez** un globo a la izquierda: *"¿Te ayudo con un precio?"* — se desvanece a los 6 s o al hacer clic. Se recuerda en `sessionStorage` para no repetirlo.
- Al abrirse el panel, el ícono rota 90° y se transforma en una X.

**Panel:** ancla inferior-derecha, 360 px de ancho (desktop) / `calc(100vw - 24px)` (móvil), máx 78svh de alto con scroll interno. Radio 22 px, `--shadow-flotante`.
- **Apertura:** `transform-origin: bottom right`, `scale .8 → 1`, `opacity 0 → 1`, `y 24 → 0`, 0.35 s `--ease-salida`. Cierre en 0.22 s.
- Se cierra con clic fuera, con `Escape`, o con la X. Foco atrapado dentro del panel mientras está abierto; al cerrar, el foco vuelve al FAB.

**Cabecera:** franja verde `#075E54`, avatar con `logo.png`, "La bodega de la economía" y bajo eso, en verde claro, "Normalmente responde en minutos".

**Cuerpo — mensaje de bienvenida** con estética de burbuja de chat entrante (blanco, esquina inferior izquierda en punta, con la hora), que entra con un typing indicator de tres puntos durante 600 ms:
> ¡Hola! 👋 Somos **La bodega de la economía**, en Rancagua.
> Vendemos paltas, limones y naranjas al por mayor y al detalle.
> Cuéntanos qué necesitas y te respondemos altiro.

**Formulario** (exactamente los campos pedidos):
1. **Nombre** — text, requerido.
2. **Asunto** — grid de 6 chips seleccionables (mejor que un `<select>` en móvil): **Compra · Venta · Cotización · Sugerencia · Reclamo · Otro**. El chip activo se llena de `--color-verde-600`.
3. **Mensaje** — textarea 3 filas, auto-resize, requerido.
4. Botón **"Enviar por WhatsApp"** ancho completo, verde `#25D366`, con el ícono.

**Construcción del deeplink — `src/lib/whatsapp.ts`:**
```ts
export function armarLinkWhatsApp(
  numero: string, nombre: string, asunto: string, mensaje: string
) {
  const tel = numero.replace(/\D/g, "");          // "56995415039"
  const texto =
    `¡Hola! Soy ${nombre.trim()}.\n` +
    `Asunto: ${asunto}\n\n` +
    `${mensaje.trim()}\n\n` +
    `— Enviado desde labodegadelaeconomia.cl`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}
```
- Abrir con `window.open(url, "_blank", "noopener,noreferrer")`.
- **En paralelo**, hacer `POST /api/mensajes` con `origen: "whatsapp"` para que la consulta también quede registrada en el panel — sin bloquear la apertura del enlace (`fetch(...).catch(() => {})`).
- El número sale de `Ajustes.whatsapp` (por defecto `+56995415039`).

**Integración con la calculadora:** el botón "Encargar estos 25 kg" abre la burbuja con el asunto preseleccionado en **Compra** y el mensaje prellenado:
> Quiero encargar 25 kg de Palta Hass. Según su calculadora serían $87.250 con precio mayorista. ¿Me confirman disponibilidad?

---

## FASE 8 — Móvil, rendimiento y accesibilidad

**El público objetivo es móvil. Esta fase no es opcional.**

### 8.1 Móvil
- Breakpoints: `< 480` (móvil chico), `480–767` (móvil), `768–1023` (tablet), `≥ 1024` (desktop).
- Usar `100svh` / `100dvh`, **nunca `100vh`**.
- Área táctil mínima 44×44 px en todo elemento interactivo.
- **Desactivar en móvil:** tilt por mouse, hovers 3D, el fondo con `blur(14px)` de gran superficie (sustituir por una versión ya desenfocada del archivo — el blur en tiempo real de una imagen a pantalla completa mata el rendimiento en gama media).
- Reducir los factores de parallax a la mitad.
- `overflow-x: hidden` en `html, body` + auditar que ningún elemento absoluto se salga (causa el scroll horizontal fantasma).
- Probar en 360×640 (Android gama baja), 390×844 (iPhone), 430×932.

### 8.2 Rendimiento
- Todas las imágenes con `next/image`, `sizes` correcto, `priority` **solo** en la palta del hero y la textura de paltas.
- `placeholder="blur"` con los `-blur.webp` generados en la Fase 1.
- Contenedores animados: `will-change: transform` **solo mientras animan** (quitarlo al terminar; dejarlo permanente consume memoria de GPU).
- `content-visibility: auto` + `contain-intrinsic-size` en las secciones bajo el pliegue.
- Fuentes con `display: "swap"` y `preload` solo la de títulos.
- **Objetivo medible:** Lighthouse móvil ≥ 90 en Performance, LCP < 2.5 s, CLS < 0.05, sin *long tasks* > 200 ms al hacer scroll.
- Verificar 60 fps en el scroll con el panel Rendimiento de Chrome (throttling 4× CPU).

### 8.3 Accesibilidad
- Contraste AA en todo texto. **Cuidado con el amarillo `#F5CD07`**: nunca texto amarillo sobre blanco — el sello mayorista lleva texto verde oscuro sobre fondo amarillo (ratio ≈ 8.9:1, correcto).
- Foco visible en todo: `outline: 3px solid var(--color-cyan-500); outline-offset: 3px`.
- Los textos animados llevan su versión completa en `.sr-only` y la animada con `aria-hidden="true"`.
- `alt` descriptivo real en cada imagen (`alt="Palta Hass partida por la mitad"`), `alt=""` en las decorativas.
- El panel de WhatsApp: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, trampa de foco, cierre con `Escape`.
- El slider: `aria-valuenow/min/max` y `aria-valuetext="25 kilos"`.
- Bloque `@media (prefers-reduced-motion: reduce)` global que anula duraciones, desactiva Lenis, congela los `ObjetoFlotante` y salta el intro.

---

## FASE 9 — Verificación final (checklist ejecutable)

Ejecutar y confirmar uno por uno. **No declarar la tarea terminada con ítems pendientes: si algo falla, arreglarlo o reportarlo explícitamente.**

**Recortes e imágenes**
- [ ] `limon.png` y `naranja.png` **no tienen sombra ni halo** al componerlos sobre blanco.
- [ ] `palta.png` conserva su borde rugoso e inclinación, sin píxeles comidos.
- [ ] Las tres frutas puestas lado a lado se ven del **mismo tamaño óptico** (esto es lo que verifica que el dimensionado por alto quedó bien).
- [ ] `palta@2x.png` < 600 KB. Las texturas WebP < 250 KB cada una.

**Landing**
- [ ] El intro corre una sola vez por sesión y libera el scroll al terminar.
- [ ] El título del hero se revela carácter a carácter; el texto queda seleccionable y accesible.
- [ ] Al hacer scroll en el hero, fondo, paltas mini y palta principal se mueven a velocidades **distintas y visibles**.
- [ ] La etiqueta de precio del hero muestra el precio mayorista del producto destacado, leído desde la base de datos.
- [ ] Las 3 tarjetas del catálogo muestran precio detalle y mayorista; **no hay ningún botón de "agregar"**.
- [ ] Desactivar un producto en el admin lo hace desaparecer de la landing tras recargar.
- [ ] La calculadora: cambiar de fruta anima la transición; el total cuenta suavemente.
- [ ] Al cruzar el umbral, el sello mayorista se estampa; al bajar, desaparece.
- [ ] Los dos botones de teléfono abren el marcador en un móvil real.
- [ ] El carrusel se arrastra con el dedo, hace snap y respeta los límites.
- [ ] El formulario guarda el mensaje y aparece en `/admin/mensajes`.
- [ ] Ninguna sección corta en seco: todas las fotos tienen máscara de desvanecido.

**WhatsApp**
- [ ] El link generado abre WhatsApp con nombre, asunto y mensaje correctamente formateados (probar con tildes y saltos de línea).
- [ ] La consulta queda además registrada en el panel.

**Admin**
- [ ] Sin sesión, `/admin/productos` redirige a login.
- [ ] Un correo **no** autorizado no puede registrarse (mensaje claro, no un 500).
- [ ] Un correo autorizado se registra y entra a la primera.
- [ ] Un correo ya usado no puede registrarse de nuevo.
- [ ] Cambiar un precio en el admin se refleja en la landing.
- [ ] Subir una imagen la guarda como WebP en `public/uploads/` y se ve en la vista previa.
- [ ] Reordenar productos por arrastre persiste tras recargar.
- [ ] Un archivo que no es imagen o pesa > 8 MB es rechazado con un mensaje entendible.

**Móvil y rendimiento**
- [ ] Sin scroll horizontal en 360 px de ancho.
- [ ] Lighthouse móvil ≥ 90 en Performance y ≥ 95 en Accesibilidad.
- [ ] Con `prefers-reduced-motion` activado, la página es totalmente usable y sin movimiento.
- [ ] El scroll se mantiene fluido en un dispositivo real de gama media.

---

## FASE 10 — README y entrega

`README.md` en español, escrito para el dueño del local, no para un programador:
1. Cómo levantar el sitio (`npm run dev`).
2. **Cómo entrar al panel** y cambiar un precio (con pasos numerados).
3. **Cómo invitar a alguien** para que se cree su cuenta.
4. Cómo cambiar la dirección, los teléfonos o el texto de la portada.
5. Cómo agregar un producto nuevo (incluye la recomendación de qué tipo de foto sube mejor).
6. Sección técnica al final: comandos, variables de entorno y la nota de migración a Postgres.

**Nota de migración (dejar escrita, no ejecutar):** para publicar en Vercel hay que cambiar el `provider` de Prisma a `postgresql`, apuntar `DATABASE_URL` a Neon o Supabase, correr `prisma migrate deploy`, y reemplazar la escritura en `public/uploads/` de `/api/upload` por Vercel Blob o Supabase Storage (el sistema de archivos de Vercel es de solo lectura). Todo lo demás funciona sin cambios.

---

## ANEXO A — Textos definitivos del sitio

| Ubicación | Texto |
|---|---|
| Kicker hero | `Rancagua · Al por mayor y al detalle` |
| Título hero | `La bodega de la economía` |
| Subtítulo hero | `Un emprendimiento local para locales, donde ahorrar es la única opción. Visítanos y encarga cuando quieras.` |
| CTA 1 / CTA 2 | `Ver precios` / `Escríbenos por WhatsApp` |
| H2 catálogo | `Precios que se notan en el bolsillo` |
| Bajada catálogo | `Al detalle o al por mayor. Los mismos precios que le damos a las ferias, también para ti.` |
| H2 calculadora | `Calcula lo que te llevas` |
| Bajada calculadora | `Elige la fruta, mueve los kilos y mira el precio. Al pasar el mínimo, se activa solo el precio mayorista.` |
| Sello | `PRECIO MAYORISTA` |
| H2 ubicación | `Ven a vernos` |
| H2 contacto | `Escríbenos` |
| Bajada contacto | `Cuéntanos qué necesitas y te respondemos altiro.` |
| Éxito contacto | `¡Listo! Recibimos tu mensaje. Te respondemos dentro del día.` |

---

## ANEXO B — Orden de ejecución recomendado

Construir en este orden permite ver resultados desde temprano y evita bloqueos:

1. **Fase 0** — setup, dependencias, tokens en `globals.css`.
2. **Fase 1** — script de preparación de imágenes. *Verificar visualmente los 3 recortes sobre blanco antes de seguir: sin sombra horneada, sin halo.*
3. **Fase 2** — Prisma, seed, `db.ts`. Confirmar con `npx prisma studio` que hay 3 productos.
4. **Fase 6.0** — componentes de `src/components/motion/`. Son la base de todo lo demás.
5. **Fase 6.2** — Hero completo. *Aquí ya se puede evaluar si la dirección visual convence.*
6. **Fase 6.4** — Catálogo leyendo de la base de datos.
7. **Fase 6.5** — Calculadora.
8. **Fase 6.6 / 6.7 / 6.8** — Ubicación, formulario, nav y footer.
9. **Fase 7** — Burbuja de WhatsApp.
10. **Fase 3 / 4** — Auth y API routes.
11. **Fase 5** — Panel de administración completo.
12. **Fase 6.1 / 6.3** — Intro y transiciones entre secciones (al final: son la capa de pulido).
13. **Fase 8** — Pasada de móvil, rendimiento y accesibilidad.
14. **Fase 9 / 10** — Verificación y README.

**Regla durante toda la ejecución:** no dejar `TODO`, ni componentes vacíos, ni datos inventados hardcodeados en el frontend. Todo precio, teléfono, dirección y texto editable sale de la base de datos.
