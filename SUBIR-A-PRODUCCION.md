# Subir cambios a producción

Esto es el paso a paso de todos los días: ya publicaste el sitio y quieres que
los cambios que hiciste en tu máquina se vean en `labodegadelaeconomia.cl`.

Para el montaje inicial —crear la base, crear la aplicación en cPanel, las
variables de entorno— está `DESPLIEGUE.md`, que además explica por qué el
hosting obliga a varias de las rarezas de acá.

No hay despliegue automático. Un `git push` no publica nada por sí solo: cPanel
no vigila GitHub. Tú entras a la Terminal de cPanel y corres los comandos.

## Antes de tocar nada: ¿qué cambiaste?

De esto depende cuántos pasos necesitas. Míralo en tu máquina:

```bash
git log --oneline --stat origin/main..HEAD
```

| Si cambiaste… | Necesitas |
|---|---|
| Solo componentes, estilos, textos, imágenes | pull, build, reiniciar |
| `package.json` (dependencias) | además, instalar |
| `prisma/schema.prisma` | además, generar y `db push` |
| Variables de entorno | se tocan en cPanel a mano, no viajan por git |

Ante la duda, corre todos los pasos. Ninguno rompe nada por correrse de más.

---

## Paso 0 — Publicar desde tu máquina

```bash
git add -A
```

```bash
git commit -m "Describe el cambio"
```

```bash
git push origin main
```

Y comprueba que el sitio compila **antes** de subirlo. Es mucho más barato
arreglarlo acá que en el hosting:

```bash
npm run build
```

## Paso 1 — Detener la aplicación

cPanel → **Setup Node.js App** → lápiz de editar en `bodega` → botón **Stop**.

Detener, no *Restart*. La cuenta tiene un techo de tareas —procesos e hilos
cuentan juntos— y el proceso que sirve el sitio compite por ese techo con el
compilador. Con la aplicación corriendo, el build muere a mitad de camino.

Sí, el sitio queda caído estos minutos. Es la diferencia entre unos minutos
abajo y un build que no termina nunca.

## Paso 2 — Traer el código

cPanel → **Terminal**:

```bash
source /home4/cla118604/nodevenv/bodega/24/bin/activate && cd /home4/cla118604/bodega && git pull
```

Las tres cosas van juntas a propósito. El `source` activa el entorno de Node de
cPanel, el `cd` te para en la carpeta de la aplicación. Si los corres sueltos y
la sesión se corta, terminas trabajando desde el home sin darte cuenta.

Si `git pull` se queja de cambios locales, mira qué son antes de descartarlos:

```bash
git status --short
```

Un ` D archivo` significa que ese archivo se borró en el servidor. Se recupera
con `git checkout -- <archivo>` y no se pierde nada.

## Paso 3 — Instalar dependencias

**Solo si cambió `package.json`.** Si no, sáltalo: es el paso más lento.

```bash
npm install --include=dev
```

El `--include=dev` no es opcional. La instalación de npm que deja el Node.js
Selector viene con `omit=dev`, y sin la bandera no bajan `typescript`,
`tailwindcss` ni `tsx`. El build muere buscándolos.

## Paso 4 — Base de datos

**Solo si cambió `prisma/schema.prisma`.**

```bash
npm run generate
```

```bash
npx prisma db push
```

`db push` compara el esquema con la base y aplica la diferencia. Cuando el
cambio puede costar datos, se detiene y avisa. **Hay que leer qué dice**, porque
hay dos advertencias muy distintas:

**Se acepta.** Agregar una columna o un índice a algo que ya existe:

```
A unique constraint covering the columns [x] on the table Y will be added.
If there are existing duplicate values, this will fail.
```

Ahí no se borra nada. Si Prisma te pide la bandera, córrelo con
`npx prisma db push --accept-data-loss`.

**No se acepta.** Cualquier cosa que hable de borrar:

```
You are about to drop the `productos` table, which is not empty (4 rows).
```

Eso borra datos de verdad. Corta ahí y revisa qué cambió en el esquema. Esta
advertencia aceptada por error es lo que una vez dejó la base vacía y hubo que
recargarla entera.

Para ver cómo quedó:

```bash
mysql -u cla118604_YO -p cla118604_bodega -e "SHOW TABLES;"
```

Pide la clave aparte, y así tiene que ser: pegada al comando con `-pCLAVE`
quedaría en `~/.bash_history` y a la vista de cualquier `ps`.

Los nombres de tabla distinguen mayúsculas en este servidor. Es `FROM Producto`,
no `FROM producto`.

## Paso 5 — Compilar

```bash
npm run build:hosting
```

El `:hosting` importa. Es el mismo `next build` con tres variables que bajan los
hilos que abre —el motor de Turbopack, el pool de Node y `sharp`— porque el
techo de tareas de la cuenta no da para los que abriría por defecto. En tu
máquina usa `npm run build` a secas, que es más rápido.

Tiene que llegar hasta la tabla de rutas. Compruébalo:

```bash
ls -la .next/BUILD_ID
```

Si dice `No such file or directory`, el build **no** terminó, aunque hayas visto
`Compiled successfully` más arriba. Esa línea es solo la primera etapa. No
sigas: mira la sección de errores más abajo.

## Paso 6 — Levantar el sitio

```bash
touch tmp/restart.txt
```

Ese archivo es la señal para que Passenger recargue el proceso. Si detuviste la
aplicación en el Paso 1, además hay que arrancarla: cPanel → **Setup Node.js
App** → botón **Start**.

`tmp/` no está en el repo. La primera vez hay que crearlo o el `touch` falla:

```bash
mkdir -p tmp && touch tmp/restart.txt
```

## Paso 7 — Comprobar

- Abre `labodegadelaeconomia.cl` y recarga con Ctrl+Shift+R, para saltarte el
  caché del navegador.
- Entra a `/admin/login` y confirma que puedes iniciar sesión.
- Si cambiaste productos o precios, míralos en la portada.

---

## Cuando algo sale mal

### La web muestra "We're sorry, but something went wrong"

Es Passenger diciendo que no pudo arrancar la aplicación. No dice por qué. Para
sacarle el error real, arranca el servidor a mano:

```bash
node server.js
```

Levanta y corta con Ctrl+C, o falla y te muestra el stack. Las dos causas que ya
aparecieron:

- **`Cannot find module '.../server.js'`** — el archivo no está. Se recupera con
  `git checkout -- server.js`. Un `git pull` no restaura archivos versionados
  que se borraron en el servidor: los deja borrados.
- **No existe `.next/BUILD_ID`** — el build nunca terminó y no hay sitio que
  servir.

### `tsx: command not found` o falta `typescript`

No están las devDependencies:

```bash
npm install --include=dev
```

### `spawn ... EAGAIN` o `OS can't spawn worker thread`

```
Error: spawn /opt/alt/alt-nodejs24/root/usr/bin/node EAGAIN
OS can't spawn worker thread: Resource temporarily unavailable (os error 11)
```

Es el techo de tareas de la cuenta, no un error de Next. Los dos mensajes son la
misma pared por puertas distintas: el primero al crear un proceso, el segundo al
crear un hilo.

Por orden:

1. Detén la aplicación desde cPanel, si no lo hiciste.
2. Usa `npm run build:hosting`, no `npm run build`.
3. Si insiste, limita los núcleos que ve el proceso, con lo que todos los pools
   se dimensionan más chicos:

```bash
taskset -c 0,1 npm run build:hosting
```

No sirve mirar `ulimit -u`: responde `unlimited` y engaña. El límite lo pone LVE
por su cuenta y no asoma ahí.

### `Symlink [project]/node_modules is invalid`

Ya está resuelto en `next.config.ts`. Si vuelve a aparecer, es que alguien tocó
la raíz de Turbopack ahí.

### El build se queda sin memoria

El plan tiene 2 GB para toda la cuenta:

```bash
NODE_OPTIONS=--max-old-space-size=1536 npm run build:hosting
```

---

## Plan B: compilar en tu máquina

Si el hosting no da para compilar, se compila afuera y se sube el resultado. El
`.next` no depende del sistema operativo — lo que sí depende vive en
`node_modules`, que se queda en el servidor.

En tu máquina:

```bash
npm run build
```

```bash
tar -czf next.tar.gz .next
```

Sube `next.tar.gz` por *File Manager* a `/home4/cla118604/bodega/`. Después, en
la Terminal de cPanel:

```bash
cd /home4/cla118604/bodega && rm -rf .next && tar -xzf next.tar.gz && rm next.tar.gz && touch tmp/restart.txt
```

Ese `rm -rf .next` borra el build anterior. Es salida del compilador y se
regenera entero con el que estás subiendo, así que no hay nada que rescatar
ahí — pero apunta bien la ruta antes de darle Enter.

---

## Lo que no viaja por git

- **Las variables de entorno.** Se editan en cPanel → *Setup Node.js App* →
  *Environment variables*, y la aplicación las lee al arrancar. Cuál es cuál
  está en `DESPLIEGUE.md` y en `.env.example`.
- **Las fotos que sube el panel.** Viven en `public/uploads/`, que está en
  `.gitignore`. Por eso `git pull` no las toca y sobreviven a cada
  actualización. La contracara es que no están en el repo: si algún día hay que
  rearmar el hosting, hay que respaldarlas aparte (*File Manager* → comprimir
  `public/uploads` → descargar).
- **Las cuentas del panel y los datos.** Viven en la base. Se administran desde
  el panel, o con `npm run usuario` para crear una cuenta o reponer una clave
  olvidada.
